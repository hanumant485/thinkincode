const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redisClient = require('../config/redis');
const Submission = require("../models/submission");



const register = async (req, res) => {
  try {
    validate(req.body);
    const { firstName, emailId, password } = req.body;
    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = 'user';
    const user = await User.create(req.body);
    res.status(201).json({
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role,
      },
      message: "Registration successful. Please login."
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res)=>{
    try{
        const {emailId, password} = req.body;

        if(!emailId)
            throw new Error("Email Id is required");

        if(!password)
            throw new Error("Password is required");

      const user = await User.findOne({emailId});
      if (!user) {
    throw new Error("Invalid credentials"); // generic message for security
}
     const match = await bcrypt.compare(password, user.password);
     if (!match) {
    throw new Error("Invalid credentials");
}

      const reply = {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
         role: user.role,
      }

      const token = jwt.sign({id:user._id, emailId:user.emailId, role:user.role},process.env.JWT_SECRET,{expiresIn: 60*60});
      
     res.cookie('token', token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
      path: '/'   // <-- add this
    });
      res.status(200).send({
        user: reply,
        message: "Login successful" 
      });

        

    }
    catch(err){
        res.status(401).send("error message: " + err);
    }
}

const logout = async (req, res)=>{
    try{

        const {token} = req.cookies;

        // add the token to redis blocklist with expiry time same as token expiry time

        const payload = jwt.decode(token);

        await redisClient.set(`token:${token}`, 'blocked')
        await redisClient.expireAt(`token:${token}`, payload.exp);

        res.cookie("token",null,{expires: new Date(Date.now()), path: '/'});
        res.status(200).send({message: "User logged out successfully"});

    }
    catch(err){
        res.status(400).send("error message: " +err);
    }
}

const adminRegister = async(req,res)=>{
    try{
         // validate the user data
       validate(req.body);

        const {firstName, emailId, password} = req.body;
        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'admin';
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({id:user._id , emailId:emailId, role:user.role},process.env.JWT_SECRET,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully as Admin");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);


    // Submission se bhi delete karo...
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}


module.exports = {register, login, logout, adminRegister, deleteProfile};