import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';

// Map frontend language keys to display names
const languageDisplay = {
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++'
};

// Map frontend keys to the exact strings stored in the database (lowercase)
const storedLanguageMap = {
  javascript: 'javascript',
  java: 'java',
  cpp: 'c++'
};

// Helper to get display name from any stored language string
const getDisplayLanguage = (lang) => {
  if (!lang) return lang;
  const lower = lang.toLowerCase();
  if (lower === 'c++') return 'C++';
  if (lower === 'java') return 'Java';
  if (lower === 'javascript') return 'JavaScript';
  return lang; // fallback
};

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let { problemId } = useParams();

  const { handleSubmit } = useForm();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        setProblem(response.data);
        // Set initial code for the default language (javascript)
        const storedLang = storedLanguageMap[selectedLanguage];
        // ✅ Case-insensitive match
        const starter = response.data.startCode?.find(
          sc => sc.language.toLowerCase() === storedLang
        );
        setCode(starter ? starter.initialCode : '// No starter code for this language');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };
    fetchProblem();
  }, [problemId]);

  // When language changes, update the code editor with the new starter code
  useEffect(() => {
    if (problem) {
      const storedLang = storedLanguageMap[selectedLanguage];
      // ✅ Case-insensitive match
      const starter = problem.startCode?.find(
        sc => sc.language.toLowerCase() === storedLang
      );
      setCode(starter ? starter.initialCode : '// No starter code for this language');
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });
      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
    } catch (error) {
      console.error('Error running code:', error);
      if (error.response && error.response.data) {
        setRunResult(error.response.data);
      } else {
        setRunResult({ error: 'Internal server error', details: error.message });
      }
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });
      setSubmitResult(response.data);
      setLoading(false);
      setActiveRightTab('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      if (error.response && error.response.data) {
        setSubmitResult(error.response.data);
      } else {
        setSubmitResult({ accepted: false, error: 'Submission failed', details: error.message });
      }
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-base-100">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col border-r border-base-300">
        <div className="tabs tabs-bordered bg-base-200 px-4">
          <button className={`tab ${activeLeftTab === 'description' ? 'tab-active' : ''}`} onClick={() => setActiveLeftTab('description')}>Description</button>
          <button className={`tab ${activeLeftTab === 'editorial' ? 'tab-active' : ''}`} onClick={() => setActiveLeftTab('editorial')}>Editorial</button>
          <button className={`tab ${activeLeftTab === 'solutions' ? 'tab-active' : ''}`} onClick={() => setActiveLeftTab('solutions')}>Solutions</button>
          <button className={`tab ${activeLeftTab === 'submissions' ? 'tab-active' : ''}`} onClick={() => setActiveLeftTab('submissions')}>Submissions</button>
          <button className={`tab ${activeLeftTab === 'chatAI' ? 'tab-active' : ''}`} onClick={() => setActiveLeftTab('chatAI')}>ChatAI</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    <div className={`badge badge-outline ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </div>
                    <div className="badge badge-primary">{problem.tags}</div>
                  </div>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{problem.description}</div>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Examples:</h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className="bg-base-200 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Example {index + 1}:</h4>
                          <div className="space-y-2 text-sm font-mono">
                            <div><strong>Input:</strong> {example.input}</div>
                            <div><strong>Output:</strong> {example.output}</div>
                            <div><strong>Explanation:</strong> {example.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeLeftTab === 'editorial' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-bold mb-4">Editorial</h2>
                  {problem.secureUrl ? (
                    <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} />
                  ) : (
                    <p className="text-gray-500">No video solution available for this problem.</p>
                  )}
                </div>
              )}
              {activeLeftTab === 'solutions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Solutions</h2>
                  <div className="space-y-6">
                    {problem.referenceSolution?.map((solution, index) => (
                      <div key={index} className="border border-base-300 rounded-lg">
                        <div className="bg-base-200 px-4 py-2 rounded-t-lg">
                          <h3 className="font-semibold">{problem.title} - {getDisplayLanguage(solution.language)}</h3>
                        </div>
                        <div className="p-4">
                          <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto">
                            <code>{solution.completeCode}</code>
                          </pre>
                        </div>
                      </div>
                    )) || <p className="text-gray-500">Solutions will be available after you solve the problem.</p>}
                  </div>
                </div>
              )}
              {activeLeftTab === 'submissions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                  <div className="text-gray-500">
                    <SubmissionHistory problemId={problemId} />
                  </div>
                </div>
              )}
              {activeLeftTab === 'chatAI' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-bold mb-4">CHAT with AI</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    <ChatAi problem={problem} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 flex flex-col">
        <div className="tabs tabs-bordered bg-base-200 px-4">
          <button className={`tab ${activeRightTab === 'code' ? 'tab-active' : ''}`} onClick={() => setActiveRightTab('code')}>Code</button>
          <button className={`tab ${activeRightTab === 'testcase' ? 'tab-active' : ''}`} onClick={() => setActiveRightTab('testcase')}>Testcase</button>
          <button className={`tab ${activeRightTab === 'result' ? 'tab-active' : ''}`} onClick={() => setActiveRightTab('result')}>Result</button>
        </div>

        <div className="flex-1 flex flex-col">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-base-300">
                <div className="flex gap-2">
                  {['javascript', 'java', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      className={`btn btn-sm ${selectedLanguage === lang ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      {languageDisplay[lang]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                  }}
                />
              </div>
              <div className="p-4 border-t border-base-300 flex justify-between">
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveRightTab('testcase')}>Console</button>
                </div>
                <div className="flex gap-2">
                  <button className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`} onClick={handleRun} disabled={loading}>Run</button>
                  <button className={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`} onClick={handleSubmitCode} disabled={loading}>Submit</button>
                </div>
              </div>
            </div>
          )}

          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Test Results</h3>
              {runResult ? (
                Array.isArray(runResult) ? (
                  <div className="alert alert-success mb-4">
                    <div>
                      <h4 className="font-bold">✅ Test cases executed</h4>
                      <div className="mt-4 space-y-2">
                        {runResult.map((tc, i) => (
                          <div key={i} className="bg-base-100 p-3 rounded text-xs">
                            <div className="font-mono">
                              <div><strong>Input:</strong> {tc.stdin}</div>
                              <div><strong>Expected:</strong> {tc.expected_output}</div>
                              <div><strong>Output:</strong> {tc.stdout}</div>
                              <div className={tc.status_id === 3 ? 'text-green-600' : 'text-red-600'}>
                                {tc.status_id === 3 ? '✓ Passed' : '✗ Failed'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : runResult.error ? (
                  <div className="alert alert-error mb-4">
                    <div>
                      <h4 className="font-bold">❌ {runResult.error}</h4>
                      {runResult.details && (
                        <pre className="text-xs mt-2 overflow-x-auto whitespace-pre-wrap">
                          {runResult.details}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning mb-4">
                    <div>Unexpected response format</div>
                  </div>
                )
              ) : (
                <div className="text-gray-500">
                  Click "Run" to test your code with the example test cases.
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Submission Result</h3>
              {submitResult ? (
                <div className={`alert ${submitResult.accepted ? 'alert-success' : 'alert-error'}`}>
                  <div>
                    {submitResult.accepted ? (
                      <div>
                        <h4 className="font-bold text-lg">🎉 Accepted</h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                          <p>Runtime: {submitResult.runtime} sec</p>
                          <p>Memory: {submitResult.memory} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-lg">❌ {submitResult.error || 'Submission failed'}</h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases || 0}/{submitResult.totalTestCases || '?'}</p>
                          {submitResult.details && (
                            <pre className="text-xs mt-2 overflow-x-auto whitespace-pre-wrap">
                              {submitResult.details}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  Click "Submit" to submit your solution for evaluation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;