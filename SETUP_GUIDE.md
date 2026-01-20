# 🎯 Complete Setup Guide - CareerBoost AI

**Follow these steps exactly to get your app running in 15 minutes**

---

## ✅ Prerequisites Checklist

Before starting, make sure you have:

- [ ] Windows/Mac/Linux computer
- [ ] Python 3.9+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Terminal/Command Prompt access

---

## 📥 PART 1: Project Setup (5 minutes)

### Step 1: Create Project Folder

```bash
# Create main project folder
mkdir careerboost-ai
cd careerboost-ai

# Create backend and frontend folders
mkdir backend
mkdir frontend
```

### Step 2: Save Backend Files

Create these files in the `backend/` folder:

1. **`backend/main.py`** - Copy from artifact "backend/main.py"
2. **`backend/agent.py`** - Copy from artifact "backend/agent.py"
3. **`backend/interview_agent.py`** - Copy from artifact "backend/interview_agent.py"
4. **`backend/schemas.py`** - Copy from artifact "backend/schemas.py"
5. **`backend/utils.py`** - Copy from artifact "backend/utils.py"
6. **`backend/requirements.txt`** - Copy from artifact "backend/requirements.txt"
7. **`backend/.env.example`** - Copy from artifact "backend/.env.example"
8. **`backend/start.py`** - Copy from artifact "backend/start.py"

### Step 3: Save Frontend Files

Create these files in the `frontend/` folder:

1. **`frontend/package.json`** - Copy from artifact "frontend/package.json"
2. **`frontend/tailwind.config.js`** - Copy from artifact
3. **`frontend/postcss.config.js`** - Copy from artifact
4. **`frontend/next.config.js`** - Copy from artifact
5. **`frontend/tsconfig.json`** - Copy from artifact
6. **`frontend/.env.local.example`** - Copy from artifact

Create `frontend/app/` folder and these files:

7. **`frontend/app/layout.tsx`** - Copy from artifact
8. **`frontend/app/page.tsx`** - Copy from artifact
9. **`frontend/app/globals.css`** - Copy from artifact

Create `frontend/app/interview/` folder:

10. **`frontend/app/interview/page.tsx`** - Copy from artifact

### Step 4: Save Documentation

In project root (`careerboost-ai/`):

1. **`README.md`** - Copy from artifact
2. **`BACKEND_DEPLOYMENT.md`** - Already created
3. **`BACKEND_TESTING_GUIDE.md`** - Already created
4. **`BACKEND_TEST.md`** - Already created

---

## 🔧 PART 2: Backend Setup (5 minutes)

### Step 1: Navigate to Backend

```bash
cd backend
```

### Step 2: Create Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your prompt.

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- fastapi
- uvicorn
- pydantic-ai
- httpx
- pypdf
- python-docx
- python-dotenv
- python-multipart

### Step 4: Get OpenRouter API Key

1. Go to https://openrouter.ai/
2. Click "Sign In" or "Sign Up"
3. After login, click your profile → "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-or-v1-...`)

### Step 5: Create .env File

```bash
# Copy example file
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux

# Edit .env file
notepad .env  # Windows
nano .env     # macOS/Linux
```

Add your API key:
```
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
PORT=8000
```

Save and close.

### Step 6: Test Backend

```bash
python start.py
```

**Expected output:**
```
Loading .env from: ...\backend\.env
✅ .env file loaded
✅ API key found: sk-or-v1-...

🚀 Starting server on port 8000...
INFO:     Started server process [xxxxx]
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Backend is running!**

### Step 7: Test Health Endpoint

Open browser: `http://localhost:8000/health`

Should see:
```json
{
  "status": "healthy",
  "api_key_configured": true,
  "max_text_size": 50000,
  "active_sessions": 0
}
```

✅ **Backend is working!**

---

## 💻 PART 3: Frontend Setup (5 minutes)

### Step 1: Open New Terminal

**Important**: Keep backend running! Open a NEW terminal/command prompt.

### Step 2: Navigate to Frontend

```bash
cd careerboost-ai/frontend
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- next
- react
- react-dom
- tailwindcss
- typescript
- lucide-react

Wait for installation to complete (may take 2-3 minutes).

### Step 4: Create .env.local File

```bash
# Copy example
copy .env.local.example .env.local  # Windows
cp .env.local.example .env.local    # macOS/Linux

# Edit file
notepad .env.local  # Windows
nano .env.local     # macOS/Linux
```

Add:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Save and close.

### Step 5: Run Frontend

```bash
npm run dev
```

**Expected output:**
```
   ▲ Next.js 14.2.5
   - Local:        http://localhost:3000
   - Ready in 2.3s
