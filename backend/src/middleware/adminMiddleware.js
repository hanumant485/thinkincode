const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis")

const adminMiddleware = async (req,res,next)=>{

    try{

        const {token} = req.cookies;
        if(!token){
            console.log("Token not found in cookies for admin request");
            return res.status(401).json({error: "Authentication token is missing. Please login first."});
        }

       const payload = jwt.verify(token, process.env.JWT_SECRET);

        const {id:_id, role} = payload;

        if(!_id){
            return res.status(401).json({error: "Invalid token - no user ID found"});
        }

        if(role !== 'admin'){
            return res.status(403).json({error: "Admin access required. You don't have permission to access this resource."});
        }

        const result = await User.findById(_id);

        if(!result){
            return res.status(401).json({error: "User account not found"});
        }

        // Blocklist check
        const IsBlocked = await redisClient.exists(`token:${token}`);

        if(IsBlocked)
            return res.status(401).json({error: "Token has been blacklisted. Please login again."});

        req.result = result;

        next();
    }
    catch(err){
        console.error("Admin middleware error:", err.message);
        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({error: "Token has expired. Please login again."});
        }
        if(err.name === 'JsonWebTokenError'){
            return res.status(401).json({error: "Invalid token format."});
        }
        return res.status(401).json({error: "Authentication failed: " + err.message});
    }

}


module.exports = adminMiddleware;
