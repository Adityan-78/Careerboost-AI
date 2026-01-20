'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, Briefcase, Send, Trash2, Download, Sparkles, MessageCircle, TrendingUp, Award, Zap } from 'lucide-react'

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
  "Focus on technical questions about my skills",
  "Ask me behavioral questions using STAR method",
  "Simulate a senior-level interview",
  "Ask questions about leadership and team management",
  "Focus on problem-solving and system design",
  "Ask about my project experience and achievements"
]

export default function InterviewPractice() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0])
      setResumeText('')
    }
  }

  const handleStartInterview = async () => {
    if ((!resumeFile && !resumeText) || !jobDescription) {
      setError('Please provide both a resume and job description')
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
      
      formData.append('job_description', jobDescription)
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
      
      // Parse feedback if it exists
      const newMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
      }

      // Only add feedback if it's properly structured with all required fields
      if (data.feedback && typeof data.feedback === 'object' && 
          'score' in data.feedback && 'strengths' in data.feedback && 
          'improvements' in data.feedback && 'suggested_answer' in data.feedback) {
        newMessage.feedback = {
          score: Number(data.feedback.score) || 0,
          strengths: Array.isArray(data.feedback.strengths) ? data.feedback.strengths : [],
          improvements: Array.isArray(data.feedback.improvements) ? data.feedback.improvements : [],
          suggested_answer: String(data.feedback.suggested_answer) || ''
        }
      }

      setChatHistory(prev => [...prev, newMessage])
      
      if (data.next_question) {
        setCurrentQuestion(data.next_question)
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
    setJobDescription('')
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
      <div className="min-h-screen relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-2xl animate-bounce">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Interview Practice
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Master your interviews with AI-powered practice sessions and instant feedback
            </p>
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Real-time Feedback</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600">Scored Answers</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">AI-Powered</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Resume Input */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Your Resume
                </label>
                
                <div className="relative group">
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 group-hover:border-blue-500 group-hover:shadow-lg">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 bg-white rounded-full shadow-md mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        {resumeFile ? (
                          <span className="text-blue-600">{resumeFile.name}</span>
                        ) : (
                          'Upload PDF or DOCX'
                        )}
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                  </div>
                </div>

                <textarea
                  className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none text-sm bg-gradient-to-br from-gray-50 to-white disabled:opacity-50"
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
                <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  Job Description
                </label>
                <textarea
                  className="w-full h-72 p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 resize-none text-sm bg-gradient-to-br from-purple-50 to-white"
                  placeholder="Paste job description..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="mb-8 p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl border-2 border-pink-100">
              <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                Custom Instructions (Optional)
              </label>
              <textarea
                className="w-full h-24 p-4 border-2 border-pink-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 resize-none text-sm bg-white"
                placeholder="Tell the AI how to conduct the interview..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
              />
              
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-600 mb-3">✨ Suggested prompts:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCustomInstructions(prompt)}
                      className="px-4 py-2 bg-white hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 text-gray-700 hover:text-white text-xs font-medium rounded-full transition-all duration-300 border border-pink-200 hover:border-transparent shadow-sm hover:shadow-lg transform hover:scale-105"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl text-red-700 font-medium animate-shake">
                {error}
              </div>
            )}

            <button
              onClick={handleStartInterview}
              disabled={isLoading || (!resumeFile && !resumeText) || !jobDescription}
              className="w-full px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white text-lg font-bold rounded-2xl hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  Preparing Interview...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Start Interview Practice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
            <div className="relative flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                  <MessageCircle className="w-8 h-8" />
                  Interview in Progress
                </h1>
                <p className="text-white/90 text-sm font-medium">Answer questions and receive instant AI-powered feedback</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportChat}
                  className="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 border border-white/30 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleResetSession}
                  className="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 border border-white/30 shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="w-4 h-4" />
                  New Session
                </button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="h-[650px] overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-white">
            <div className="space-y-6">
              {chatHistory.map((message, idx) => (
                <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`} style={{animationDelay: `${idx * 100}ms`}}>
                  <div className={`max-w-3xl ${message.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-white border-2 border-purple-100'} rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <div className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-purple-600'} mb-2 font-bold uppercase tracking-wide flex items-center gap-2`}>
                      {message.role === 'user' ? (
                        <>
                          <div className="w-2 h-2 bg-white rounded-full" />
                          You
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          AI Interviewer
                        </>
                      )}
                    </div>
                    <div className={`${message.role === 'user' ? 'text-white' : 'text-gray-800'} leading-relaxed`}>
                      {message.content}
                    </div>
                    
                    {message.feedback && (
                      <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">Score:</span>
                          <div className="flex items-center gap-2">
                            <div className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-lg rounded-full shadow-lg">
                              {message.feedback.score}/10
                            </div>
                            {message.feedback.score >= 8 && (
                              <Award className="w-6 h-6 text-yellow-500 animate-bounce" />
                            )}
                          </div>
                        </div>
                        
                        {message.feedback.strengths && message.feedback.strengths.length > 0 && (
                          <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                            <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                              ✓ Strengths
                            </h4>
                            <ul className="text-sm space-y-1">
                              {message.feedback.strengths.map((s, i) => (
                                <li key={i} className="text-green-700 flex items-start gap-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {message.feedback.improvements && message.feedback.improvements.length > 0 && (
                          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                            <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                              ↑ Areas to Improve
                            </h4>
                            <ul className="text-sm space-y-1">
                              {message.feedback.improvements.map((imp, i) => (
                                <li key={i} className="text-orange-700 flex items-start gap-2">
                                  <span className="text-orange-500 mt-1">•</span>
                                  {imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {message.feedback.suggested_answer && (
                          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                            <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                              💡 Suggested Answer
                            </h4>
                            <p className="text-sm text-blue-700 leading-relaxed">{message.feedback.suggested_answer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-purple-100 p-6 bg-gradient-to-br from-white to-purple-50">
            <div className="flex gap-4">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSendAnswer()
                  }
                }}
                placeholder="Type your answer here... (Ctrl+Enter to send)"
                className="flex-1 p-5 border-2 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 resize-none bg-white shadow-inner"
                rows={4}
                disabled={isLoading}
              />
              <button
                onClick={handleSendAnswer}
                disabled={isLoading || !currentAnswer.trim()}
                className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl font-bold transform hover:scale-105 disabled:transform-none"
              >
                <Send className="w-6 h-6" />
                Send
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 px-2">
              <p className="text-xs text-gray-500 font-medium">
                Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-gray-700 font-mono">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-gray-700 font-mono">Enter</kbd> to send
              </p>
              <p className="text-xs text-purple-600 font-bold">
                {chatHistory.filter(m => m.role === 'user').length} questions answered
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

