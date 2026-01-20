# Backend Deployment Guide - Render

## Prerequisites

1. **OpenRouter API Key**
   - Sign up at https://openrouter.ai/
   - Get your API key from the dashboard
   - The free tier of `meta-llama/llama-3.3-70b-instruct:free` is used (superior performance, free)

2. **Render Account**
   - Sign up at https://render.com/
   - Free tier available

## Deployment Steps

### Step 1: Prepare Your Code

1. Ensure all backend files are in the `backend/` directory:
   ```
   backend/
   ├── main.py
   ├── agent.py
   ├── schemas.py
   ├── utils.py
   ├── requirements.txt
   └── .env.example
   ```

2. Push your code to GitHub (or GitLab/Bitbucket)

### Step 2: Deploy on Render

1. **Create New Web Service**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `careerboost-ai-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables**
   - Click "Environment" tab
   - Add the following:
     - **Key**: `OPENROUTER_API_KEY`
     - **Value**: Your OpenRouter API key
   
4. **Instance Type**
   - Select "Free" tier (sufficient for testing)
   - For production, consider "Starter" tier

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (usually 2-5 minutes)

### Step 3: Verify Deployment

1. Once deployed, Render will provide a URL like:
   ```
   https://careerboost-ai-backend.onrender.com
   ```

2. Test the health endpoint:
   ```bash
   curl https://your-app-name.onrender.com/health
   ```

3. Expected response:
   ```json
   {
     "status": "healthy",
     "api_key_configured": true,
     "max_text_size": 50000
   }
   ```

### Step 4: Get Your Backend URL

- Copy your Render app URL
- You'll need this for the frontend `NEXT_PUBLIC_API_URL` environment variable
- Example: `https://careerboost-ai-backend.onrender.com`

## Testing the API

### Test with cURL

```bash
# Test with text input
curl -X POST https://your-app-name.onrender.com/analyze \
  -F "resume_text=Experienced Python developer with 5 years in backend development. Skilled in FastAPI, Django, PostgreSQL, Docker." \
  -F "job_description=Looking for a Senior Python Developer with FastAPI, PostgreSQL, and AWS experience." \
  -F "rewrite_all_bullets=false"

# Test with PDF file upload
curl -X POST https://your-app-name.onrender.com/analyze \
  -F "resume_file=@/path/to/your/resume.pdf" \
  -F "job_description=Looking for a Senior Python Developer..." \
  -F "rewrite_all_bullets=false"
```

## Important Notes

### Free Tier Limitations (Render)
- Service spins down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds (cold start)
- 750 hours/month free tier

### Monitoring
- View logs in Render dashboard under "Logs" tab
- Monitor API usage in OpenRouter dashboard

### Troubleshooting

1. **Deployment fails**
   - Check build logs for missing dependencies
   - Verify `requirements.txt` is correct

2. **API returns 500 errors**
   - Check environment variables are set correctly
   - Verify OpenRouter API key is valid
   - Check logs for detailed error messages

3. **Slow responses**
   - Free tier has cold starts
   - Consider upgrading to paid tier for production
   - Free model (`llama-3.3-70b-instruct:free`) is powerful but may have rate limits

## Production Recommendations

1. **Upgrade Instance Type**
   - Use "Starter" or higher for consistent performance
   - Prevents cold starts

2. **Update CORS Settings**
   - In `main.py`, replace `allow_origins=["*"]` with your frontend domain:
   ```python
   allow_origins=["https://your-frontend.vercel.app"]
   ```

3. **Add Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Use libraries like `slowapi`

4. **Monitor Usage**
   - Set up alerts for API errors
   - Monitor OpenRouter credit usage

## Next Steps

Once backend is deployed:
1. Copy your backend URL
2. Use it to configure frontend `NEXT_PUBLIC_API_URL`
3. Deploy frontend on Vercel

Your backend is now live and ready to receive requests! 🚀