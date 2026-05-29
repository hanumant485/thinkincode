const mongoose = require('mongoose');

async function main(){
   try {
        await mongoose.connect(process.env.DB_URL);
        console.log("✅ Database connected successfully");
    } catch (err) {
        throw err; 
    }

}

module.exports = main;