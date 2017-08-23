var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var passport = require('passport');
// Bring in User Model
var User = require('../models/user');

// Register Form
router.get('/register', function(req, res){
	res.render('register');ces

});

// Register Process
router.post('/register', function(req, res){

	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	var password2 = req.body.password2;
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();

	req.sanitize('name').escape();
        req.sanitize('name').trim();

	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
	var errors = req.validationErrors();
	if(errors){
	res.render('register', {
	errors:errors
	});
	} else {
	var newUser = new User({
	local:{name:name,
	email:email,
	password:password
	}
	});
	bcrypt.genSalt(10, function(err, salt){
	bcrypt.hash(newUser.local.password, salt, function(err, hash){
	if(err){
	console.log(err);
	}
	newUser.local.password = hash;
	newUser.save(function(err){
	if(err){
	console.log(err);
	return;
	} else {
	req.flash('success','You are now registered and can log in');
	res.redirect('/users/login');
	}
	});
	});
	});
	}
});


// Login Form
router.get('/login', function(req, res){
	res.render('login');
});

// Login Process
router.post('/login', function(req, res, next){

	passport.authenticate('local', {
	successRedirect:'/listplaces',
	failureRedirect:'/users/login',
	failureFlash: true
	} )(req,res,next);
});

// logout
router.get('/logout', function(req, res){
	req.logout();
	req.flash('success', 'You are logged out');
	res.redirect('/users/login');
});

//user chooses a place to go
router.post('/places',function(req,res){

  let query = {_id :req.user};
  
  let index = req.body.index;
  
  let new_place = {
    name: req.session.results[index].name,
    address: req.session.results[index].location.display_address
  }
  
  let push_place ={ $push:{ "places": new_place}};
  
  User.update(query,push_place,function(err){
      if(err){
      return err;
      }else{
      req.flash('success', 'Cheers!');
          res.redirect('/users/myplaces');
       }
      });
});

router.post('/places/cancel', function(req,res){
  let query = {_id :req.user};
  let placename = req.body.placename;
  User.update(query,
    { $pull: { places: {name:placename}}},function(err,user){
    
    if(err) return err;
    req.flash('success', 'Deleted!');
    User.findById(req.user,function(err,user){
      if(err) return err;
      let results = user.places;
       res.render('myplaces', {
         results: results,
         user: req.user
      });
    })
  })
 })

router.get('/myplaces',function(req,res){
 let query={_id:req.user};
  User.findById(req.user,function(err,user){
    if(err) return err;
    let results = user.places;
     res.render('myplaces', {
    results: results
  });
  })

})

// Facebook routes
router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {  
  successRedirect: '/',
  failureRedirect: '/users/login',
	failureFlash: true
}));

// Twitter routes
router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback', passport.authenticate('twitter', {  
  successRedirect: '/',
  failureRedirect: '/users/login',
failureFlash: true
}));


module.exports = router;