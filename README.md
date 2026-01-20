# 🚀 CareerBoost AI

**Resume and Job Application Optimization System powered by Pydantic AI**

CareerBoost AI is a production-ready, full-stack generative AI application that helps job seekers optimize their resumes, generate personalized cover letters, and prepare for interviews based on specific job descriptions.

---

## ✨ Features

- 📄 **Resume Parsing**: Upload PDF/DOCX files or paste resume text
- 🎯 **Skill Matching**: AI-powered skill extraction and matching against job requirements
- 📊 **Match Percentage**: Calculate how well your resume matches the job description
- ✍️ **Resume Optimization**: ATS-optimized bullet points in natural, human-like language
- 💌 **Cover Letter Generation**: Personalized, professional cover letters tailored to each role
- 🎤 **Interview Preparation**: Get 5-8 relevant interview questions with answer strategies
- 🔄 **Flexible Optimization**: Choose to rewrite all bullets or only job-relevant ones

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **HTTP Client**: Fetch API
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI
- **AI Agent**: Pydantic AI
- **LLM Model**: Llama 3.3 70B Instruct (via OpenRouter)
- **File Parsing**: PyMuPDF (PDF), python-docx (Word)
- **Deployment**: Render

---

## 📋 Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **OpenRouter API Key** (free tier available)
- **Git** (for deployment)

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/careerboost-ai.git
cd careerboost-ai
```

### 2️⃣ Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your OpenRouter API key
# OPENROUTER_API_KEY=your_actual_key_here
```

### 3️⃣ Get OpenRouter API Key

1. Go to https://openrouter.ai/
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

### 4️⃣ Run Backend Locally

```bash
# Make sure you're in the backend folder with venv activated
python main.py
```

Backend will run at: `http://localhost:8000`

Test it: Open `http://localhost:8000/health` in your browser

### 5️⃣ Frontend Setup (After backend is running)

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

Frontend will run at: `http://localhost:3000`

---

## 🧪 Testing the Backend

### Test 1: Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "api_key_configured": true,
  "max_text_size": 50000
}
```

### Test 2: Resume Analysis (Text Input)

Create a test file `test_request.sh`:

```bash
#!/bin/bash

curl -X POST http://localhost:8000/analyze \
  -F "resume_text=JANE DOE
Software Engineer | jane@email.com

EXPERIENCE
Senior Backend Developer | TechCorp | 2020-Present
- Built REST APIs using Python and FastAPI
- Optimized PostgreSQL databases for performance
- Deployed applications using Docker containers
- Led team of 3 junior developers

Junior Developer | StartupXYZ | 2018-2020
- Developed web applications with React
- Wrote unit tests and integration tests
- Participated in agile sprint planning

SKILLS
Python, FastAPI, Django, PostgreSQL, Docker, React, Git, REST APIs" \
  -F "job_description=Senior Backend Engineer

We need an experienced backend engineer to join our team.

Requirements:
- 5+ years Python development
- Strong FastAPI experience
- PostgreSQL database expertise
- Docker and containerization
- Experience leading technical teams
- REST API design and development

Nice to have:
- AWS cloud experience
- Kubernetes knowledge
- GraphQL experience" \
  -F "rewrite_all_bullets=false"
```

Run it:
```bash
chmod +x test_request.sh
./test_request.sh
```

### Test 3: PDF Upload Test

```bash
curl -X POST http://localhost:8000/analyze \
  -F "resume_file=@/path/to/your/resume.pdf" \
  -F "job_description=Python Developer position requiring FastAPI and PostgreSQL" \
  -F "rewrite_all_bullets=false"
```

### Test 4: Python Test Script

Create `test_api.py`:

```python
import requests
import json

API_URL = "http://localhost:8000/analyze"

resume_text = """
JOHN SMITH
Full Stack Developer
john.smith@email.com | (555) 123-4567

EXPERIENCE

Software Engineer | ABC Tech | 2019-Present
- Developed scalable web applications using React and Node.js
- Built RESTful APIs serving 10,000+ daily users
- Implemented CI/CD pipelines using Jenkins
- Collaborated with cross-functional teams in agile environment

Junior Developer | XYZ Startup | 2017-2019
- Created responsive web interfaces with HTML, CSS, JavaScript
- Integrated third-party APIs including Stripe and SendGrid
- Wrote automated tests with Jest and Cypress
- Participated in code reviews and pair programming

SKILLS
Languages: JavaScript, TypeScript, Python, HTML, CSS
Frameworks: React, Node.js, Express, Next.js
Databases: MongoDB, PostgreSQL
Tools: Git, Docker, AWS, Jenkins
"""

job_description = """
Senior Full Stack Developer

We're seeking a talented Full Stack Developer to join our growing team.

Requirements:
- 3+ years of professional development experience
- Strong proficiency in React and Node.js
- Experience with RESTful API development
- Knowledge of MongoDB or PostgreSQL
- Familiarity with cloud platforms (AWS/GCP/Azure)
- Experience with CI/CD practices
- Strong communication and teamwork skills

Responsibilities:
- Build and maintain web applications
- Design and implement RESTful APIs
- Collaborate with designers and product managers
- Write clean, maintainable code
- Participate in code reviews
- Mentor junior developers

Nice to have:
- TypeScript experience
- Docker/Kubernetes knowledge
- Experience with microservices architecture
"""

print("Sending request to API...")
print("=" * 60)

response = requests.post(
    API_URL,
    data={
        "resume_text": resume_text,
        "job_description": job_description,
        "rewrite_all_bullets": "false"
    }
)

print(f"Status Code: {response.status_code}\n")

