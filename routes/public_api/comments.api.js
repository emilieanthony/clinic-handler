const CommentSchema = require('../../models/comment');

const comments = (req, res) => {
  CommentSchema.find(function(error, result){
    console.log(error)
    console.log(result)
    res.status(200).json(result);
  })
};



module.exports = comments;
