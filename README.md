# 🚀 CareerBoost AI - Complete Full-Stack Application

**AI-Powered Resume Optimization & Interview Practice Platform**

CareerBoost AI is a production-ready, full-stack application that helps job seekers optimize their resumes, generate personalized cover letters, and practice interviews with AI-powered feedback.

---

## ✨ Features

### 📄 Resume Optimization
- Upload PDF/DOCX resumes or paste text
- AI-powered skill extraction and matching
- Calculate skill match percentage against job descriptions
- Generate ATS-optimized resume bullets in natural language
- Create personalized, professional cover letters
- Get suggested interview questions with answer strategies

### 🎤 Interview Practice (NEW!)
- Interactive chat interface for interview simulation
- Real-time AI-generated interview questions
- Instant feedback on answers with:
  - Score (1-10)
  - Strengths analysis
  - Areas for improvement
  - Suggested better answers
- Custom instructions support
- Chat history export
- Session management

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI
- **AI Model**: Llama 3.3 70B Instruct (via OpenRouter - FREE)
- **File Parsing**: pypdf (PDF), python-docx (Word)
- **HTTP Client**: httpx
- **Deployment**: Render

---

## 📋 Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **OpenRouter API Key** (free tier available at https://openrouter.ai/)
- **Git** (for deployment)

---

## 🚀 Quick Start

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/careerboost-ai.git
cd careerboost-ai
```

### 2️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Edit .env and add your OpenRouter API key
# OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3️⃣ Get OpenRouter API Key

1. Visit https://openrouter.ai/
2. Sign up (free)
3. Go to API Keys section
4. Create new API key
5. Copy to your `.env` file

### 4️⃣ Run Backend

```bash
# Using start script (recommended)
python start.py

# Or using uvicorn directly
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`

### 5️⃣ Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.local.example .env.local  # Windows
cp .env.local.example .env.local    # macOS/Linux

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## 🧪 Testing

### Backend Tests

```bash
# Health check
curl http://localhost:8000/health

# Test resume optimization
curl -X POST http://localhost:8000/analyze \
  -F "resume_text=Software Engineer with Python, FastAPI, PostgreSQL experience" \
  -F "job_description=Senior Python Developer needed. Skills: Python, FastAPI, PostgreSQL, AWS" \
  -F "rewrite_all_bullets=false"
```

### Frontend Tests

1. Open `http://localhost:3000`
2. Navigate to "Resume Optimizer"
3. Upload resume or paste text
4. Paste job description
5. Click "Optimize Resume"

For interview practice:
1. Click "Interview Practice" in nav
2. Upload resume and paste JD
3. Add custom instructions (optional)
4. Click "Start Interview Practice"
5. Answer questions and receive feedback

---

## 📦 Deployment

### Backend (Render)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name**: `careerboost-ai-backend`
     - **Root Directory**: `backend`
     - **Runtime**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variable:
     - `OPENROUTER_API_KEY`: Your API key
   - Click "Create Web Service"

3. **Copy Backend URL**
   - Example: `https://careerboost-ai-backend.onrender.com`

### Frontend (Vercel)

1. **Create production env file**
   ```bash
   cd frontend
   echo "NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com" > .env.production
   ```

2. **Deploy on Vercel**
   - Visit https://vercel.com/
   - Click "Import Project"
   - Select your GitHub repository
   - Configure:
     - **Root Directory**: `frontend`
     - **Framework Preset**: Next.js
   - Add Environment Variable:
     - `NEXT_PUBLIC_API_URL`: Your Render backend URL
   - Click "Deploy"

3. **Your app is live!**
   - Frontend: `https://your-app.vercel.app`
   - Backend: `https://your-backend.onrender.com`

---

## 📖 API Documentation

### Resume Optimization

**POST `/analyze`**

Analyze resume and optimize for job description.

**Request (multipart/form-data)**:
- `resume_file` (File, optional): PDF/DOCX file
- `resume_text` (String, optional): Plain text
- `job_description` (String, required): Job description
- `rewrite_all_bullets` (Boolean, optional): Default false

**Response**:
```json
{
  "skill_match_percentage": 75.0,
  "matched_skills": ["Python", "FastAPI"],
  "missing_skills": ["AWS"],
  "optimized_resume_bullets": [...],
  "cover_letter": "Dear Hiring Manager...",
  "interview_prep": [...]
}
```

### Interview Practice

