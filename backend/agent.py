import os
import json
import logging
from dotenv import load_dotenv
from pathlib import Path
import httpx
from schemas import ResumeAnalysisResult

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is required")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "meta-llama/llama-3.2-3b-instruct:free"


async def analyze_resume(resume_text: str, job_description: str, rewrite_all_bullets: bool = False) -> dict:
    """
    Analyze resume against job description using OpenRouter API.
    Optimized for faster response times.
    """
    try:
        bullet_instruction = (
            "Rewrite ALL resume bullets in natural, human-like language."
            if rewrite_all_bullets
            else "Rewrite ONLY the resume bullets that are relevant to this job description in natural language."
        )
        
        system_prompt = """You are an expert resume optimizer. Return ONLY valid JSON.
Extract skills from resume and job description. Be concise.
For matched_skills: all skills in both docs.
For missing_skills: top 5 important skills from JD not in resume.
For interview_prep: exactly 6 questions (Technical, Behavioral, Experience-Based)."""
        
        # Optimized for Devstral - smaller model, needs shorter inputs
        resume_excerpt = resume_text[:3000]  # Optimized for Devstral
        jd_excerpt = job_description[:2000]   # Optimized for Devstral
        
        user_prompt = f"""Analyze this resume against this job description. Be BRIEF and CONCISE.

RESUME:
{resume_excerpt}

JOB DESCRIPTION:
{jd_excerpt}

Return ONLY this JSON (no markdown, no code blocks):
{{
  "skill_match_percentage": <0-100>,
  "matched_skills": ["skill1", "skill2", "skill3"],
  "missing_skills": ["skill4", "skill5"],
  "optimized_resume_bullets": ["bullet1", "bullet2", "bullet3"],
  "cover_letter": "2 paragraph cover letter",
  "interview_prep": [
    {{"question": "Q1?", "category": "Technical"}},
    {{"question": "Q2?", "category": "Technical"}},
    {{"question": "Q3?", "category": "Behavioral"}},
    {{"question": "Q4?", "category": "Behavioral"}},
    {{"question": "Q5?", "category": "Experience-Based"}},
    {{"question": "Q6?", "category": "Problem-Solving"}}
  ]
}}"""
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://careerboost-ai.com"
        }
        
        payload = {
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.5,  # Balanced for consistency
            "max_tokens": 1500   # Reduced for faster Devstral processing
        }
        
        logger.info(f"Calling OpenRouter API with optimized parameters...")
        
        # Use shorter timeout - 60 seconds instead of 120
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                raise Exception(f"API error {response.status_code}: {response.text}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            
            logger.info(f"API response received, parsing JSON...")
            
            # Clean up markdown if present
            content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            
            # Try to extract JSON if it's wrapped in extra text
            if '{' not in content[:10]:
                json_start = content.find('{')
                if json_start != -1:
                    content = content[json_start:]
            
            if '}' not in content[-10:]:
                json_end = content.rfind('}')
                if json_end != -1:
                    content = content[:json_end+1]
            
            # Parse JSON
            result_data = json.loads(content)
            
            # Validate with Pydantic
            validated = ResumeAnalysisResult(**result_data)
            
            # Convert to dict
            return {
                "skill_match_percentage": validated.skill_match_percentage,
                "matched_skills": validated.matched_skills,
                "missing_skills": validated.missing_skills,
                "optimized_resume_bullets": validated.optimized_resume_bullets,
                "cover_letter": validated.cover_letter,
                "interview_prep": [
                    {
                        "question": q.question,
                        "category": q.category,
                        "suggested_answer_approach": q.suggested_answer_approach
                    }
                    for q in validated.interview_prep
                ]
            }
    
    except json.JSONDecodeError as je:
        logger.error(f"JSON parsing error: {str(je)}")
        raise Exception(f"Failed to parse API response as JSON: {str(je)}")
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise Exception(f"Failed to analyze resume: {str(e)}")