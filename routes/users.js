var mongoose = require('mongoose')

var plm = require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/passport1");

var userSchema = mongoose.Schema({
  username : String,
  email  : String ,
  password  : String, 
  posts : [
   { 
    type  : mongoose.Schema.Types.ObjectId, 
     ref : "post"
   }
  ],
  photo : {
   type : String,
   default : "def.png"
  }, 
  key : {
    type : String,
    // default : "bla bla"
  }
})

userSchema.plugin(plm)

module.exports =  mongoose.model('user', userSchema)