**POST `/interview/start`**

Start new interview session.

**Request**:
- `session_id` (String): Unique session ID
- `resume_file` or `resume_text`
- `job_description` (String)
- `custom_instructions` (String, optional)

**Response**:
```json
{
  "message": "First interview question...",
  "question": "Can you describe your Python experience?",
  "session_id": "session-123"
}
```

**POST `/interview/chat`**

Continue interview with answer.

**Request**:
- `session_id` (String)
- `user_answer` (String)
- `custom_instructions` (String, optional)

**Response**:
```json
{
  "message": "Feedback message...",
  "feedback": {
    "score": 8,
    "strengths": [...],
    "improvements": [...],
    "suggested_answer": "..."
  },
  "next_question": "Next question..."
}
```

---

## 📁 Project Structure

```
careerboost-ai/
├── backend/
│   ├── main.py                 # FastAPI app + routes
│   ├── agent.py                # Resume optimization AI
│   ├── interview_agent.py      # Interview practice AI
│   ├── schemas.py              # Pydantic models
│   ├── utils.py                # File parsing utilities
│   ├── start.py                # Startup script
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment template
│   └── .env                    # Your API keys (create this)
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + navigation
│   │   ├── page.tsx            # Resume optimizer page
│   │   ├── interview/
│   │   │   └── page.tsx        # Interview practice page
│   │   └── globals.css         # Global styles
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── .env.local.example
│   └── .env.local              # API URL (create this)
│
├── README.md
├── BACKEND_DEPLOYMENT.md
├── BACKEND_TESTING_GUIDE.md
└── BACKEND_TEST.md
```

---

## 🎯 Usage Examples

### Resume Optimization

1. **Upload your resume** (PDF/DOCX) or paste text
2. **Paste job description** from job posting
3. **Optional**: Check "Rewrite all bullets"
4. **Click "Optimize Resume"**
5. **Review results**:
   - Skill match percentage
   - Matched/missing skills
   - Optimized resume bullets
   - Personalized cover letter
   - Interview prep questions

### Interview Practice

1. **Upload resume + paste JD**
2. **Add custom instructions** (optional):
   - "Focus on technical questions"
   - "Ask behavioral questions"
   - "Simulate senior-level interview"
3. **Click "Start Interview Practice"**
4. **Answer questions** in chat
5. **Receive instant feedback**:
   - Score (1-10)
   - What you did well
   - Areas to improve
   - Suggested better answer
6. **Continue practicing** multiple questions
7. **Export chat** for review later

---

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
PORT=8000
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Production Frontend** (`.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 🐛 Troubleshooting

### Backend Issues

**Module not found errors**:
```bash
pip install -r requirements.txt --force-reinstall
```

**API key errors**:
- Verify `.env` file exists in `backend/` folder
- Check no extra spaces around `=` sign
- Verify key is valid at https://openrouter.ai/

**Port already in use**:
```bash
# Change port in .env
PORT=8001
```

### Frontend Issues

**Cannot connect to API**:
- Verify backend is running: `http://localhost:8000/health`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for errors

**Build errors**:
```bash
rm -rf .next node_modules
npm install
npm run dev
```

---

## 📊 Performance

- **First API request**: 10-30 seconds (model loading)
- **Subsequent requests**: 5-15 seconds
- **Interview chat**: 5-10 seconds per response
- **Model**: Llama 3.3 70B (free, powerful, accurate)

---

## 🔒 Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Enable CORS only for your frontend domain in production
- Rate limit API in production
- Sanitize all user inputs

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

## 📄 License

MIT License - free for personal and commercial use

---

## 🙏 Acknowledgments

- **OpenRouter** - Free AI model API access
- **Llama 3.3 70B** - Powerful open-source model
- **FastAPI** - Modern Python web framework
- **Next.js** - React framework for production
- **Pydantic** - Data validation

---

## 🗺️ Roadmap

- [ ] User authentication
- [ ] Save interview sessions to database
- [ ] Multiple AI model options
- [ ] Resume templates
- [ ] LinkedIn integration
- [ ] Mobile app
- [ ] Team collaboration features
- [ ] Analytics dashboard

---

## 📞 Support

- **Issues**: Open GitHub issue
- **Questions**: Check documentation first
- **Feature Requests**: Submit via GitHub

---


⭐ Star this repo if CareerBoost AI helped you land your dream job!