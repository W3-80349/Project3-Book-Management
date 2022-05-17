const jwt = require('jsonwebtoken')
const bookModel = require("../models/BookModel")
require("dotenv").config()


const authentication = (req,res,next)=>{
    try{
    let token = req.headers["x-auth-token"||"X-Auth-Token"]
    if (!token) {
       return res.status(400).send({ status:false,message: "no token found" })
    }
    let decodedToken = jwt.verify(token, process.env.SECRET_KEY)
    if(!decodedToken){
       return res.staus(401).send({status:false,message:"Invalid token"})
    }
   
    next();
}catch(err){
    res.status(500).send({status:false,message:err.message})
}
}


const authorization=async (req, res, next)=>{
    try{
    let token = req.headers["x-auth-token"||"X-Auth-Token"]
    if (!token) {
     return   res.status(400).send({ status:false,message: "no token found" })
    }
    let decodedToken = jwt.verify(token, "This is project 3")
    if(!decodedToken){
      return  res.staus(401).send({status:false,message:"Invalid token"})
    }
    let Id = req.params.bookId

    let Book = await bookModel.findOne({_id:Id})
    
    if(!Book){
      return  res.status(404).send({status:false, message:"No book found with given Id" })
    }
    if(decodedToken.userId != Book.userId){
       
       return res.status(401).send({status:false, message:"User Not authorized!" })
    }
    next()
}catch(err){
    res.status(500).send({status:false,message:err.message})
}
}

module.exports={authentication, authorization}