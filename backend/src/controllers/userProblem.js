const {getLanguageById,submitBatch,submitToken,submitSingleFallback} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")

const createProblem = async (req, res) => {
  const {
    title,
    description,
    difficulty,
    tags,
    visibleTestCases,
    hiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator,
  } = req.body;

  try {
    // Loop through each reference solution language
    for (const { language, completeCode } of referenceSolution) {
      const languageId = getLanguageById(language);

      // Prepare submissions for visible test cases
      const submissions = visibleTestCases.map((testcase) => ({
        source_code: completeCode,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));

      let testResult;
      try {
        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value) => value.token);
        testResult = await submitToken(resultToken);
      } catch (error) {
        // Fallback: If batch limits are exceeded (status 429), switch to single submissions
        if (error.response && error.response.status === 429) {
          testResult = await submitSingleFallback(submissions);
        } else {
          throw error;
        }
      }

      console.log(testResult);

      // Validate that all test cases passed
      for (const test of testResult) {
        if (test.status_id !== 3) {
          console.error('Test failed:', test);
          return res.status(400).json({
            message: 'Reference solution failed validation',
            details: {
              language,
              testCase: test,
              compile_output: test.compile_output,
              stderr: test.stderr,
            },
          });
        }
      }
    }

    // If all languages passed, save the problem to the database
    const userProblem = await Problem.create({
      ...req.body,
      problemCreator: req.result._id,
    });

    res.status(201).send('Problem Saved Successfully');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error: ' + err);
  }
};

const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not persent in server");
    }
      
    for(const {language,completeCode} of referenceSolution){

      const languageId = getLanguageById(language);
        
      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase)=>({
          source_code:completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
      }));

      let testResult;
      try {
        const submitResult = await submitBatch(submissions);
        const resultToken = submitResult.map((value)=> value.token);
        testResult = await submitToken(resultToken);
      } catch (error) {
        // Fallback: If batch limits are exceeded (status 429), switch to single submissions
        if (error.response && error.response.status === 429) {
          testResult = await submitSingleFallback(submissions);
        } else {
          throw error;
        }
      }

     for(const test of testResult){
      if(test.status_id!=3){
       return res.status(400).send("Error Occured");
      }
     }

    }

  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      res.status(500).send("Error: "+err);
  }
};

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
};

const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');

   if(!getProblem)
    return res.status(404).send("Problem is Missing");

   const videos = await SolutionVideo.findOne({ problemId: getProblem._id });

   if(videos){   
    
   const responseData = {
    ...getProblem.toObject(),
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   }
  
   return res.status(200).send(responseData);
   }
    
   res.status(200).send(getProblem);

  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags');

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
};

const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      
      res.status(200).send(user.problemSolved);

    }
    catch(err){
      res.status(500).send("Server Error");
    }
};

const submittedProblem = async(req,res)=>{

  try{
     
    const userId = req.result._id;
    const problemId = req.params.pid;

  const ans = await Submission.find({userId,problemId});
  
  if(ans.length==0) {
    return res.status(200).send("No Submission is persent");
  }

  return res.status(200).send(ans);

  }
  catch(err){
     res.status(500).send("Internal Server Error");
  }
};

module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};