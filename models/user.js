var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({  
  local: {
    name: String,
    email: String,
    password: String,
  },
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String,
    username: String,
  },
  twitter: {
    id: String,
    token: String,
    displayName: String,
    username: String,
  },
  google: {
    id: String,
    token: String,
    email: String,
    name: String,
  },
  places:[{
    name : String,
    address: String,
     }]
});


module.exports = mongoose.model('User', userSchema);  