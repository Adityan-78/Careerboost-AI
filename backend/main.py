import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import logging
from typing import Optional, List, Dict
from agent import analyze_resume
from interview_agent import interview_chat
from utils import parse_file

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CareerBoost AI",
    description="Resume and Job Application Optimization System with Interview Practice",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
MAX_TEXT_SIZE = 50000  # Maximum characters for resume/JD

# In-memory session storage (for interview chat history)
# In production, use Redis or database
interview_sessions: Dict[str, Dict] = {}


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CareerBoost AI",
        "version": "1.0.0"
    }


@app.post("/analyze")
async def analyze_endpoint(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description_file: Optional[UploadFile] = File(None),
    job_description_text: Optional[str] = Form(None),
    rewrite_all_bullets: bool = Form(False)
):
    """
    Analyze resume against job description and optimize.
    
    Args:
        resume_file: PDF/DOCX resume file (optional)
        resume_text: Plain text resume (optional)
        job_description_file: PDF/DOCX job description file (optional)
        job_description_text: Plain text job description (optional)
        rewrite_all_bullets: Whether to rewrite all bullets or only relevant ones
    
    Returns:
        Structured optimization results
    """
    try:
        # Validation: Ensure at least one resume input is provided
        if not resume_file and not resume_text:
            raise HTTPException(
                status_code=400,
                detail="Please provide either a resume file or resume text"
            )
        
        # Validation: Ensure at least one job description input is provided
        if not job_description_file and not job_description_text:
            raise HTTPException(
                status_code=400,
                detail="Please provide either a job description file or job description text"
            )
        
        # Extract resume text
        final_resume_text = ""
        
        if resume_file:
            # Validate file type
            allowed_extensions = [".pdf", ".docx", ".doc"]
            file_ext = os.path.splitext(resume_file.filename)[1].lower()
            
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid resume file type. Allowed types: {', '.join(allowed_extensions)}"
                )
            
            # Read file content
            file_content = await resume_file.read()
            
            # Parse file
            try:
                final_resume_text = parse_file(file_content, file_ext)
            except Exception as e:
                logger.error(f"Resume file parsing error: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to parse resume file: {str(e)}"
                )
        else:
            final_resume_text = resume_text
        
        # Extract job description text
        final_job_description = ""
        
        if job_description_file:
            # Validate file type
            allowed_extensions = [".pdf", ".docx", ".doc"]
            file_ext = os.path.splitext(job_description_file.filename)[1].lower()
            
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid job description file type. Allowed types: {', '.join(allowed_extensions)}"
                )
            
            # Read file content
            file_content = await job_description_file.read()
            
            # Parse file
            try:
                final_job_description = parse_file(file_content, file_ext)
            except Exception as e:
                logger.error(f"Job description file parsing error: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to parse job description file: {str(e)}"
                )
        else:
            final_job_description = job_description_text
        
        # Sanitize and validate text size
        final_resume_text = final_resume_text.strip()
        final_job_description = final_job_description.strip()
        
        if len(final_resume_text) == 0:
            raise HTTPException(
                status_code=400,
                detail="Resume text is empty after parsing"
            )
        
        if len(final_job_description) == 0:
            raise HTTPException(
                status_code=400,
                detail="Job description text is empty after parsing"
            )
        
        if len(final_resume_text) > MAX_TEXT_SIZE:
            logger.warning(f"Resume text too large ({len(final_resume_text)} chars), trimming to {MAX_TEXT_SIZE}")
            final_resume_text = final_resume_text[:MAX_TEXT_SIZE]
        
        if len(final_job_description) > MAX_TEXT_SIZE:
            logger.warning(f"Job description too large ({len(final_job_description)} chars), trimming to {MAX_TEXT_SIZE}")
            final_job_description = final_job_description[:MAX_TEXT_SIZE]
        
        # Call the agent - optimized with minimal retries for faster response
        max_retries = 2  # Reduced from 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Analyzing resume (attempt {attempt + 1}/{max_retries})")
                result = await analyze_resume(
                    resume_text=final_resume_text,
                    job_description=final_job_description,
                    rewrite_all_bullets=rewrite_all_bullets
                )
                
                # Return successful result
                return JSONResponse(
                    status_code=200,
                    content=result
                )
            
            except Exception as e:
                last_error = e
                logger.error(f"Agent error (attempt {attempt + 1}/{max_retries}): {str(e)}")
                
                # Only retry on timeout or connection errors, not JSON errors
                if attempt < max_retries - 1 and ("timeout" in str(e).lower() or "connection" in str(e).lower()):
                    continue
                else:
                    break
        
        # Failed
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze resume: {str(last_error)}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Detailed health check"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    return {
        "status": "healthy",
        "api_key_configured": bool(api_key),
        "max_text_size": MAX_TEXT_SIZE,
        "active_sessions": len(interview_sessions)
    }


