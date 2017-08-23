const express = require('express');
const mongoose = require('mongoose');

const path = require('path');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

const yelp = require('yelp-fusion');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL,{useMongoClient:true});
let db = mongoose.connection;


// Check connection
db.once('open', function(){
console.log('Connected to MongoDB');
});
// Check for DB errors
db.on('error', function(err){
console.log(err);
});

// Init App

const app = express();


// Load View Engine
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


// Express Session Middleware
app.use(session({
	secret: 'bloodfiredeath',
	resave: true,
	saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express Validator Middleware
app.use(expressValidator({
	errorFormatter: function(param, msg, value) {
	var namespace = param.split('.')
	, root = namespace.shift()
	, formParam = root;
	while(namespace.length) {
	formParam += '[' + namespace.shift() + ']';
	}
	return {
	param : formParam,
	msg : msg,
	value : value
	};
}
}));

// Passport Config

require('./config/passport')(passport);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
app.get('*', function(req, res, next){
	res.locals.user = req.user || null;
next();
});

// Home Route
app.get('/', function(req, res){
 
	res.render('index', {

    title:'Where are you?'
	});
});

app.post('/findplaces',function(req,res){
let place = req.body.place;
if(place !== ''){
  const clientId = process.env.clientID;
const clientSecret = process.env.clientSecret;

const searchRequest = {
  term:'bars',
  location: place
  
};

yelp.accessToken(clientId, clientSecret).then(response => {
  const client = yelp.client(response.jsonBody.access_token);

  client.search(searchRequest).then(response => {
      //console.log(response.jsonBody.businesses.length);
    const firstResult = response.jsonBody.businesses[0];
    const prettyJson = JSON.stringify(firstResult, null, 4);
    //console.log(prettyJson);
    
    const results =response.jsonBody.businesses;
    let points = results.map(function(result){
      return result.coordinates;
    })
  
    console.log(points);
    req.session.place = place;
    req.session.results = results; 
  if(req.user){
    res.render('listplaces',{
    results: results,
      points:points,
      user:req.user
  });
  }else{
    res.render('listplaces',{
    results: results,
      points:points
  });
  }
  });
}).catch(e => {
  console.log(e);
});  

}else{
  res.redirect('/');
}
 
})

app.get('/listplaces',function(req,res){
  let results =[];
  if(req.session.results){
    results = req.session.results;
  }
  res.render('listplaces', {
    results: results
  });
})

// User routes

let users = require('./routes/users');
app.use('/users', users);


// Start Server
app.listen(3000, function(){
console.log('Server started on port 3000...');
});