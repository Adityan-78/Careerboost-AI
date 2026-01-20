from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


class InterviewQuestion(BaseModel):
    """Schema for a single interview question"""
    
    question: str = Field(
        ...,
        min_length=10,
        description="Interview question text"
    )
    
    category: str = Field(
        ...,
        description="Question category (e.g., Technical, Behavioral, Experience-Based)"
    )
    
    suggested_answer_approach: str = Field(
        ...,
        min_length=20,
        description="Suggested approach or tips for answering this question"
    )


class ResumeAnalysisResult(BaseModel):
    """Schema for resume analysis results returned by the AI agent"""
    
    skill_match_percentage: float = Field(
        ...,
        ge=0,
        le=100,
        description="Percentage of job required skills matched by resume (0-100)"
    )
    
    matched_skills: List[str] = Field(
        ...,
        description="List of skills that appear in both resume and job description"
    )
    
    missing_skills: List[str] = Field(
        ...,
        description="List of required skills from job description missing in resume"
    )
    
    optimized_resume_bullets: List[str] = Field(
        ...,
        description="Rewritten resume bullets optimized for the job description"
    )
    
    cover_letter: str = Field(
        ...,
        min_length=50,
        description="Personalized professional cover letter for the job application"
    )
    
    interview_prep: List[InterviewQuestion] = Field(
        ...,
        min_items=5,
        max_items=10,
        description="Interview preparation questions based on the job description"
    )
    
    @field_validator('skill_match_percentage')
    @classmethod
    def validate_percentage(cls, v: float) -> float:
        """Ensure percentage is within valid range"""
        if not 0 <= v <= 100:
            raise ValueError("Skill match percentage must be between 0 and 100")
        return round(v, 1)
    
    @field_validator('matched_skills', 'missing_skills', 'optimized_resume_bullets')
    @classmethod
    def validate_lists_not_empty(cls, v: List[str]) -> List[str]:
        """Ensure lists contain valid strings"""
        if not isinstance(v, list):
            raise ValueError("Must be a list")
        return [str(item).strip() for item in v if str(item).strip()]
    
    @field_validator('cover_letter')
    @classmethod
    def validate_cover_letter(cls, v: str) -> str:
        """Ensure cover letter is substantial"""
        v = v.strip()
        if len(v) < 50:
            raise ValueError("Cover letter must be at least 50 characters")
        return v
    
    @field_validator('interview_prep')
    @classmethod
    def validate_interview_questions(cls, v: List[InterviewQuestion]) -> List[InterviewQuestion]:
        """Ensure interview questions list is valid"""
        if not isinstance(v, list):
            raise ValueError("Must be a list")
        if len(v) < 5:
            raise ValueError("Must have at least 5 interview questions")
        if len(v) > 10:
            raise ValueError("Cannot have more than 10 interview questions")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "skill_match_percentage": 75.0,
                "matched_skills": ["Python", "FastAPI", "REST APIs", "SQL"],
                "missing_skills": ["Docker", "Kubernetes", "AWS"],
                "optimized_resume_bullets": [
                    "Built scalable REST APIs using Python and FastAPI, serving over 10,000 daily requests",
                    "Designed and optimized SQL databases, improving query performance by 40%"
                ],
                "cover_letter": "Dear Hiring Manager,\n\nI am excited to apply for the Backend Developer position...",
                "interview_prep": [
                    {
                        "question": "Can you explain your experience building REST APIs with FastAPI?",
                        "category": "Technical",
                        "suggested_answer_approach": "Use the STAR method: describe a specific project, the technical challenges you faced, your solution using FastAPI's features, and the measurable results."
                    }
                ]
            }
        }