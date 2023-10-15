var express = require('express');
var router = express.Router();
var userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mailer = require('../nodemailer');
const crypto = require('crypto')


const LocalStrategy = require('passport-local');
const { ideahub } = require('googleapis/build/src/apis/ideahub');
passport.use(new LocalStrategy(userModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/Uploads')  
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
    cb(null, uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/reset/:id', async function(req,res,next){
    // console.log(req.params.id)
    const user = await userModel.findOne({_id : req.params.id})
    console.log(user)
    if(req.body.password === req.body.confirmpassword){

      user.setPassword(req.body.confirmpassword, async function(err,user){
             if(err){
              res.json("password save nhi hua")
             }
             else{
              user.key = "";
             await user.save();
              req.login(user, function  (err) {
                      if (err) { return next(err); }
                      return res.redirect('/profile');
                    });
             }
      });
    }
    else{
      res.send("password dont match")
    }
})

router.get('/forgot/:id/:key', async function(req,res,next){
      const user = await userModel.findOne({id : req.params._id})
       if( user.key === req.params.key){
        res.render("reset", {user : user})
       }
       else{
        res.send("chor / mail issue / or link expired")
       }
})


// page render hoga forgot 
router.get('/forgot', function(req,res){
  res.render('forgot')
})
// ye post forget route hai
router.post('/forgot' , async function(req,res){
    const user = await  userModel.findOne({email : req.body.email})

    if(!user){
      res.send("if user exist, we have sent a email")
    }
    else{
       const key = crypto.randomBytes(80);
      //  console.log("old", user.key)
       user.key = key.toString('hex')
       await user.save();
       await mailer(req.body.email, user._id, user.key).then(function(){
        res.send("mail sent")
       })
      //  console.log(user.key);
    }
})

// router.post('/update', isLoggedIn, function (req, res, next) {
//   userModel
//   .findOneAndUpdate({username: req.session.passport.user}, {username: req.body.username}, {new: true})
//   .then(function(updateduser){
//     req.login(updateduser, function(err) {
//       if (err) { return next(err); }
//       return res.redirect('/profile');
//     });
//   })
// });

router.post('/update',  function(req,res){
    // console.log(res)
    const h = req.body.username
    console.log(h);
    res.send("okay")
})

router.post('/upload' , isLoggedIn, upload.single('image'),function(req,res,next){
   userModel.findOne({username : req.session.passport.user})
   .then(function(founduser){
    if(founduser.photo !== 'def.png'){
      fs.unlinkSync(`./public/images/Uploads/${founduser.photo}`);
  }
    founduser.photo = req.file.filename
    founduser.save()
    .then(function(){
      res.redirect('back')
    })
   })
})

router.get('/check/:params', function(req,res,next){
  const user = req.params.params
  userModel.findOne({username  : req.session.passport.user})
  .then(function(loggeduser){
    if(loggeduser.username === user){
      res.json(false)
    }
    else{
      res.json(true)
    }
  })
  res.end();
})

router.get('/edit', isLoggedIn,function(req, res, next) {
  userModel.findOne({username : req.session.passport.user})
  .then(function(user){
    res.render('edit',{user} );

  })
});

router.get('/like/:postkiid', isLoggedIn, function(req,res, next){  
  userModel.findOne({username : req.session.passport.user})
  .then(function(founduser){
   postModel.findOne({_id  : req.params.postkiid})
   .then(function(post){
    const userIndex = post.likes.indexOf(founduser._id);
    if (userIndex === -1) {
      // User has not liked the post, so add the like
      post.likes.push(founduser._id);
    } else {
      // User has liked the post, so remove the like
      post.likes.splice(userIndex, 1);
    }
    // post.likes.push(founduser._id);
    post.save()
    .then(function(){
      res.redirect('back')
    })
   })
  })
})

// router.get('/like/:postid', isLoggedIn, function(req, res, next) {
//   userModel.findOne({ username: req.session.passport.user })
//     .then(function(founduser) {
//       postModel.findOne({ _id: req.params.postid })
//         .then(function(post) {
//           // if (!post) {
//           //   // Post not found
//           //   return res.status(404).send("Post not found");
//           // }

//           // if (!Array.isArray(post.likes)) {
//           //   post.likes = []; // Initialize likes as an array if not already
//           // }

//           post.likes.push(founduser._id);
//           post.save()
//             .then(function() {
//               res.redirect('back');
//             })
//             .catch(function(error) {
//               // console.error("Error saving post:", error);
//               // res.status(500).send("Error saving post");
//             });
//         })
//         .catch(function(error) {
//           // console.error("Error finding post:", error);
//           // res.status(500).send("Error finding post");
//         });
//     })
//     .catch(function(error) {
//       // console.error("Error finding user:", error);
//       // res.status(500).send("Error finding user");
//     });
// });

router.get('/delete/:_id', isLoggedIn, function(req,res,next){
  const id = req.params.id;
  postModel.findOneAndDelete(id).then(function(dlt){
    res.redirect('back');
  })
})

router.get('/feed', isLoggedIn, function(req,res,next){
  postModel.find()
  .populate("userid")
  .then(function(posts){
  console.log(posts);
    res.render('feed' , {posts})
  })
})

router.post('/post',isLoggedIn,function(req,res,next){
  // post par jaise hi click hoga, hum bolenge usermodel me dekho kaun login hai uski id
  // le kar post create kar denge
  userModel.findOne({username : req.session.passport.user})
  .then(function(founduser){
    // var newPost = 
    postModel.create({
      post : req.body.post,
      userid : founduser._id
      // username  :req.session.passport.user,
    }).then(function(createdPost){
      founduser.posts.push(createdPost._id);
      founduser.save()
      .then(function(){
        res.redirect('back')
      })
    })
  })
})

router.get('/profile', isLoggedIn ,function(req,res,next){
  // const user = req.user
  userModel.findOne({username: req.session.passport.user})
  .populate("posts")
  .then(function(user){
    // console.log(user);
    res.render('profile', {user})
  })
   
})

router.post('/register', function(req,res,next){
   userModel.findOne({username : req.body.username}).then(function(crtuser){
    if(crtuser){
      res.send("username already exist")
    }
    else{
      var newUser = new userModel({
       email : req.body.email,
       photo : req.body.photo,
       username : req.body.username,
     })
     userModel.register(newUser, req.body.password)
      .then(function(u){
       passport.authenticate('local')(req,res,function(){
         res.redirect('/profile')
       })
      })
      .catch(function(e){
       res.send(e)
     })   
    }
   })
})

router.get('/login', function(req,res,next){
  res.render('login')
})

router.post('/login', passport.authenticate('local',{
  successRedirect : '/profile',
  failureRedirect : '/login'
}), function(req,res, next){
});

router.get('/logout', function(req, res,next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
})

function isLoggedIn(req,res,next){
   if(req.isAuthenticated()){
    return next();
   }
   else {
    res.redirect('/login')
   }
}

module.exports = router;
