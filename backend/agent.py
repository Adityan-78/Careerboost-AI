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
    Optimized for fast response with Llama 3.2 3B.
    """
    try:
        bullet_instruction = (
            "Rewrite ALL resume bullets in natural, human-like language."
            if rewrite_all_bullets
            else "Rewrite ONLY the resume bullets relevant to this job in natural language."
        )
        
        system_prompt = """You are an expert resume optimizer. Return ONLY valid JSON, no markdown.
Be concise and accurate. Use natural human language, not robotic."""
        
        # Trim inputs for faster processing
        resume_excerpt = resume_text[:4000]
        jd_excerpt = job_description[:2500]
        
        user_prompt = f"""Analyze resume vs job description. Return ONLY JSON (no markdown, no code blocks):

RESUME:
{resume_excerpt}

JOB DESCRIPTION:
{jd_excerpt}

{bullet_instruction}

Return this EXACT JSON structure:
{{
  "skill_match_percentage": <number 0-100>,
  "matched_skills": ["skill1", "skill2", ...],
  "missing_skills": ["skill3", "skill4", ...],
  "optimized_resume_bullets": ["bullet1 in natural language", "bullet2", ...],
  "cover_letter": "2-3 paragraph professional cover letter",
  "interview_prep": [
    {{
      "question": "Interview question text?",
      "category": "Technical",
      "suggested_answer_approach": "Use STAR method: describe situation, task, action, result..."
    }},
    {{
      "question": "Another question?",
      "category": "Behavioral",
      "suggested_answer_approach": "Focus on specific examples and measurable outcomes..."
    }}
  ]
}}

Generate 6 interview questions (mix of Technical, Behavioral, Experience-Based).
Each question MUST have: question, category, and suggested_answer_approach.
Make bullets sound human, not robotic."""
        
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
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        logger.info(f"Calling OpenRouter API with {MODEL_NAME}...")
        
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                raise Exception(f"API error {response.status_code}: {response.text}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            
            logger.info(f"API response received, parsing JSON...")
            
            # Clean markdown formatting
            content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            
            # Extract JSON if wrapped in text
            if '{' in content and '}' in content:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                content = content[json_start:json_end]
            
            # Parse JSON
            result_data = json.loads(content)
            
            # Ensure interview_prep has suggested_answer_approach
            if 'interview_prep' in result_data:
                for q in result_data['interview_prep']:
                    if 'suggested_answer_approach' not in q:
                        # Add default if missing
                        q['suggested_answer_approach'] = "Use specific examples from your experience. Be clear, concise, and demonstrate your skills with measurable results."
            
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
        logger.error(f"Content was: {content[:500]}")
        raise Exception(f"Failed to parse API response as JSON: {str(je)}")
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise Exception(f"Failed to analyze resume: {str(e)}")