if response.status_code == 200:
    result = response.json()
    
    print("✅ SUCCESS!\n")
    print("=" * 60)
    print(f"📊 Skill Match: {result['skill_match_percentage']}%\n")
    
    print("✅ Matched Skills:")
    for skill in result['matched_skills']:
        print(f"   • {skill}")
    
    print(f"\n❌ Missing Skills:")
    for skill in result['missing_skills']:
        print(f"   • {skill}")
    
    print(f"\n📝 Optimized Resume Bullets ({len(result['optimized_resume_bullets'])}):")
    for i, bullet in enumerate(result['optimized_resume_bullets'], 1):
        print(f"   {i}. {bullet}")
    
    print(f"\n💌 Cover Letter Preview:")
    print("   " + result['cover_letter'][:200] + "...")
    
    print(f"\n🎤 Interview Prep Questions ({len(result['interview_prep'])}):")
    for i, q in enumerate(result['interview_prep'], 1):
        print(f"\n   Question {i} [{q['category']}]:")
        print(f"   Q: {q['question']}")
        print(f"   A: {q['suggested_answer_approach'][:100]}...")
    
    print("\n" + "=" * 60)
    print("Full JSON response saved to 'test_result.json'")
    
    with open('test_result.json', 'w') as f:
        json.dump(result, f, indent=2)
else:
    print("❌ ERROR!")
    print(response.text)
```

Run it:
```bash
python test_api.py
```

---

## 📦 Deployment

### Backend Deployment (Render)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Render**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `careerboost-ai-backend`
     - **Root Directory**: `backend`
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variable:
     - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - Click "Create Web Service"

3. **Get your backend URL**
   - Example: `https://careerboost-ai-backend.onrender.com`
   - Copy this for frontend configuration

### Frontend Deployment (Vercel)

1. **Update frontend environment**
   - Create `.env.production` in frontend folder:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com/
   - Click "Import Project"
   - Select your GitHub repository
   - Configure:
     - **Root Directory**: `frontend`
     - **Framework Preset**: Next.js
     - **Build Command**: `npm run build`
   - Add Environment Variable:
     - `NEXT_PUBLIC_API_URL`: Your Render backend URL
   - Click "Deploy"

3. **Your app is live!**
   - Vercel will provide a URL: `https://your-app.vercel.app`

---

## 📖 API Documentation

### POST `/analyze`

Analyze resume against job description and generate optimization.

**Request (multipart/form-data)**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resume_file` | File | No* | PDF/DOCX resume file |
| `resume_text` | String | No* | Plain text resume |
| `job_description` | String | Yes | Job description text |
| `rewrite_all_bullets` | Boolean | No | Rewrite all bullets (default: false) |

*Either `resume_file` or `resume_text` must be provided

**Response (200 OK)**:

```json
{
  "skill_match_percentage": 75.0,
  "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
  "missing_skills": ["AWS", "Kubernetes"],
  "optimized_resume_bullets": [
    "Built scalable REST APIs using Python and FastAPI...",
    "Optimized PostgreSQL databases improving performance by 40%..."
  ],
  "cover_letter": "Dear Hiring Manager...",
  "interview_prep": [
    {
      "question": "Can you describe your FastAPI experience?",
      "category": "Technical",
      "suggested_answer_approach": "Use STAR method..."
    }
  ]
}
```

**Error Responses**:

- `400`: Invalid input (missing fields, wrong file type)
- `500`: Server error (AI model failure, parsing error)

---

## 🎯 Usage Example

1. **Upload Resume**: Drag & drop PDF/DOCX or paste text
2. **Paste Job Description**: Copy from job posting
3. **Click "Optimize Resume"**: Wait 5-15 seconds
4. **Review Results**:
   - See skill match percentage
   - Read optimized resume bullets
   - Copy personalized cover letter
   - Prepare for interview with AI-generated questions

---

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```bash
OPENROUTER_API_KEY=sk-or-v1-xxx...
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

**Import errors**:
```bash
pip install -r requirements.txt --upgrade
```

**API key not working**:
- Verify key in `.env` file
- Check OpenRouter dashboard for credits
- Ensure no extra spaces in `.env`

**File upload fails**:
- Check file is PDF or DOCX format
- Ensure file size < 10MB
- Try with plain text first

### Frontend Issues

**API connection fails**:
- Verify backend is running: `curl http://localhost:8000/health`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

**Build errors**:
```bash
rm -rf .next node_modules
npm install
npm run dev
```

---

## 📊 Performance Notes

- **First request**: 30-60 seconds (cold start on free tier)
- **Subsequent requests**: 5-15 seconds
- **Model**: Llama 3.3 70B (free, powerful, accurate)
- **File size limit**: 50,000 characters per input
- **Concurrent requests**: Limited on free tier

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - feel free to use for personal or commercial projects

---

## 🙏 Acknowledgments

- **Pydantic AI** - Structured AI agent framework
- **OpenRouter** - Free LLM API access
- **Llama 3.3 70B** - Powerful open-source model
- **FastAPI** - Modern Python web framework
- **Next.js** - React framework for production

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Questions**: Check existing issues or create new one
- **Feature Requests**: Submit via GitHub issues

---

## 🗺️ Roadmap

- [ ] Add support for multiple resume formats
- [ ] Implement user accounts and history
- [ ] Add more LLM model options
- [ ] Support for multiple languages
- [ ] Resume template suggestions
- [ ] LinkedIn integration
- [ ] Job posting scraper
- [ ] Salary estimation

---


Star ⭐ this repo if it helped you land your dream job!