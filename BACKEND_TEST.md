# Backend API Testing Guide

## Local Testing Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create .env File

Create a `.env` file in the `backend/` directory:

```bash
OPENROUTER_API_KEY=your_actual_api_key_here
PORT=8000
```

### 3. Run the Server Locally

```bash
cd backend
python main.py
```

Server will start at `http://localhost:8000`

## API Endpoints

### Health Check
```bash
GET http://localhost:8000/
GET http://localhost:8000/health
```

### Resume Analysis
```bash
POST http://localhost:8000/analyze
```

## Test Payloads

### Test 1: Text Input Only

```bash
curl -X POST http://localhost:8000/analyze \
  -F "resume_text=JOHN DOE
Full Stack Developer
Email: john@example.com | Phone: (555) 123-4567

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2020-Present
- Developed scalable REST APIs using Python and FastAPI serving 50,000+ daily users
- Implemented microservices architecture using Docker and Kubernetes
- Optimized database queries reducing response time by 45%
- Led team of 4 developers in agile environment

Software Developer | StartupXYZ | 2018-2020  
- Built full stack web applications using React and Node.js
- Designed PostgreSQL databases and wrote complex SQL queries
- Integrated third party APIs including Stripe and SendGrid
- Participated in code reviews and pair programming sessions

SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frameworks: FastAPI, Django, React, Node.js
Databases: PostgreSQL, MongoDB, Redis  
Tools: Docker, Git, AWS, Jenkins
Other: REST APIs, Microservices, Agile, TDD" \
  -F "job_description=Senior Backend Engineer

We are looking for an experienced Backend Engineer to join our growing team.

Requirements:
- 5+ years of experience in backend development
- Strong expertise in Python and FastAPI
- Experience with PostgreSQL and database optimization
- Knowledge of Docker and Kubernetes
- Experience with AWS cloud services
- Understanding of microservices architecture
- Excellent problem solving skills
- Strong communication and teamwork abilities

Nice to have:
- Experience with GraphQL
- Knowledge of Redis caching
- Experience with CI/CD pipelines
- Contributions to open source projects

We offer competitive salary, remote work options, and great benefits." \
  -F "rewrite_all_bullets=false"
```

### Test 2: Rewrite All Bullets

```bash
curl -X POST http://localhost:8000/analyze \
  -F "resume_text=JANE SMITH
Marketing Manager

EXPERIENCE  
Marketing Lead at Digital Agency (2021-Present)
- Managed social media campaigns
- Increased follower engagement
- Created content calendars
- Analyzed marketing metrics
- Coordinated with design team

Marketing Coordinator (2019-2021)
- Assisted with email campaigns  
- Scheduled social posts
- Tracked campaign performance
- Supported event planning" \
  -F "job_description=Social Media Manager

Looking for creative Social Media Manager to lead our brand presence.

Requirements:
- 3+ years social media management experience
- Proven track record of growing engagement
- Experience with content creation and strategy
- Analytics and reporting skills  
- Excellent written communication
- Knowledge of Instagram, TikTok, LinkedIn, Twitter

Bonus:
- Video editing skills
- Influencer partnership experience
- Paid advertising experience" \
  -F "rewrite_all_bullets=true"
```

### Test 3: PDF File Upload

Save this as `test_resume.pdf` or use your own resume PDF:

```bash
curl -X POST http://localhost:8000/analyze \
  -F "resume_file=@/path/to/test_resume.pdf" \
  -F "job_description=Python Developer position requiring FastAPI, PostgreSQL, and Docker experience." \
  -F "rewrite_all_bullets=false"
```

### Test 4: DOCX File Upload

```bash
curl -X POST http://localhost:8000/analyze \
  -F "resume_file=@/path/to/resume.docx" \
  -F "job_description=Looking for Full Stack Developer with React and Node.js experience." \
  -F "rewrite_all_bullets=false"
```

## Expected Response Format

All successful responses return JSON with this structure:

