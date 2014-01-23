glisa
=====
Real time drawing + chat using [nodejs](http://nodejs.org/) and [socketstream](https://github.com/socketstream/socketstream). See demo at: http://glisa.herokuapp.com/

## Dev
### Setup
* install [nodejs](http://nodejs.org/) and [mongodb](http://www.mongodb.org/)
* sudo npm install socketstream mocha should -g
* npm install
* start mongodb
* node createtestusers.js

### Test
* start mongodb
* npm test or mocha -r should

### Run
* start mongodb
* node app.js
* open http://localhost:3000
