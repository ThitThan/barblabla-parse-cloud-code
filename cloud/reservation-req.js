Parse.Cloud.afterSave('ReservationReq', (req) => {
  console.log('afterSave')
  if (req.object.get('isApproved') === true) {
    return
  }

  var customer = req.object.get('customer')

  var amount = req.object.get('amount')
  var remaining = amount
  
  var date = req.object.get('date')
  // for querying
  var dateStart = new Date(date)
  dateStart.setHours(0,0,0,0)
  var dateEnd = new Date(date)
  dateEnd.setHours(23,59,59,999)

  
  // table
  var query = new Parse.Query('Tableja')
  query.ascending('TableNumber')
  query.find().then(
    (tables) => {
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i]
        t.relation('Reservations').then(
          (reservList) => {

            reservList.query()
            .lessThanOrEqualTo('date', dateEnd)
            .greaterThanOrEqualTo('date', dateStart)
            .select("customer")
            .first()
            .then(
              (r) => {
                // if table is available
                if (remaining > 0 && !r) {
                  // save Reservation
                  var newReserv = new Parse.Object('Reservation')
                  newReserv.set('customer', customer)
                  newReserv.set('Table', t)
                  newReserv.set('date', date)
                  newReserv.save()
            
                  // save Table relation
                  reservList.add(newReserv)
                  t.save()
            
                  remaining -= t.get('Seat')    // reduce the remaining amount
                }

              }
            )
            

          }
        )
      }
      
      req.object.set('isApproved', true)
      req.object.save()

    }
  )
});


// curl -X POST \
// -H "X-Parse-Application-Id: gOXzeflDQ8opBMiiGlk39sLiJZ5HoeHw6Z6JcTiz" \
// -H "Content-Type: application/json" \
// -d '{}' \
// http://localhost:1337/parse/functions/hello