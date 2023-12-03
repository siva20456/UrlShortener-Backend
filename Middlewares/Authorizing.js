const jwt = require('jsonwebtoken')


const authorizeTheUser = async(req,res,next) => {
    try{
      let jwt_token;
      const authHeader = req.headers['authorization']
      if(authHeader !== undefined){
        jwt_token = authHeader.split(" ")[1]
      }
      if(jwt_token === undefined){
        res.status(401).send({data:'Not Authorized Yet to add offer.'})
      }
      else{
        jwt.verify(jwt_token,'Secret Token',async(error,payload) => {
          if(error){
            res.status(401).send({data:'Not Authorized Yet to add offer.'})
          }
          else{
            const {username} = payload
            req['username'] = username
  
            next()
          }
        })
      }
    }
    catch(e){
      console.log(e)
      res.status(400).send({data:'Something went wrong... Please try again.'})
    } 
}

module.exports = authorizeTheUser