```

✅ **Frontend is running!**

### Step 6: Test in Browser

Open: `http://localhost:3000`

You should see:
- Navigation bar with "CareerBoost AI"
- Two links: "Resume Optimizer" and "Interview Practice"
- Resume upload form

✅ **Frontend is working!**

---

## 🧪 PART 4: Full Test (2 minutes)

### Test 1: Resume Optimization

1. Go to `http://localhost:3000`
2. Click "Resume Optimizer" (or you're already there)
3. In "Resume Text" box, paste:
   ```
   John Doe
   Software Engineer
   
   Experience:
   - Built REST APIs using Python and FastAPI
   - Worked with PostgreSQL databases
   - Deployed apps using Docker
   
   Skills: Python, FastAPI, PostgreSQL, Docker
   ```

4. In "Job Description" box, paste:
   ```
   Senior Python Developer
   
   Requirements:
   - 5+ years Python experience
   - FastAPI framework expertise
   - PostgreSQL database knowledge
   - Docker containerization
   - AWS cloud experience
   ```

5. Click "Optimize Resume"

6. Wait 10-30 seconds (first request is slow)

7. You should see:
   - Skill match percentage
   - Matched skills (Python, FastAPI, PostgreSQL, Docker)
   - Missing skills (AWS)
   - Optimized resume bullets
   - Personalized cover letter
   - Interview prep questions

✅ **Resume optimization works!**

### Test 2: Interview Practice

1. Click "Interview Practice" in navigation

2. Upload same resume text and job description

3. In "Custom Instructions" box, type:
   ```
   Ask me technical questions about Python and FastAPI
   ```

4. Click "Start Interview Practice"

5. Wait 5-15 seconds

6. You should see:
   - First interview question
   - Chat interface
   - Answer input box

7. Type an answer (any answer) and click "Send"

8. Wait 5-15 seconds

9. You should receive:
   - Score (1-10)
   - Strengths
   - Areas to improve
   - Suggested better answer
   - Next question

✅ **Interview practice works!**

---

## 🎉 SUCCESS! Your App is Running

You now have:

✅ Backend running on `http://localhost:8000`
✅ Frontend running on `http://localhost:3000`
✅ Resume optimization working
✅ Interview practice working

---

## 📌 Daily Usage

### Starting the App

**Terminal 1 (Backend):**
```bash
cd careerboost-ai/backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
python start.py
```

**Terminal 2 (Frontend):**
```bash
cd careerboost-ai/frontend
npm run dev
```

### Stopping the App

Press `Ctrl+C` in both terminals.

---

## 🚀 Next Steps

### Option 1: Keep Using Locally
Just run the app whenever you need it!

### Option 2: Deploy to Production
Follow these guides:
1. **Backend**: Read `BACKEND_DEPLOYMENT.md`
2. **Frontend**: Instructions in `README.md` → Deployment section

---

## 🐛 Common Issues

### "Module not found" errors

**Fix:**
```bash
# Backend
cd backend
pip install -r requirements.txt --force-reinstall

# Frontend
cd frontend
rm -rf node_modules .next
npm install
```

### "Port already in use"

**Fix:**
```bash
# Change backend port in .env
PORT=8001

# Or find and kill the process
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:8000 | xargs kill -9
```

### Backend can't find .env file

**Fix:**
```bash
# Make sure you're in the backend folder
cd backend
ls -la  # Should see .env file

# If not, create it
cp .env.example .env
# Then edit and add your API key
```

### Frontend can't connect to backend

**Fix:**
1. Verify backend is running: `http://localhost:8000/health`
2. Check `.env.local` has correct URL: `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Restart frontend: Ctrl+C, then `npm run dev`

---

## 📞 Need Help?

1. **Check the error message** - usually tells you what's wrong
2. **Read the troubleshooting section** above
3. **Check backend logs** - look at terminal where backend is running
4. **Check browser console** - Press F12, look for errors
5. **Re-read this guide** - make sure you didn't skip a step

---

## ✅ Checklist

Before asking for help, verify:

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] Virtual environment activated (see `(venv)` in prompt)
- [ ] All dependencies installed
- [ ] `.env` file exists with valid API key
- [ ] `.env.local` file exists with correct backend URL
- [ ] Backend is running (check `http://localhost:8000/health`)
- [ ] Frontend is running (check `http://localhost:3000`)
- [ ] No firewall blocking ports 8000 or 3000

---

**Congratulations! You now have a fully functional AI-powered career platform! 🎉**