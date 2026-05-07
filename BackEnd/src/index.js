const express = require('express');
const app = express();
require(`dotenv`).config();
const main = require('./config/DB');
const cookieParser = require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require('./routes/problemCreator');
const aiRouter = require("./routes/aiChatting")
const submitRouter = require("./routes/submit");
const videoRouter = require("./routes/videoCreator");


const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);


const InitializeConnection = async()=>{
    try{
        await Promise.all([main(), redisClient.connect()]);
        console.log("MongoDB and Redis connections established successfully.");

        app.listen(process.env.PORT, ()=>{
            console.log("Server is running on port:" + process.env.PORT);
        });
    }
    catch(err){
        console.log("Error in initializing connections:", err);
    }
}

InitializeConnection();

