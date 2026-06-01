const axios = require('axios');

const getLanguageById = (lang) => {
  const languageMap = {
    "c++": 54,      // GCC 9.2.0 (common)
    "cpp": 54,
    "c++17": 105,   // optional fallback
    "java": 62,
    "javascript": 63,
  };
  return languageMap[lang.toLowerCase()];
};

// RapidAPI batch submission
const submitBatch = async (submissions) => {
  const options = {
    method: 'POST',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: { base64_encoded: 'false' },
    headers: {
      'x-rapidapi-key': process.env.JUDGE0_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json',
       timeout: 30000   // 30 seconds for the initial POST
    },
    data: { submissions }
  };

  try {
    const response = await axios.request(options);
    // The API returns an array of tokens: [ { token: "..." }, ... ]
    return response.data; // already an array
  } catch (error) {
    console.error('Submit Batch Error:', error.response?.data || error.message);
    throw error; // rethrow so calling controller can catch it
  }
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// RapidAPI batch token fetch
const submitToken = async (resultToken) => {
  const options = {
    method: 'GET',
    url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
    params: {
      tokens: resultToken.join(','),
      base64_encoded: 'false',
      fields: '*'
    },
    headers: {
      'x-rapidapi-key': process.env.JUDGE0_KEY,
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
    }
  };

  const maxAttempts = 60;       // increase to 60 seconds
  const pollInterval = 1000;    // 1 second
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.request(options);
      const submissions = response.data.submissions;
      const allDone = submissions.every(r => r.status_id > 2);
      
      if (allDone) {
        console.log(`✅ Judge0 finished after ${attempts} attempts`);
        return submissions;
      }
      
      attempts++;
      await wait(pollInterval);
    } catch (error) {
      console.error('Judge0 token fetch error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  throw new Error(`Judge0 timeout after ${maxAttempts} seconds`);
};

// NEW: Single Submission Fallback logic
const submitSingleFallback = async (submissions) => {
  console.log("⚠️ Judge0 Batch limit reached! Switching cleanly to Single Submissions fallback...");
  const results = [];

  for (const sub of submissions) {
    const options = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions',
      params: { 
        base64_encoded: 'false', 
        wait: 'true', // Get complete result object back immediately
        fields: '*' 
      },
      headers: {
        'x-rapidapi-key': process.env.JUDGE0_KEY,
        'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: sub
    };

    try {
      const response = await axios.request(options);
      results.push(response.data); 
    } catch (error) {
      console.error('Single Fallback Step Error:', error.message);
      results.push({
        status_id: 13,
        status: { id: 13, description: 'Internal Error' },
        compile_output: error.message,
        stderr: error.message
      });
    }
  }
  return results;
};

module.exports = { getLanguageById, submitBatch, submitToken, submitSingleFallback };