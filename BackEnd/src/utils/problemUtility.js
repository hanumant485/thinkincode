// const axios = require("axios");

// const BASE_URL = "https://ce.judge0.com"; // FREE public endpoint

// const getLanguageById = (lang) => {
//   const language = {
//     "c++": 54,
//     "java": 62,
//     "javascript": 63,
//   };

//   return language[lang.toLowerCase()];
// };

// const submitBatch = async (submissions) => {
//   try {
//     const response = await axios.post(
//       `${BASE_URL}/submissions/batch?base64_encoded=false`,
//       { submissions }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Submit Error:", error.message);
//   }
// };



// const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// const submitToken = async (resultToken) => {
//   try {
//     while (true) {
//       const response = await axios.get(
//         `${BASE_URL}/submissions/batch`,
//         {
//           params: {
//             tokens: resultToken.join(","),
//             base64_encoded: false,
//             fields: "*",
//           },
//         }
//       );

//       const result = response.data;

//       const isResultObtained = result.submissions.every(
//         (r) => r.status.id > 2
//       );

//       if (isResultObtained) {
//         return result.submissions;
//       }

//       await wait(1000);
//     }
//   } catch (error) {
//     console.error("Token Fetch Error:", error.message);
//   }
// };
// module.exports = { getLanguageById, submitBatch, submitToken };

// 2nd one
// const axios = require('axios');


// const getLanguageById = (lang)=>{

//     const language = {
//         "c++":54,
//         "java":62,
//         "javascript":63
//     }


//     return language[lang.toLowerCase()];
// }


// const submitBatch = async (submissions)=>{


// const options = {
//   method: 'POST',
//   url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
//   params: {
//     base64_encoded: 'false'
//   },
//   headers: {
//     'x-rapidapi-key': process.env.JUDGE0_KEY,
//     'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
//     'Content-Type': 'application/json'
//   },
//   data: {
//     submissions
//   }
// };

// async function fetchData() {
// 	try {
// 		const response = await axios.request(options);
// 		return response.data;
// 	} catch (error) {
// 		console.error(error);
// 	}
// }

//  return await fetchData();

// }


// const waiting = async(timer)=>{
//   setTimeout(()=>{
//     return 1;
//   },timer);
// }


// const submitToken = async(resultToken)=>{

// const options = {
//   method: 'GET',
//   url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
//   params: {
//     tokens: resultToken.join(","),
//     base64_encoded: 'false',
//     fields: '*'
//   },
//   headers: {
//     'x-rapidapi-key': process.env.JUDGE0_KEY,
//     'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
//   }
// };

// async function fetchData() {
// 	try {
// 		const response = await axios.request(options);
// 		return response.data;
// 	} catch (error) {
// 		console.error(error);
// 	}
// }


//  while(true){

//  const result =  await fetchData();

//   const IsResultObtained =  result.submissions.every((r)=>r.status_id>2);

//   if(IsResultObtained)
//     return result.submissions;

  
//   await waiting(1000);
// }



// }


// module.exports = {getLanguageById,submitBatch,submitToken};

// 3rd one

const axios = require('axios');

const getLanguageById = (lang) => {
  const language = {
    "c++": 54,
    "java": 62,
    "javascript": 63,
  };
  return language[lang.toLowerCase()];
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
      'Content-Type': 'application/json'
    },
    data: { submissions }
  };

  try {
    const response = await axios.request(options);
    // The API returns an array of tokens: [ { token: "..." }, ... ]
    return response.data; // already an array
  } catch (error) {
    console.error('Submit Batch Error:', error.response?.data || error.message);
    throw error; // rethrow so createProblem can catch it
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

  const maxAttempts = 30; // 30 seconds timeout
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.request(options);
      // response.data.submissions is an array of results
      const submissions = response.data.submissions;
      const allDone = submissions.every(r => r.status_id > 2);
      if (allDone) {
        return submissions;
      }
      attempts++;
      await wait(1000);
    } catch (error) {
      console.error('Token Fetch Error:', error.response?.data || error.message);
      throw error;
    }
  }
  throw new Error('Judge0 timeout after 30 seconds');
};

module.exports = { getLanguageById, submitBatch, submitToken };