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
MODEL_NAME = "mistralai/devstral-2-2512:free"


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
    Generate next interview question based on context.
    
    Args:
        resume_text: Candidate's resume
        job_description: Job description
        chat_history: Previous Q&A history
        custom_instructions: User's custom instructions
    
    Returns:
        Next interview question
    """
    try:
        # Build context from history
        history_context = "\n".join([
            f"Q: {msg['question']}\nA: {msg['answer']}" 
            for msg in chat_history if 'question' in msg and 'answer' in msg
        ])
        
        system_prompt = """You are an expert technical interviewer. Generate one relevant, concise interview question.
Ask specific questions based on job requirements and candidate background."""
        
        user_prompt = f"""Generate ONE interview question for this role.

JOB: {job_description[:1500]}

RESUME: {resume_text[:1500]}

PREVIOUS: {history_context if history_context else "First question"}

CUSTOM: {custom_instructions if custom_instructions else "None"}

Return ONLY the question text."""
        
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
            "max_tokens": 200  # Optimized for fast Devstral question generation
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                raise Exception(f"API error: {response.text}")
            
            data = response.json()
            question = data["choices"][0]["message"]["content"].strip()
            
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
    Evaluate user's interview answer and provide feedback.
    
    Args:
        question: The interview question asked
        user_answer: User's answer
        job_description: Job description for context
        resume_text: Resume for context
    
    Returns:
        Detailed feedback with score and improvements
    """
    try:
        system_prompt = """You are an interview coach. Evaluate answers and provide concise, constructive feedback.
Score 1-10 based on relevance, clarity, and skill demonstration."""
        
        user_prompt = f"""Evaluate this answer. Return ONLY valid JSON.

Q: {question}

A: {user_answer}

JOB: {job_description[:800]}

RESUME: {resume_text[:800]}

Return this JSON (no markdown):
{{
  "score": <1-10>,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "suggested_answer": "Better answer..."
}}"""
        
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
            "temperature": 0.6,
            "max_tokens": 600  # Optimized for fast Devstral feedback
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
            
            if response.status_code != 200:
                raise Exception(f"API error: {response.text}")
            
            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            
            # Clean markdown if present
            content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            
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
    Main interview chat function - handles both questions and feedback.
    
    Args:
        resume_text: Candidate's resume
        job_description: Job description
        chat_history: List of previous messages
        user_message: User's answer (if answering) or None (if requesting question)
        custom_instructions: User's custom instructions
    
    Returns:
        InterviewResponse with AI message, optional feedback, and next question
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
                
                feedback_message = f"""Great! Let me provide feedback on your answer.

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