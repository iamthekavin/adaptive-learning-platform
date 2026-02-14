from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, Dict, List
from app.models.quiz import QuizStatus, QuestionType


# Assessment Schemas
class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    program_id: int
    semester_id: int
    duration_minutes: int = 60
    is_active: bool = True


class AssessmentCreate(AssessmentBase):
    pass


class AssessmentResponse(AssessmentBase):
    id: int
    teacher_id: int
    total_marks: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Question Schemas
class QuestionBase(BaseModel):
    question_text: str
    question_type: QuestionType = QuestionType.MCQ
    marks: float = 1.0
    negative_marks: Optional[float] = 0.0
    options: Dict[str, str]  # {"A": "option1", "B": "option2", ...}
    correct_answer: str  # "A", "B", "C", or "D"
    explanation: Optional[str] = None


class QuestionCreate(QuestionBase):
    pass


class QuestionResponse(QuestionBase):
    id: int
    assessment_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Assessment with questions (defined after QuestionResponse)
class AssessmentWithQuestions(AssessmentResponse):
    questions: List[QuestionResponse]


class QuestionForStudent(BaseModel):
    """Question schema for students (without correct answer)."""
    id: int
    question_text: str
    question_type: QuestionType
    marks: float
    options: Dict[str, str]

    model_config = ConfigDict(from_attributes=True)


# Quiz Session Schemas
class QuizSessionResponse(BaseModel):
    id: int
    assessment_id: int
    student_id: int
    started_at: datetime
    submitted_at: Optional[datetime]
    status: QuizStatus
    score: Optional[float]
    max_score: Optional[float]

    model_config = ConfigDict(from_attributes=True)


class QuizStartResponse(BaseModel):
    session_id: int
    assessment_title: str
    duration_minutes: int
    total_questions: int
    questions: List[QuestionForStudent]


# Answer Schemas
class AnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str = Field(..., pattern="^[A-D]$")


class AnswerResponse(BaseModel):
    question_id: int
    selected_answer: Optional[str]
    is_saved: bool


# Quiz Result Schemas
class QuestionResult(BaseModel):
    question_id: int
    question_text: str
    options: Dict[str, str]
    selected_answer: Optional[str]
    correct_answer: str
    is_correct: Optional[bool]
    marks_awarded: Optional[float]
    explanation: Optional[str]


class QuizResultResponse(BaseModel):
    session_id: int
    assessment_title: str
    status: QuizStatus
    score: Optional[float]
    max_score: Optional[float]
    total_questions: int
    correct_answers: int
    submitted_at: Optional[datetime]
    questions: List[QuestionResult]


# Available Assessment Schema
class AvailableAssessment(BaseModel):
    id: int
    title: str
    description: Optional[str]
    semester_name: str
    duration_minutes: int
    total_marks: float
    total_questions: int
    teacher_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Rebuild models to resolve forward references
AssessmentWithQuestions.model_rebuild()
QuizStartResponse.model_rebuild()
QuizResultResponse.model_rebuild()
