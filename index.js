// Place your server entry point code here
// Place your server entry point code here





const express = require('express')
const app = express()
const fs = require('fs')
const morgan = require('morgan')
const db = require('./src/services/database.js')
const arguments = require('minimist')(process.argv.slice(2))

// app.use(express.urlencoded({ extended: true}));
app.use(express.json());


const port = arguments.port || process.env.port || 5000

// Start an app server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%', port))
});


  
if (arguments.log == 'false'){
  console.log("not creating access.log")
} else{
  const WRITESTREAM = fs.createWriteStream('access.log', { flags: 'a' })
  // Set up the access logging middleware
  app.use(morgan('combined', { stream: WRITESTREAM }))
  
}

// Store help text 
const help = (`
server.js [options]
--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help	Return this message and exit.
`)

// If --help or -h, echo help text to STDOUT and exit
if (arguments.help || arguments.h) {
  console.log(help)
  process.exit(0)
}

app.use( (req, res, next) => {
  let logdata = {
      remoteaddr: req.ip,
      remoteuser: req.user,
      time: Date.now(),
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      httpversion: req.httpVersion,
      status: res.statusCode,
      referer: req.headers['referer'],
      useragent: req.headers['user-agent']
  }
  console.log(logdata)
  const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
  next();
});




if (arguments.debug || arguments.d){
    app.get('/app/log/access/', (req, res, next) => {
    const stmt = db.prepare('SELECT * FROM accesslog').all()
    res.status(200).json(stmt)

    })
    app.get('/app/error/', (req, res, next) => {
      throw new Error('Error')
    })
}


app.use(express.static('./public'))

app.get('/app/', (req, res, next) => {
  // Respond with status 200
      res.statusCode = 200;
  // respond with status message "OK"
      res.statusMessage = "Your API works!";
      res.writeHead(res.statusCode, {'Content-Type' : 'text/plain'})
      res.end(res.statusCode + ' ' + res.statusMessage);
      
  })

app.get('/app/flip/', (req, res) => {
   var flip = coinFlip()
   res.status(200).json({ 'flip' : flip })
})  


app.get('/app/flips/:number', (req, res) => {
    const finalFlips = coinFlips(req.params.number)
    res.status(200).json({ 'raw': finalFlips, 'summary': countFlips(finalFlips) })

}
)

app.get('/app/flip/call/heads', (req, res) => {
    const flipRandomCoin = flipACoin("heads")
    res.status(200).json( {"call": flipRandomCoin.call, "flip": flipRandomCoin.flip, "result": flipRandomCoin.result})
})

app.get('/app/flip/call/tails', (req, res) => {
    const flipRandomCoin = flipACoin("tails")
    res.status(200).json( {"call": flipRandomCoin.call, "flip": flipRandomCoin.flip, "result": flipRandomCoin.result})
})



// Default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')

})










// functions from previous assignment

function coinFlip() {
  return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
}

function coinFlips(flips) {
  const headsOrTails = []
  if (flips == null){
    headsOrTails.push(coinFlip())
    return headsOrTails
  }
  for (let x = 0; x < flips; x++){
    var outcome = Math.floor(Math.random() * 2) == 0 ? 'heads' : 'tails'
    headsOrTails.push(outcome)
  }
  

  return headsOrTails

  }

function countFlips(array) {
var dict = {};
dict = {heads: 0, tails: 0}

for (let x = 0; x < array.length; x++){
  if (array[x] == "heads"){
    dict.heads += 1

  }else{
    dict.tails += 1
  }
}
if (dict.heads == 0){
  delete dict["heads"]
} else if (dict.tails == 0){
  delete dict["tails"]
}
return dict
}

function flipACoin(call) {
  var flipCoin = {};
  var thisFlip = coinFlip()
  var final_result = ""
  if (call === thisFlip){
    final_result = 'win'
  } else{
    final_result = 'lose'
  }
  
  flipCoin = {call: call, flip: thisFlip, result: final_result}

  
  return flipCoin
}

process.on('SIGINT', () => {
  server.close(() => {
    console.log('\nApp terminated.')
  })
})
