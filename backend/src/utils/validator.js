const validator = require("validator");


// req.body = {firstName: "John", emailId: "john@example.com", password: "123456"}
// k = ["firstName", "emailId", "Password"]
const validate = (userData) => {

    const mandatoryFields = ["firstName", "emailId", "password"];

    const IsAllowed = mandatoryFields.every((k)=> Object.keys(userData).includes(k));

    if(!IsAllowed)
        throw new Error("Missing mandatory fields");

    if(!validator.isEmail(userData.emailId))
        throw new Error("Invalid email format");

    // if(!validator.isStrongPassword(userData.password))
    //     throw new Error("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one symbol.");
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if(!passwordRegex.test(userData.password)) {
    throw new Error("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)");
  }

};
module.exports = validate;