```json
{
  "skill_match_percentage": 75.5,
  "matched_skills": [
    "Python",
    "FastAPI", 
    "PostgreSQL",
    "Docker",
    "Microservices"
  ],
  "missing_skills": [
    "AWS",
    "Kubernetes",
    "GraphQL"
  ],
  "optimized_resume_bullets": [
    "Developed scalable REST APIs using Python and FastAPI, serving over 50,000 daily users with 99.9% uptime",
    "Implemented microservices architecture using Docker, improving deployment efficiency by 60%",
    "Optimized PostgreSQL database queries, reducing average response time by 45% and improving user experience"
  ],
  "cover_letter": "Dear Hiring Manager,\n\nI am excited to apply for the Senior Backend Engineer position at your company. With over 5 years of experience building scalable backend systems using Python and FastAPI, I am confident I can make immediate contributions to your team.\n\nIn my current role at TechCorp Inc., I have successfully developed REST APIs serving 50,000+ daily users and implemented microservices architecture using Docker. My experience optimizing PostgreSQL databases aligns perfectly with your requirement for database expertise. I am particularly drawn to this opportunity because of your focus on microservices and cloud-native solutions.\n\nI would love to discuss how my background in Python, FastAPI, and distributed systems can help drive your platform's growth. Thank you for considering my application.\n\nBest regards,\nJohn Doe",
  "interview_prep": [
    {
      "question": "Can you walk me through your experience designing and implementing REST APIs with FastAPI? What were some challenges you faced?",
      "category": "Technical",
      "suggested_answer_approach": "Use the STAR method. Describe a specific project where you built APIs with FastAPI, mention technical challenges like handling high traffic or data validation, explain your solution using FastAPI's features (async, Pydantic models), and share measurable results like response times or user growth."
    },
    {
      "question": "How do you approach database optimization? Can you give an example from your PostgreSQL experience?",
      "category": "Technical",
      "suggested_answer_approach": "Discuss your process: identifying slow queries, analyzing execution plans, adding appropriate indexes, optimizing joins, and using caching. Reference the 45% performance improvement from your resume and explain the specific techniques used."
    },
    {
      "question": "Tell me about a time you had to make a difficult technical decision. How did you approach it?",
      "category": "Behavioral",
      "suggested_answer_approach": "Choose an example that shows your decision-making process, how you evaluated trade-offs, gathered input from teammates, and made a data-driven choice. Emphasize the outcome and what you learned."
    },
    {
      "question": "How would you design a microservices architecture for a high-traffic e-commerce platform?",
      "category": "Scenario-Based",
      "suggested_answer_approach": "Start with identifying services (user, product, order, payment), discuss communication patterns (REST/gRPC), data management (database per service), deployment (Docker/Kubernetes), and monitoring. Reference your microservices experience from your resume."
    },
    {
      "question": "What strategies do you use to ensure your APIs can handle 50,000+ daily users?",
      "category": "Experience-Based",
      "suggested_answer_approach": "Discuss horizontal scaling, load balancing, caching strategies (Redis), asynchronous processing, database connection pooling, and monitoring. Connect this to your actual experience mentioned in your resume."
    }
  ]
}
```

## Error Response Examples

### Missing Resume Input
```json
{
  "detail": "Please provide either a resume file or resume text"
}
```

### Invalid File Type
```json
{
  "detail": "Invalid file type. Allowed types: .pdf, .docx, .doc"
}
```

### Empty Job Description
```json
{
  "detail": "Job description cannot be empty"
}
```

### Server Error
```json
{
  "detail": "Failed to analyze resume after 3 attempts: <error details>"
}
```

## Testing with Postman

1. **Import to Postman**
   - Method: POST
   - URL: `http://localhost:8000/analyze`
   - Body: form-data

2. **Add Form Fields**
   - Key: `resume_text` | Type: Text | Value: (paste resume text)
   - Key: `job_description` | Type: Text | Value: (paste JD)
   - Key: `rewrite_all_bullets` | Type: Text | Value: `false` or `true`

3. **Or Upload File**
   - Key: `resume_file` | Type: File | Value: (select PDF/DOCX)
   - Key: `job_description` | Type: Text | Value: (paste JD)
   - Key: `rewrite_all_bullets` | Type: Text | Value: `false`

## Python Test Script

Save as `test_api.py`:

```python
import requests

# Local testing
API_URL = "http://localhost:8000/analyze"

# Or test deployed version
# API_URL = "https://your-app.onrender.com/analyze"

# Test data
resume_text = """
JOHN DOE
Software Engineer

EXPERIENCE
Backend Developer | 2020-Present
- Built REST APIs with FastAPI
- Worked with PostgreSQL databases
- Deployed using Docker containers
"""

job_description = """
Senior Python Developer

Requirements:
- FastAPI experience
- PostgreSQL knowledge
- Docker skills
"""

# Make request
response = requests.post(
    API_URL,
    data={
        "resume_text": resume_text,
        "job_description": job_description,
        "rewrite_all_bullets": "false"
    }
)

# Print results
print("Status Code:", response.status_code)
print("\nResponse:")
print(response.json())
```

Run with:
```bash
python test_api.py
```

## Performance Expectations

- **Local**: Response time < 5 seconds
- **Deployed (Render Free Tier)**:
  - First request (cold start): 30-60 seconds
  - Subsequent requests: 5-15 seconds
- **Deployed (Paid Tier)**: Response time < 10 seconds

## Troubleshooting

1. **Connection Refused**
   - Ensure server is running: `python main.py`
   - Check port 8000 is not in use

2. **OpenRouter API Errors**
   - Verify API key is correct in `.env`
   - Check OpenRouter dashboard for credits/limits

3. **File Upload Fails**
   - Ensure file path is correct
   - Verify file is PDF or DOCX format
   - Check file is not corrupted

4. **Slow Responses**
   - Free tier models may have rate limits
   - First request to deployed API has cold start delay
   - Large resume/JD text takes longer to process

Your backend is now ready for testing! 🧪