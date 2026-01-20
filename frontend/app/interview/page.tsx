'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, Briefcase, Send, Trash2, Download, MessageCircle, Zap } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  feedback?: {
    score: number
    strengths: string[]
    improvements: string[]
    suggested_answer: string
  }
}

const SUGGESTED_PROMPTS = [
  "Focus on technical questions",
  "Ask behavioral questions",
  "Senior-level interview",
  "Leadership questions",
  "Problem-solving focus",
  "Project experience"
]

export default function InterviewPractice() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDescFile, setJobDescFile] = useState<File | null>(null)
  const [jobDescText, setJobDescText] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`)
  
  const [isSessionStarted, setIsSessionStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState('')
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

  const handleStartInterview = async () => {
    if ((!resumeFile && !resumeText) || (!jobDescFile && !jobDescText)) {
      setError('Please provide both resume and job description')
      return
    }

    setIsLoading(true)
    setError('')

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
      formData.append('session_id', sessionId)

      const response = await fetch(`${API_URL}/interview/start`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to start interview')
      }

      const data = await response.json()
      
      setCurrentQuestion(data.question)
      setChatHistory([{
        role: 'assistant',
        content: data.message
      }])
      setIsSessionStarted(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendAnswer = async () => {
    if (!currentAnswer.trim()) return

    setIsLoading(true)
    
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: currentAnswer
    }])
    
    const userAnswer = currentAnswer
    setCurrentAnswer('')

    try {
      const formData = new FormData()
      formData.append('session_id', sessionId)
      formData.append('user_answer', userAnswer)
      formData.append('custom_instructions', customInstructions)

      const response = await fetch(`${API_URL}/interview/chat`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to get response')
      }

      const data = await response.json()
      
      // Add feedback message
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        feedback: data.feedback
      }])
      
      // Automatically add next question
      if (data.next_question) {
        setCurrentQuestion(data.next_question)
        setTimeout(() => {
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: data.next_question
          }])
        }, 800)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSession = () => {
    setIsSessionStarted(false)
    setChatHistory([])
    setCurrentQuestion('')
    setCurrentAnswer('')
    setResumeFile(null)
    setResumeText('')
    setJobDescFile(null)
    setJobDescText('')
    setCustomInstructions('')
  }

  const handleExportChat = () => {
    const chatData = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      chat_history: chatHistory
    }
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-practice-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isSessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              AI-Powered Practice
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Interview Practice
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Practice with AI and get instant feedback on your answers
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Resume Input */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  Resume
                </label>
                
                <div className="relative group">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {resumeFile ? (
                          <span className="text-blue-600">{resumeFile.name}</span>
                        ) : (
                          <>
                            <span className="text-blue-600">Upload file</span>
                            <span className="text-gray-500"> or drag and drop</span>
                          </>
                        )}
                      </p>
                    </div>
                    <input 
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
                  className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:bg-gray-50 transition-all"
                  placeholder="Paste resume text..."
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value)
                    setResumeFile(null)
                  }}
                  disabled={!!resumeFile}
                />
              </div>

              {/* Job Description */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  Job Description
                </label>

                <div className="relative group">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors">
                        <Upload className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {jobDescFile ? (
                          <span className="text-purple-600">{jobDescFile.name}</span>
                        ) : (
                          <>
                            <span className="text-purple-600">Upload file</span>
                            <span className="text-gray-500"> or drag and drop</span>
                          </>
                        )}
                      </p>
                    </div>
                    <input 
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
                  className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm disabled:bg-gray-50 transition-all"
                  placeholder="Paste job description..."
                  value={jobDescText}
                  onChange={(e) => {
                    setJobDescText(e.target.value)
                    setJobDescFile(null)
                  }}
                  disabled={!!jobDescFile}
                />
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <label className="text-sm font-semibold text-gray-700 mb-3 block">
                Custom Instructions (Optional)
              </label>
              <textarea
                className="w-full h-24 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm bg-white"
                placeholder="Tell the AI how to conduct the interview..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
              />
              
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-600 mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustomInstructions(prompt)}
                      className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 text-xs font-medium rounded-lg transition-colors border border-gray-300 hover:border-indigo-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStartInterview}
              disabled={isLoading || (!resumeFile && !resumeText) || (!jobDescFile && !jobDescText)}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30"
            >
              {isLoading ? 'Starting Interview...' : 'Start Interview Practice'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  Interview Session
                </h1>
                <p className="text-gray-300 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  {chatHistory.filter(m => m.role === 'user').length} questions answered
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportChat}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleResetSession}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  End
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="h-[600px] overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="space-y-6">
              {chatHistory.map((message, idx) => (
                <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl ${message.role === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-gray-200 shadow-md'} rounded-2xl p-5`}>
                    <div className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'} mb-2 font-semibold uppercase tracking-wide flex items-center gap-2`}>
                      {message.role === 'user' ? (
                        <>
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          Your Answer
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          AI Interviewer
                        </>
                      )}
                    </div>
                    <div className={`${message.role === 'user' ? 'text-white' : 'text-gray-800'} leading-relaxed`}>
                      {message.content}
                    </div>
                    
                    {message.feedback && (
                      <div className="mt-5 pt-5 border-t border-gray-200 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">Score:</span>
                          <div className="flex items-center gap-2">
                            <span className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-full shadow-lg">
                              {message.feedback.score}/10
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                          <h4 className="font-semibold text-green-900 text-sm mb-2 flex items-center gap-2">
                            ✓ Strengths
                          </h4>
                          <ul className="text-xs space-y-1.5">
                            {message.feedback.strengths.map((s, i) => (
                              <li key={i} className="text-green-800 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                          <h4 className="font-semibold text-amber-900 text-sm mb-2 flex items-center gap-2">
                            ↑ Areas to Improve
                          </h4>
                          <ul className="text-xs space-y-1.5">
                            {message.feedback.improvements.map((imp, i) => (
                              <li key={i} className="text-amber-800 flex items-start gap-2">
                                <span className="text-amber-600 mt-0.5">•</span>
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 text-sm mb-2 flex items-center gap-2">
                            💡 Suggested Answer
                          </h4>
                          <p className="text-xs text-blue-800 leading-relaxed">{message.feedback.suggested_answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-gray-100 p-5 bg-white">
            <div className="flex gap-3">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSendAnswer()
                  }
                }}
                placeholder="Type your answer... (Ctrl+Enter to send)"
                className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleSendAnswer}
                disabled={isLoading || !currentAnswer.trim()}
                className="px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 flex items-center gap-2 font-semibold"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              Press <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono">Ctrl</kbd> + <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300 font-mono">Enter</kbd> to send
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}