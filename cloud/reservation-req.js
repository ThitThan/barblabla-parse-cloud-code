// Parse.Cloud.afterSave('ReservationReq', (req) => {
//   console.log('afterSave')
//   if (req.object.get('isApproved') === true) {
//     return
//   }

//   var customer = req.object.get('customer')

//   var amount = req.object.get('amount')
//   var remaining = amount
  
//   var date = req.object.get('date')
//   // for querying
//   var dateStart = new Date(date)
//   dateStart.setHours(0,0,0,0)
//   var dateEnd = new Date(date)
//   dateEnd.setHours(23,59,59,999)

  
//   // table
//   var query = new Parse.Query('Tableja')
//   query.ascending('TableNumber')
//   query.find().then(
//     (tables) => {
//       for (var i = 0; i < tables.length; i++) {
//         var t = tables[i]
//         t.relation('Reservations').then(
//           (reservList) => {

//             reservList.query()
//             .lessThanOrEqualTo('date', dateEnd)
//             .greaterThanOrEqualTo('date', dateStart)
//             .select("customer")
//             .first()
//             .then(
//               (r) => {
//                 // if table is available
//                 if (remaining > 0 && !r) {
//                   // save Reservation
//                   var newReserv = new Parse.Object('Reservation')
//                   newReserv.set('customer', customer)
//                   newReserv.set('Table', t)
//                   newReserv.set('date', date)
//                   newReserv.save()
            
//                   // save Table relation
//                   reservList.add(newReserv)
//                   t.save()
            
//                   remaining -= t.get('Seat')    // reduce the remaining amount
//                 }

//               }
//             )
            

//           }
//         )
//       }
      
//       req.object.set('isApproved', true)
//       req.object.save()

//     }
//   )
// });
Parse.Cloud.afterSave('ReservationReq', (req) => {
  // console.log('afterSave!!')
  // request.log.info('afterSave!!')

  // customer
  var customer = req.object.get('customer')

  // amount
  var amount = req.object.get('amount')
  var remaining = amount
  
  // Dates for querying
  var date = req.object.get('date')
  var dateStart = new Date(date)
  dateStart.setHours(0,0,0,0)
  console.log('dateStart: ' + dateStart)
  var dateEnd = new Date(date)
  dateEnd.setHours(23,59,59,999)
  console.log('dateEnd: ' + dateEnd)

  // new Parse.Query('Reservation')
  // .lessThanOrEqualTo('date', dateEnd)
  // .greaterThanOrEqualTo('date', dateStart)
  // .select("customer")
  // .first()
  // .then(
  //   (r) => {
  //     console.log(r)
  //   }
  // )
  var reservQuery = new Parse.Query('Reservation')
  .lessThanOrEqualTo('date', dateEnd)
  .greaterThanOrEqualTo('date', dateStart)
  // .select("customer", 'date')

  reservQuery.find().then(
    (results) => {
      var reservedTableIds = []
      for (var i = 0; i < results.length; i++) {
        console.log(results[i].get('Table').id)
        // request.log.info(results[i].get('Table').id)

        reservedTableIds.push(results[i].get('Table').id)
      }
      console.log(reservedTableIds)

      // Table
      var tableQuery = new Parse.Query('Tableja')
      // .matchesKeyInQuery('objectIds', 'Tableja.objectId', reservQuery)

      tableQuery.find().then(
        (tables) => {
          // console.log(tables)
          for (var i = 0; i < tables.length; i++) {

            if (remaining <= 0) {
              break;
            }

            var t = tables[i]

            // if table is available
            console.log(reservedTableIds.includes(t.id) === false)
            request.log.info(reservedTableIds.includes(t.id) === false)
            if (reservedTableIds.includes(t.id) === false) {
              var tableNo = tables[i].get('TableNumber')

              // make reservation on the table
              var newReserv = new Parse.Object('Reservation')
              newReserv.set('customer', customer)
              newReserv.set('Table', t)
              newReserv.set('date', date)
              newReserv.set('request', req.object)
              newReserv.save()
              // .then(
              //   () => {
              //     // save Table relation
              //     t.relation('Reservations').add(newReserv)
              //     t.save()
              //   }
              // )

              remaining -= t.get('Seat')    // reduce the remaining amount
              console.log('reserved table ' + tableNo + ', ' + remaining + ' remaining')
            }
          }
        }
      )


    }
  )
});


// curl -X POST \
// -H "X-Parse-Application-Id: gOXzeflDQ8opBMiiGlk39sLiJZ5HoeHw6Z6JcTiz" \
// -H "Content-Type: application/json" \
// -d '{}' \
// http://localhost:1337/parse/functions/hello