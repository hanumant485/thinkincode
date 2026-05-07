const mongoose = require('mongoose');
const { Schema} = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 20,
    },
    lastName: {
        type: String,
        minLength: 3,
        maxLength: 20,
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        immutable: true,
    },
    age: {
        type: Number,
        min: 1,
        max: 150
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    problemSolved: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'problem',
        }],
        default: []
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
    }
},
{
    timestamps:true
});

userSchema.post('findOneAndDelete', async function (userInfo) {
    if (userInfo) {
      await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});


// const User = mongoose.model("user",userSchema);

const User = mongoose.models.user || mongoose.model("user", userSchema);

module.exports = User;