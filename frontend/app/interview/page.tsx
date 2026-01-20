'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, Briefcase, Loader2, Send, Mic, RotateCcw, ArrowRight, MessageCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface InterviewQuestion {
  question: string
  category: string
  suggested_answer_approach: string
}


export default function InterviewPracticePage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDescFile, setJobDescFile] = useState<File | null>(null)
  const [jobDescText, setJobDescText] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')
  
  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'interviewer' | 'user', content: string}>>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Refs for file inputs
  const resumeFileInputRef = useRef<HTMLInputElement>(null)
  const jobDescFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0])
      setResumeText('')
    }
  }

  const handleJobDescFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJobDescFile(e.target.files[0])
      setJobDescText('')
    }
  }

  const startInterview = async () => {
    if ((!resumeFile && !resumeText) || (!jobDescFile && !jobDescText)) {
      setError('Please provide both resume and job description')
      return
    }

    setLoading(true)
    setError('')
    const newSessionId = `session_${Date.now()}`
    setSessionId(newSessionId)

    try {
      const formData = new FormData()
      
      if (resumeFile) {
        formData.append('resume_file', resumeFile)
      } else {
        formData.append('resume_text', resumeText)
      }
      
      if (jobDescFile) {
        formData.append('job_description_file', jobDescFile)
      } else {
        formData.append('job_description_text', jobDescText)
      }
      
      formData.append('custom_instructions', customInstructions)
      formData.append('session_id', newSessionId)

      const response = await fetch(`${API_URL}/interview/start`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to start interview')
      }

      const data = await response.json()
      
      // Parse the first question
      if (data.question) {
        setCurrentQuestion({
          question: data.question,
          category: data.category || 'General',
          suggested_answer_approach: data.suggested_answer_approach || ''
        })
        setChatHistory([{
          role: 'interviewer',
          content: data.question
        }])
      }

      setSessionStarted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      setError('Please enter your answer')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('user_answer', userAnswer)
      formData.append('session_id', sessionId)

      const response = await fetch(`${API_URL}/interview/chat`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to get feedback')
      }

      const data = await response.json()

      // Add user answer and interviewer feedback to chat history
      const newHistory = [
        ...chatHistory,
        { role: 'user' as const, content: userAnswer },
        { role: 'interviewer' as const, content: data.feedback || 'Thank you for your answer.' }
      ]
      setChatHistory(newHistory)

      // Get next question if available
      if (data.next_question) {
        setCurrentQuestion({
          question: data.next_question,
          category: data.next_category || 'General',
          suggested_answer_approach: data.next_suggested_answer_approach || ''
        })
        newHistory.push({
          role: 'interviewer' as const,
          content: data.next_question
        })
      } else {
        // Interview completed
        setCurrentQuestion(null)
      }

      setChatHistory(newHistory)
      setUserAnswer('')
      setQuestionIndex(prev => prev + 1)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetInterview = () => {
    setResumeFile(null)
    setResumeText('')
    setJobDescFile(null)
    setJobDescText('')
    setCustomInstructions('')
    setError('')
    setSessionStarted(false)
    setCurrentQuestion(null)
    setUserAnswer('')
    setChatHistory([])
    setQuestionIndex(0)
    
    if (resumeFileInputRef.current) {
      resumeFileInputRef.current.value = ''
    }
    if (jobDescFileInputRef.current) {
      jobDescFileInputRef.current.value = ''
    }
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              Live Interview Practice
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Interview Practice
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Practice real interview questions tailored to your target job. Get AI-powered feedback and tips.
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-10">
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Resume Input */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  Your Resume
                </label>
                
                <div className="relative group">
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {resumeFile ? (
                          <span className="text-blue-600">{resumeFile.name}</span>
                        ) : (
                          <>
                            <span className="text-blue-600">Upload a file</span>
                            <span className="text-gray-500"> or drag and drop</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX up to 10MB</p>
                    </div>
                    <input 
                      ref={resumeFileInputRef}
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.docx,.doc"
                      onChange={handleResumeFileChange}
                    />
                  </label>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-xs text-gray-500 font-medium">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <textarea
                  className="w-full h-52 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  placeholder="Paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value)
                    setResumeFile(null)
                    if (resumeFileInputRef.current) {
                      resumeFileInputRef.current.value = ''
                    }
                  }}
                  disabled={!!resumeFile}
                />
              </div>

              {/* Job Description Input */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  Job Description
                </label>

                <div className="relative group">
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                        <Upload className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {jobDescFile ? (
                          <span className="text-purple-600">{jobDescFile.name}</span>
                        ) : (
                          <>
                            <span className="text-purple-600">Upload a file</span>
                            <span className="text-gray-500"> or drag and drop</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX up to 10MB</p>
                    </div>
                    <input 
                      ref={jobDescFileInputRef}
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.docx,.doc"
                      onChange={handleJobDescFileChange}
                    />
                  </label>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-xs text-gray-500 font-medium">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <textarea
                  className="w-full h-52 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                  placeholder="Paste the job description here..."
                  value={jobDescText}
                  onChange={(e) => {
                    setJobDescText(e.target.value)
                    setJobDescFile(null)
                    if (jobDescFileInputRef.current) {
                      jobDescFileInputRef.current.value = ''
                    }
                  }}
                  disabled={!!jobDescFile}
                />
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="mb-8">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-indigo-600" />
                </div>
                Custom Instructions (Optional)
              </label>
              <textarea
                className="w-full h-24 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm transition-all"
                placeholder="E.g., 'Focus on leadership questions' or 'Ask about specific technical skills'"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end pt-6 border-t border-gray-200">
              <button
                onClick={startInterview}
                disabled={loading || (!resumeFile && !resumeText) || (!jobDescFile && !jobDescText)}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    Start Interview Practice
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm flex items-start gap-3">
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Interview Session View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview in Progress</h1>
              <p className="text-gray-600 mt-1">Question {questionIndex + 1}</p>
            </div>
            <button
              onClick={resetInterview}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              End Interview
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-6 mb-6">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Current Question with Answer Form */}
        {currentQuestion && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="mb-6">
              <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full mb-3">
                {currentQuestion.category}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{currentQuestion.question}</h2>
              {currentQuestion.suggested_answer_approach && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Hint:</strong> {currentQuestion.suggested_answer_approach}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <textarea
                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm transition-all"
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={loading}
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={submitAnswer}
                  disabled={loading || !userAnswer.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {!currentQuestion && sessionStarted && chatHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete!</h2>
            <p className="text-gray-600 mb-6">Great job! You've completed the interview practice session.</p>
            <button
              onClick={resetInterview}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-5 h-5" />
              Start Another Interview
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
