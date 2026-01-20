import type { Metadata } from 'next'
// @ts-ignore: side-effect import of global CSS without type declarations
import './globals.css'
import Link from 'next/link'
import { FileCheck, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CareerBoost AI - Resume Optimization & Interview Practice',
  description: 'AI-powered resume optimization and interview practice platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  CareerBoost AI
                </span>
              </Link>
              <div className="flex gap-2">
                <Link 
                  href="/" 
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all font-medium"
                >
                  <FileCheck className="w-4 h-4" />
                  Resume Optimizer
                </Link>
                <Link 
                  href="/interview" 
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Interview Practice
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-10 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-2">
                Powered by Llama 3.3 70B via OpenRouter
              </p>
              <p className="text-sm text-gray-500">
                Built with Next.js and FastAPI
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}