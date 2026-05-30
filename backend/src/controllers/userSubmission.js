const Problem = require("../models/problem");
const Submission = require("../models/submission");
const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const User = require('../models/user');

const submitCode = async (req,res)=>{
   
    // code submit
    try{
       const userId = req.result._id;
       const problemId = req.params.id;

       let {code,language} = req.body;

      if(!userId||!code||!problemId||!language)
        return res.status(400).send("Some field missing");

      if (language === 'cpp')
        language = 'c++';

      console.log(language);

    //    Fetch the problem from database
       const problem =  await Problem.findById(problemId);

    //    testcases(Hidden)

    //   Kya apne submission store kar du pehle....
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length
        })

    //    Judge0 code ko submit karna hai

    const languageId = getLanguageById(language);

    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));


    const submitResult = await submitBatch(submissions);

    if (!submitResult) {
        return res.status(500).send("Failed to submit code to Judge0 - check API key");
    }
    
    const resultToken = submitResult.map((value)=> value.token);

    const testResult = await submitToken(resultToken);
    

    // submittedResult ko update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;


    for(const test of testResult){
        if(test.status_id==3){
           testCasesPassed++;
           runtime = runtime+parseFloat(test.time)
           memory = Math.max(memory,test.memory);
        }else{
          if(test.status_id==4){
            status = 'error'
            errorMessage = test.stderr
          }
          else{
            status = 'wrong'
            errorMessage = test.stderr
          }
        }
    }


    // Store the result in Database in Submission
    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();

    // we will save the problemId in userschema problemSolved array 
    // if its not present and if the submission is accepted

   if(!req.result.problemSolved.includes(problemId)){
    req.result.problemSolved.push(problemId);
    await req.result.save();
   }

    // res.status(201).send(submittedResult);

     const accepted = (status == 'accepted')
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });
       
    }
 catch(err) {
  console.error('❌ submitCode error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    accepted: false,
    error: 'Judge0 execution failed', 
    details: err.message 
  });
}

}


const runCode = async(req,res) => {
  try{
    const userId = req.result._id;
    const problemId = req.params.id;
    const {code, language} = req.body;
    if(!userId||!code||!problemId||!language)
      return res.status(400).send("Some field missing");

    const problem = await Problem.findById(problemId);
    let lang = language;
    if(lang === 'cpp') lang = 'c++';
    const languageId = getLanguageById(lang);

    const submissions = problem.visibleTestCases.map((testcase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testcase.input,
      expected_output: testcase.output
    }));

    const submitResult = await submitBatch(submissions);
    const resultToken = submitResult.map((value) => value.token);
    const testResult = await submitToken(resultToken);

    res.status(201).send(testResult);
  }
catch(err) {
  console.error('❌ runCode error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: 'Judge0 execution failed', 
    details: err.message 
  });
}
};




module.exports = {submitCode, runCode};
