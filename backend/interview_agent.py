import os
import json
import logging
from dotenv import load_dotenv
from pathlib import Path
import httpx
from typing import List, Dict, Optional
from pydantic import BaseModel, Field

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY environment variable is required")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "qwen/qwen-2.5-vl-7b-instruct:free"


class InterviewFeedback(BaseModel):
    """Feedback for user's interview answer"""
    score: int = Field(..., ge=1, le=10, description="Score from 1-10")
    strengths: List[str] = Field(..., description="What was good about the answer")
    improvements: List[str] = Field(..., description="Areas to improve")
    suggested_answer: str = Field(..., description="A better way to answer")


class InterviewResponse(BaseModel):
    """Response from interview chat"""
    ai_message: str = Field(..., description="AI's response (question or feedback)")
    feedback: Optional[InterviewFeedback] = Field(None, description="Feedback if user answered")
    next_question: Optional[str] = Field(None, description="Next interview question")


async def generate_interview_question(
    resume_text: str,
    job_description: str,
    chat_history: List[Dict[str, str]],
    custom_instructions: str = ""
) -> str:
    """
    Generate next interview question - optimized for fast Llama 3.2 3B.
    """
    try:
        # Build compact history
        asked_questions = [msg.get('question', '') for msg in chat_history if 'question' in msg]
        history_summary = f"Already asked: {', '.join(asked_questions[:3])}" if asked_questions else "First question"
        
        system_prompt = """You are an expert interviewer. Ask ONE specific, relevant interview question.
Be concise. Make it realistic for the role."""
        
        user_prompt = f"""Generate ONE interview question.

JOB: {job_description[:1200]}
RESUME: {resume_text[:1200]}
PREVIOUS: {history_summary}
INSTRUCTIONS: {custom_instructions if custom_instructions else "General interview"}

Return ONLY the question (no extra text)."""
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.8,
            "max_tokens": 150
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                raise Exception(f"API error: {response.text}")
            
            data = response.json()
            question = data["choices"][0]["message"]["content"].strip()
            
            # Remove any quotes or extra formatting
            question = question.strip('"').strip("'").strip()
            
            return question
    
    except Exception as e:
        logger.error(f"Error generating question: {str(e)}")
        raise Exception(f"Failed to generate question: {str(e)}")


async def evaluate_answer(
    question: str,
    user_answer: str,
    job_description: str,
    resume_text: str
) -> InterviewFeedback:
    """
    Evaluate answer and provide feedback - optimized for Llama 3.2 3B.
    """
    try:
        system_prompt = """You are an interview coach. Provide constructive feedback.
Be specific, encouraging, and helpful. Return ONLY valid JSON."""
        
        user_prompt = f"""Evaluate this interview answer.

QUESTION: {question}
ANSWER: {user_answer}

JOB: {job_description[:800]}
RESUME: {resume_text[:800]}

Return ONLY this JSON (no markdown):
{{
  "score": <1-10>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "suggested_answer": "A better answer would be..."
}}

Score guide: 1-3=Poor, 4-6=Okay, 7-8=Good, 9-10=Excellent
Be specific and constructive."""
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": MODEL_NAME,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 800
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                raise Exception(f"API error: {response.text}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            
            # Clean markdown
            content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            
            # Extract JSON if needed
            if '{' in content and '}' in content:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                content = content[json_start:json_end]
            
            # Parse JSON
            feedback_data = json.loads(content)
            
            # Validate with Pydantic
            feedback = InterviewFeedback(**feedback_data)
            
            return feedback
    
    except Exception as e:
        logger.error(f"Error evaluating answer: {str(e)}")
        raise Exception(f"Failed to evaluate answer: {str(e)}")


async def interview_chat(
    resume_text: str,
    job_description: str,
    chat_history: List[Dict[str, str]],
    user_message: Optional[str] = None,
    custom_instructions: str = ""
) -> InterviewResponse:
    """
    Main interview chat function - handles questions and feedback.
    """
    try:
        # If user is answering a question
        if user_message and len(chat_history) > 0:
            last_question = chat_history[-1].get('question', '')
            
            if last_question:
                # Evaluate the answer
                feedback = await evaluate_answer(
                    question=last_question,
                    user_answer=user_message,
                    job_description=job_description,
                    resume_text=resume_text
                )
                
                # Generate next question
                next_question = await generate_interview_question(
                    resume_text=resume_text,
                    job_description=job_description,
                    chat_history=chat_history,
                    custom_instructions=custom_instructions
                )
                
                feedback_message = f"""Great! Here's your feedback:

**Score: {feedback.score}/10**

**Strengths:**
{chr(10).join('• ' + s for s in feedback.strengths)}

**Areas to Improve:**
{chr(10).join('• ' + i for i in feedback.improvements)}

**Suggested Answer:**
{feedback.suggested_answer}

Ready for the next question?"""
                
                return InterviewResponse(
                    ai_message=feedback_message,
                    feedback=feedback,
                    next_question=next_question
                )
        
        # If starting interview or requesting new question
        question = await generate_interview_question(
            resume_text=resume_text,
            job_description=job_description,
            chat_history=chat_history,
            custom_instructions=custom_instructions
        )
        
        return InterviewResponse(
            ai_message=question,
            feedback=None,
            next_question=question
        )
    
    except Exception as e:
        logger.error(f"Interview chat error: {str(e)}")
        raise Exception(f"Interview chat failed: {str(e)}")