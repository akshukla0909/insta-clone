var mongoose = require('mongoose')

var postSchema = mongoose.Schema({

  userid  : {
     type : mongoose.Schema.Types.ObjectId,
     ref : "user"
  },
  post : String,
  username  : String,
  likes : [ {type : mongoose.Schema.Types.ObjectId, ref  : "user"} ],
  time : { type: Date,default : Date.now() }
})

module.exports =  mongoose.model('post', postSchema)

