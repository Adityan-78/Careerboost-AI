'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Briefcase, Loader2, CheckCircle, XCircle, ArrowRight, Target, TrendingUp } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface AnalysisResult {
  skill_match_percentage: number
  matched_skills: string[]
  missing_skills: string[]
  optimized_resume_bullets: string[]
  cover_letter: string
  interview_prep: Array<{
    question: string
    category: string
    suggested_answer_approach: string
  }>
}

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDescFile, setJobDescFile] = useState<File | null>(null)
  const [jobDescText, setJobDescText] = useState('')
  const [rewriteAll, setRewriteAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  // Refs for file inputs to properly reset them
  const resumeFileInputRef = useRef<HTMLInputElement>(null)
  const jobDescFileInputRef = useRef<HTMLInputElement>(null)

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

  // Handle drag and drop for resume
  const handleResumeDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const allowedExtensions = ['.pdf', '.docx', '.doc']
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      
      if (allowedExtensions.includes(fileExt)) {
        setResumeFile(file)
        setResumeText('')
      } else {
        setError('Invalid file type. Please upload PDF or DOCX files only.')
      }
    }
  }

  const handleResumeDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Handle drag and drop for job description
  const handleJobDescDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const allowedExtensions = ['.pdf', '.docx', '.doc']
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
      
      if (allowedExtensions.includes(fileExt)) {
        setJobDescFile(file)
        setJobDescText('')
      } else {
        setError('Invalid file type. Please upload PDF or DOCX files only.')
      }
    }
  }

  const handleJobDescDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleAnalyze = async () => {
    if ((!resumeFile && !resumeText) || (!jobDescFile && !jobDescText)) {
      setError('Please provide both resume and job description')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

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
      
      formData.append('rewrite_all_bullets', rewriteAll.toString())

      // Add 120 second timeout for analysis
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      try {
        const response = await fetch(`${API_URL}/analyze`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || 'Analysis failed')
        }

        const data = await response.json()
        setResult(data)
      } catch (fetchErr: any) {
        clearTimeout(timeoutId)
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request timed out. The analysis is taking too long. Please try again.')
        }
        throw fetchErr
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    // Clear all states
    setResumeFile(null)
    setResumeText('')
    setJobDescFile(null)
    setJobDescText('')
    setRewriteAll(false)
    setError('')
    setResult(null)
    setLoading(false)
    
    // Reset file input elements
    if (resumeFileInputRef.current) {
      resumeFileInputRef.current.value = ''
    }
    if (jobDescFileInputRef.current) {
      jobDescFileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            Smart Resume Analysis
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Resume Optimizer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get detailed insights on how well your resume matches the job requirements
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
                <label 
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200"
                  onDrop={handleResumeDrop}
                  onDragOver={handleResumeDragOver}
                >
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
                    key={`resume-${resumeFile?.name || 'empty'}`}
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
                <label 
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-200"
                  onDrop={handleJobDescDrop}
                  onDragOver={handleJobDescDragOver}
                >
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
                    key={`jobdesc-${jobDescFile?.name || 'empty'}`}
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

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer group">
              <input
                type="checkbox"
                checked={rewriteAll}
                onChange={(e) => setRewriteAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="group-hover:text-gray-900 transition-colors">Rewrite all resume bullets</span>
            </label>

            <div className="flex gap-3">
              {(result || resumeFile || resumeText || jobDescFile || jobDescText) && (
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-xl disabled:bg-gray-200 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  Reset
                </button>
              )}
              
              <button
                onClick={handleAnalyze}
                disabled={loading || (!resumeFile && !resumeText) || (!jobDescFile && !jobDescText)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Resume
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm flex items-start gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-6">
            {/* Skill Match */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Skill Match Analysis</h2>
              </div>
              
              <div className="mb-8">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-sm font-semibold text-gray-700">Overall Match</span>
                  <div className="text-right">
                    <span className="text-4xl font-bold text-gray-900">{result.skill_match_percentage}</span>
                    <span className="text-2xl font-bold text-gray-500">%</span>
                  </div>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${result.skill_match_percentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Matched Skills
                    <span className="ml-auto text-sm bg-green-200 text-green-800 px-2 py-1 rounded-full">{result.matched_skills.length}</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {result.matched_skills.map((skill, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-amber-600" />
                    Missing Skills
                    <span className="ml-auto text-sm bg-amber-200 text-amber-800 px-2 py-1 rounded-full">{result.missing_skills.length}</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {result.missing_skills.map((skill, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Optimized Bullets */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Optimized Resume Bullets</h2>
              </div>
              <div className="space-y-4">
                {result.optimized_resume_bullets.map((bullet, idx) => (
                  <div key={idx} className="flex gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <span className="text-xl font-bold text-purple-600 flex-shrink-0">•</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Letter */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Cover Letter</h2>
              </div>
              <div className="prose max-w-none bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200">
                <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {result.cover_letter}
                </p>
              </div>
            </div>

            {/* Interview Prep */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Interview Preparation</h2>
              </div>
              <div className="space-y-5">
                {result.interview_prep.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-pink-500 bg-gradient-to-r from-pink-50 to-white rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-3 text-base">{item.question}</h3>
                    <div className="bg-white rounded-lg p-4 border border-pink-200">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <strong className="text-gray-900">Approach:</strong> {item.suggested_answer_approach}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}