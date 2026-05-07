 const jwt = require('jsonwebtoken');
    const User = require('../models/user');
    const redisClient = require('../config/redis');
 
 const userMiddleware = async (req, res, next)=>{
    try{
        const {token} = req.cookies;
        if(!token){
            console.log("Token not found in cookies. Available cookies:", Object.keys(req.cookies));
            return res.status(401).json({error: "Authentication token is missing. Please login first."});
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const {id:_id} = payload;

        if(!_id){
            return res.status(401).json({error: "Invalid token - no user ID found"});
        }

        const result = await User.findById(_id);

        if(!result){
            return res.status(401).json({error: "User account not found"});
        }

        // is token have block list in redis

const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            return res.status(401).json({error: "Token has been blacklisted. Please login again."});

        req.result = result;


        next();



    }
    catch(err){
        console.error("Auth middleware error:", err.message);
        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({error: "Token has expired. Please login again."});
        }
        if(err.name === 'JsonWebTokenError'){
            return res.status(401).json({error: "Invalid token format."});
        }
        return res.status(401).json({error: "Authentication failed: " + err.message});
    }
 }

 module.exports = userMiddleware;

// const userMiddleware = async (req,res,next)=>{

//     try{

//         const {token} = req.cookies;
//         if(!token)
//             throw new Error("Token is not persent");

//         const payload = jwt.verify(token,process.env.JWT_SECRET);

//         const {id: _id} = payload;

//         if(!_id){
//             throw new Error("Invalid token");
//         }

//         const result = await User.findById(_id);

//         if(!result){
//             throw new Error("User Doesn't Exist");
//         }

//         // Redis ke blockList mein persent toh nahi hai

//         const IsBlocked = await redisClient.exists(`token:${token}`);

//         if(IsBlocked)
//             throw new Error("Invalid Token");

//         req.result = result;


//         next();
//     }
//     catch(err){
//         res.status(401).send("Error: "+ err.message)
//     }

// }

// module.exports = userMiddleware;
