// Parse.Cloud.define('hello', function(req, res) {
//   res.success('Hi');
// });

Parse.Cloud.beforeSave('ReservationReq', (req) => {
  logger.info('beforeSave')
})
Parse.Cloud.afterSave('ReservationReq', async (req) => {
  logger.info('afterSave')
  if (req.object.get('isApproved') === true) {
    return
  }

  let customer = req.object.get('customer')

  let amount = req.object.get('amount')
  let remaining = amount
  
  let date = req.object.get('date')
  // for querying
  let dateStart = new Date(date)
  dateStart.setHours(0,0,0,0)
  let dateEnd = new Date(date)
  dateEnd.setHours(23,59,59,999)

  
  // table
  let query = new Parse.Query('Tableja')
  query.ascending('TableNumber')
  let table = await query.find()
  for (var i = 0; i < tables.length; i++) {
    let t = tables[i]
    let reservList = await t.relation('Reservations')
    let r = await reservList.query()
                            .lessThanOrEqualTo('date', dateEnd)
                            .greaterThanOrEqualTo('date', dateStart)
                            .select("customer")
                            .first()
    
    // if table is available
    if (remaining > 0 && !r) {
      // save Reservation
      let newReserv = new Parse.Object('Reservation')
      newReserv.set('customer', customer)
      newReserv.set('Table', t)
      newReserv.set('date', date)
      await newReserv.save()

      // save Table relation
      reservList.add(newReserv)
      await t.save()

      remaining -= t.get('Seat')    // reduce the remaining amount
    }
  }
  
  req.object.set('isApproved', true)
  req.object.save()
});


// curl -X POST \
// -H "X-Parse-Application-Id: gOXzeflDQ8opBMiiGlk39sLiJZ5HoeHw6Z6JcTiz" \
// -H "Content-Type: application/json" \
// -d '{}' \
// http://localhost:1337/parse/functions/hello