const jwt = require("jsonwebtoken");

const auth = function (req, res, next) {
    try {
        let token = req.headers["authorization"];

        if(typeof token === "undefined"){ 
            return res.status(400).send({status: false, message:"Please Enter token"})
        }
        const bearer = token.split(" ");
        const bearerToken = bearer[1]
    
        jwt.verify(bearerToken,'shoppingCart',function (err, data) {
        if(err){
            return res.status(401).send({ status: false, message: err.message})
        }else{
            req.userId = data.userId;
            next()
        }
    })
    } catch (error) {
       return res.status(500).send({status:false, message: error.message}) 
    } 
};


module.exports = auth