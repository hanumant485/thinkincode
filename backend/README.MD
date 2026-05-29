authRouter.post('/register', register );
authRouter.post('/login', login );
authRouter.post('/logout', logout);
authRouter.get('/profile', getprofile);

we made this for clean syntex and this is called controller

7.npm i validate for to validate the user model that is required once(firstName, password, gmail)
8. npm i bcrypt for hashing the password
9.npm i jsonwebtoken for to give access to the authenticate user
10.npm i redis for to add the block list of logout users  
11. npm i axis

after creating the redis databse then we will connect the mongoDB and redis at once and then port will start to listen

pagination 
localhost: 3000/ problem/getAllProblem?page=2&limit=10
const page = 2
const limit = 10;
const skip = (page - 1)*limit
await Problem.find().skip.limit();


4:30
1:07


b7055c95acmsh34946e84e4e6f61p1448adjsn7ebce46cd253


<!-- Reference ID: DT20257537757  -->