@app.post("/interview/start")
async def start_interview(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_description_file: Optional[UploadFile] = File(None),
    job_description_text: Optional[str] = Form(None),
    custom_instructions: str = Form(""),
    session_id: str = Form(...)
):
    """
    Start a new interview session.
    
    Args:
        resume_file: PDF/DOCX resume file (optional)
        resume_text: Plain text resume (optional)
        job_description_file: PDF/DOCX job description file (optional)
        job_description_text: Plain text job description (optional)
        custom_instructions: User's custom instructions for the interview
        session_id: Unique session identifier from frontend
    
    Returns:
        First interview question
    """
    try:
        # Validation: Ensure at least one resume input
        if not resume_file and not resume_text:
            raise HTTPException(
                status_code=400,
                detail="Please provide either a resume file or resume text"
            )
        
        # Validation: Ensure at least one job description input
        if not job_description_file and not job_description_text:
            raise HTTPException(
                status_code=400,
                detail="Please provide either a job description file or job description text"
            )
        
        # Extract resume text
        final_resume_text = ""
        
        if resume_file:
            allowed_extensions = [".pdf", ".docx", ".doc"]
            file_ext = os.path.splitext(resume_file.filename)[1].lower()
            
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid resume file type. Allowed types: {', '.join(allowed_extensions)}"
                )
            
            file_content = await resume_file.read()
            
            try:
                final_resume_text = parse_file(file_content, file_ext)
            except Exception as e:
                logger.error(f"Resume file parsing error: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to parse resume file: {str(e)}"
                )
        else:
            final_resume_text = resume_text
        
        # Extract job description text
        final_job_description = ""
        
        if job_description_file:
            allowed_extensions = [".pdf", ".docx", ".doc"]
            file_ext = os.path.splitext(job_description_file.filename)[1].lower()
            
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid job description file type. Allowed types: {', '.join(allowed_extensions)}"
                )
            
            file_content = await job_description_file.read()
            
            try:
                final_job_description = parse_file(file_content, file_ext)
            except Exception as e:
                logger.error(f"Job description file parsing error: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to parse job description file: {str(e)}"
                )
        else:
            final_job_description = job_description_text
        
        # Sanitize and validate
        final_resume_text = final_resume_text.strip()
        final_job_description = final_job_description.strip()
        
        if len(final_resume_text) == 0:
            raise HTTPException(
                status_code=400,
                detail="Resume text is empty after parsing"
            )
        
        if len(final_job_description) == 0:
            raise HTTPException(
                status_code=400,
                detail="Job description text is empty after parsing"
            )
        
        if len(final_resume_text) > MAX_TEXT_SIZE:
            final_resume_text = final_resume_text[:MAX_TEXT_SIZE]
        
        if len(final_job_description) > MAX_TEXT_SIZE:
            final_job_description = final_job_description[:MAX_TEXT_SIZE]
        
        # Initialize or reset session
        interview_sessions[session_id] = {
            "resume_text": final_resume_text,
            "job_description": final_job_description,
            "custom_instructions": custom_instructions,
            "chat_history": []
        }
        
        # Generate first question
        response = await interview_chat(
            resume_text=final_resume_text,
            job_description=final_job_description,
            chat_history=[],
            user_message=None,
            custom_instructions=custom_instructions
        )
        
        # Store first question in history
        interview_sessions[session_id]["chat_history"].append({
            "question": response.next_question
        })
        
        return JSONResponse(
            status_code=200,
            content={
                "message": response.ai_message,
                "question": response.next_question,
                "session_id": session_id
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start interview: {str(e)}"
        )


@app.post("/interview/chat")
async def interview_chat_endpoint(
    session_id: str = Form(...),
    user_answer: str = Form(...),
    custom_instructions: str = Form("")
):
    """
    Continue interview conversation - user answers question, gets feedback and next question.
    
    Args:
        session_id: Session identifier
        user_answer: User's answer to the current question
        custom_instructions: Updated custom instructions (optional)
    
    Returns:
        Feedback on answer and next question (automatically provided)
    """
    try:
        # Validate session exists
        if session_id not in interview_sessions:
            raise HTTPException(
                status_code=404,
                detail="Session not found. Please start a new interview."
            )
        
        session = interview_sessions[session_id]
        
        # Update custom instructions if provided
        if custom_instructions:
            session["custom_instructions"] = custom_instructions
        
        # Add user's answer to history
        if len(session["chat_history"]) > 0:
            session["chat_history"][-1]["answer"] = user_answer
        
        # Get feedback and next question
        response = await interview_chat(
            resume_text=session["resume_text"],
            job_description=session["job_description"],
            chat_history=session["chat_history"],
            user_message=user_answer,
            custom_instructions=session["custom_instructions"]
        )
        
        # Store next question
        if response.next_question:
            session["chat_history"].append({
                "question": response.next_question
            })
        
        # Build response with feedback AND next question
        result = {
            "message": response.ai_message,
            "next_question": response.next_question  # Automatically included
        }
        
        # Add feedback if present
        if response.feedback:
            result["feedback"] = {
                "score": response.feedback.score,
                "strengths": response.feedback.strengths,
                "improvements": response.feedback.improvements,
                "suggested_answer": response.feedback.suggested_answer
            }
        
        return JSONResponse(status_code=200, content=result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in interview chat: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process interview chat: {str(e)}"
        )


@app.get("/interview/history/{session_id}")
async def get_interview_history(session_id: str):
    """
    Get full interview chat history for a session.
    
    Args:
        session_id: Session identifier
    
    Returns:
        Complete chat history
    """
    if session_id not in interview_sessions:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )
    
    return JSONResponse(
        status_code=200,
        content={
            "session_id": session_id,
            "chat_history": interview_sessions[session_id]["chat_history"]
        }
    )


@app.delete("/interview/session/{session_id}")
async def clear_interview_session(session_id: str):
    """
    Clear/reset interview session.
    
    Args:
        session_id: Session identifier
    
    Returns:
        Success message
    """
    if session_id in interview_sessions:
        del interview_sessions[session_id]
    
    return JSONResponse(
        status_code=200,
        content={"message": "Session cleared successfully"}
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)