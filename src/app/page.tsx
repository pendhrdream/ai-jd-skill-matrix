'use client';

import { useState } from 'react';
import { SkillMatrix } from '@/lib/schema';

interface ApiResponse {
  success: boolean;
  data?: SkillMatrix;
  method?: 'ai' | 'fallback';
  warning?: string;
  error?: string;
  details?: string;
}

interface StreamMessage {
  type: 'status' | 'content' | 'result' | 'error';
  message?: string;
  content?: string;
  data?: SkillMatrix;
  method?: 'ai' | 'fallback';
  warning?: string;
  error?: string;
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (useStreaming = false) => {
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setIsLoading(true);
    setIsStreaming(useStreaming);
    setError(null);
    setResult(null);
    setStreamingContent('');

    try {
      if (useStreaming) {
        await handleStreamingAnalysis();
      } else {
        await handleRegularAnalysis();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleRegularAnalysis = async () => {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobDescription }),
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze job description');
    }

    setResult(data);
  };

  const handleStreamingAnalysis = async () => {
    const response = await fetch('/api/extract-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobDescription }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start streaming analysis');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available for streaming');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const message: StreamMessage = JSON.parse(data);
              
              switch (message.type) {
                case 'status':
                  setStreamingContent(prev => prev + `\n${message.message}`);
                  break;
                case 'content':
                  setStreamingContent(prev => prev + message.content);
                  break;
                case 'result':
                  setResult({
                    success: true,
                    data: message.data,
                    method: message.method,
                    warning: message.warning
                  });
                  break;
                case 'error':
                  throw new Error(message.error || 'Streaming error occurred');
              }
            } catch {
              console.warn('Failed to parse streaming message:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const copyToClipboard = async () => {
    if (result?.data) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Job Description → Skill Matrix
          </h1>
          <p className="text-gray-600 mb-8">
            Paste a job description and get a structured skill matrix with AI analysis or fallback parsing.
          </p>

          <div className="space-y-6">
            {/* Input Section */}
            <div>
              <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                disabled={isLoading}
              />
            </div>

            {/* Analyze Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleAnalyze(false)}
                disabled={isLoading || !jobDescription.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading && !isStreaming ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  'Quick Analysis'
                )}
              </button>
              
              <button
                onClick={() => handleAnalyze(true)}
                disabled={isLoading || !jobDescription.trim()}
                className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isStreaming ? (
                  <div className="flex items-center">
                    <div className="animate-pulse rounded-full h-4 w-4 bg-white mr-2"></div>
                    Streaming...
                  </div>
                ) : (
                  'AI Streaming'
                )}
              </button>
            </div>

            {/* Streaming Content Display */}
            {isStreaming && streamingContent && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-purple-800 mb-2">AI Analysis Progress</h3>
                <div className="bg-white border border-purple-200 rounded p-3 max-h-40 overflow-y-auto">
                  <pre className="text-sm text-purple-700 whitespace-pre-wrap font-mono">
                    {streamingContent}
                  </pre>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            {result && (
              <div className="space-y-4">
                {/* Method Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Analysis Method:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.method === 'ai' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.method === 'ai' ? 'AI Analysis' : 'Fallback Parser'}
                    </span>
                  </div>
                  {result.warning && (
                    <div className="text-sm text-yellow-600">
                      ⚠️ {result.warning}
                    </div>
                  )}
                </div>

                {/* Summary */}
                {result.data && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
                    <p className="text-sm text-blue-700">{result.data.summary}</p>
                  </div>
                )}

                {/* Skill Matrix */}
                {result.data && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Skill Matrix</h3>
                      <button
                        onClick={copyToClipboard}
                        className="px-3 py-1 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Copy JSON
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Title and Seniority */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Title:</span>
                          <p className="text-sm text-gray-900">{result.data.title}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Seniority:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            result.data.seniority === 'senior' ? 'bg-purple-100 text-purple-800' :
                            result.data.seniority === 'lead' ? 'bg-red-100 text-red-800' :
                            result.data.seniority === 'mid' ? 'bg-blue-100 text-blue-800' :
                            result.data.seniority === 'junior' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result.data.seniority}
                          </span>
                        </div>
                      </div>

                      {/* Skills by Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(result.data.skills).map(([category, skills]) => (
                          skills.length > 0 && (
                            <div key={category} className="bg-white border border-gray-200 rounded-md p-3">
                              <h4 className="text-sm font-medium text-gray-900 capitalize mb-2">
                                {category} ({skills.length})
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>

                      {/* Requirements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.data.mustHave.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <h4 className="text-sm font-medium text-red-800 mb-2">
                              Must Have ({result.data.mustHave.length})
                            </h4>
                            <ul className="text-sm text-red-700 space-y-1">
                              {result.data.mustHave.map((req, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-red-500 mr-2">•</span>
                                  {req}
          </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.data.niceToHave.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <h4 className="text-sm font-medium text-green-800 mb-2">
                              Nice to Have ({result.data.niceToHave.length})
                            </h4>
                            <ul className="text-sm text-green-700 space-y-1">
                              {result.data.niceToHave.map((req, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-green-500 mr-2">•</span>
                                  {req}
          </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Salary */}
                      {result.data.salary && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <h4 className="text-sm font-medium text-yellow-800 mb-2">Salary Range</h4>
                          <p className="text-sm text-yellow-700">
                            {result.data.salary.min && result.data.salary.max
                              ? `${result.data.salary.min.toLocaleString()} - ${result.data.salary.max.toLocaleString()} ${result.data.salary.currency}`
                              : result.data.salary.min
                              ? `From ${result.data.salary.min.toLocaleString()} ${result.data.salary.currency}`
                              : `Up to ${result.data.salary.max?.toLocaleString()} ${result.data.salary.currency}`
                            }
                          </p>
                        </div>
                      )}

                      {/* Raw JSON */}
                      <details className="bg-gray-100 border border-gray-200 rounded-md">
                        <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-200">
                          View Raw JSON
                        </summary>
                        <pre className="p-4 text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}