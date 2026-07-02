const { getLanguageById, submitBatch, submitToken, submitSingleFallback } = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo");

// Helper to normalise language strings
const normalizeLanguage = (lang) => lang.toLowerCase().trim();

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
    // Normalise language fields in startCode and referenceSolution
    const normalizedStartCode = startCode?.map(sc => ({
      ...sc,
      language: normalizeLanguage(sc.language)
    })) || [];

    const normalizedReference = referenceSolution?.map(rs => ({
      ...rs,
      language: normalizeLanguage(rs.language)
    })) || [];

    // Validate each reference solution against visible test cases
    for (const { language, completeCode } of normalizedReference) {
      const languageId = getLanguageById(language);

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
        if (error.response && error.response.status === 429) {
          testResult = await submitSingleFallback(submissions);
        } else {
          throw error;
        }
      }

      for (const test of testResult) {
        if (test.status_id !== 3) {
          console.error('Test failed:', test);
          return res.status(400).json({
            message: 'Reference solution failed validation',
            details: { language, testCase: test, compile_output: test.compile_output, stderr: test.stderr },
          });
        }
      }
    }

    // Save the problem with normalised fields
    const userProblem = await Problem.create({
      ...req.body,
      startCode: normalizedStartCode,
      referenceSolution: normalizedReference,
      problemCreator: req.result._id,
    });

    res.status(201).send('Problem Saved Successfully');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error: ' + err);
  }
};

const updateProblem = async (req, res) => {
  const { id } = req.params;
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
    if (!id) {
      return res.status(400).send("Missing ID Field");
    }

    const existingProblem = await Problem.findById(id);
    if (!existingProblem) {
      return res.status(404).send("Problem not found");
    }

    // Normalise language fields if they are provided
    const normalizedStartCode = startCode?.map(sc => ({
      ...sc,
      language: normalizeLanguage(sc.language)
    })) || existingProblem.startCode;

    const normalizedReference = referenceSolution?.map(rs => ({
      ...rs,
      language: normalizeLanguage(rs.language)
    })) || existingProblem.referenceSolution;

    // Validate updated reference solutions against visible test cases (if changed)
    if (referenceSolution && visibleTestCases) {
      for (const { language, completeCode } of normalizedReference) {
        const languageId = getLanguageById(language);

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
          if (error.response && error.response.status === 429) {
            testResult = await submitSingleFallback(submissions);
          } else {
            throw error;
          }
        }

        for (const test of testResult) {
          if (test.status_id !== 3) {
            return res.status(400).send("Error: Reference solution failed validation");
          }
        }
      }
    }

    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      {
        ...req.body,
        startCode: normalizedStartCode,
        referenceSolution: normalizedReference,
      },
      { runValidators: true, new: true }
    );

    res.status(200).send(updatedProblem);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err);
  }
};

const deleteProblem = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).send("ID is Missing");

    const deletedProblem = await Problem.findByIdAndDelete(id);
    if (!deletedProblem) return res.status(404).send("Problem not found");

    res.status(200).send("Successfully Deleted");
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const getProblemById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select(
      '_id title description difficulty tags visibleTestCases startCode referenceSolution'
    );
    if (!getProblem) return res.status(404).send("Problem not found");

    const videos = await SolutionVideo.findOne({ problemId: getProblem._id });
    if (videos) {
      const responseData = {
        ...getProblem.toObject(),
        secureUrl: videos.secureUrl,
        thumbnailUrl: videos.thumbnailUrl,
        duration: videos.duration,
      };
      return res.status(200).send(responseData);
    }

    res.status(200).send(getProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const getAllProblem = async (req, res) => {
  try {
    const getProblem = await Problem.find({}).select('_id title difficulty tags');
    if (getProblem.length === 0) return res.status(404).send("No problems found");
    res.status(200).send(getProblem);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

const solvedAllProblembyUser = async (req, res) => {
  try {
    const userId = req.result._id;
    const user = await User.findById(userId).populate({
      path: "problemSolved",
      select: "_id title difficulty tags",
    });
    res.status(200).send(user.problemSolved);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

const submittedProblem = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.pid;
    const ans = await Submission.find({ userId, problemId });
    if (ans.length === 0) {
      return res.status(200).send("No submissions found");
    }
    res.status(200).send(ans);
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblem,
  solvedAllProblembyUser,
  submittedProblem,
};