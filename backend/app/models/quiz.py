from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class QuizStatus(str, enum.Enum):
    """Quiz session status enumeration."""
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"


class QuestionType(str, enum.Enum):
    """Question type enumeration."""
    MCQ = "MCQ"


class Assessment(Base):
    """Assessment/Quiz model."""
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)
    total_marks = Column(Float, nullable=False, default=0.0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    program = relationship("Program", foreign_keys=[program_id])
    semester = relationship("Semester", foreign_keys=[semester_id])
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    sessions = relationship("QuizSession", back_populates="assessment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Assessment(id={self.id}, title={self.title})>"


class Question(Base):
    """Question model for assessments."""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False, default=QuestionType.MCQ)
    marks = Column(Float, nullable=False, default=1.0)
    negative_marks = Column(Float, nullable=True, default=0.0)
    options = Column(JSON, nullable=False)  # {"A": "option1", "B": "option2", ...}
    correct_answer = Column(String(10), nullable=False)  # "A", "B", "C", or "D"
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    assessment = relationship("Assessment", back_populates="questions")
    student_answers = relationship("StudentAnswer", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question(id={self.id}, assessment_id={self.assessment_id})>"


class QuizSession(Base):
    """Quiz session model for student attempts."""
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(QuizStatus), nullable=False, default=QuizStatus.IN_PROGRESS)
    score = Column(Float, nullable=True)
    max_score = Column(Float, nullable=True)
    question_order = Column(JSON, nullable=True)  # Randomized question IDs

    # Relationships
    assessment = relationship("Assessment", back_populates="sessions")
    student = relationship("User", foreign_keys=[student_id])
    answers = relationship("StudentAnswer", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<QuizSession(id={self.id}, student_id={self.student_id}, status={self.status})>"


class StudentAnswer(Base):
    """Student answer model for quiz sessions."""
    __tablename__ = "student_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("quiz_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer = Column(String(10), nullable=True)  # "A", "B", "C", "D", or null
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Float, nullable=True)
    answered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    session = relationship("QuizSession", back_populates="answers")
    question = relationship("Question", back_populates="student_answers")

    def __repr__(self):
        return f"<StudentAnswer(id={self.id}, session_id={self.session_id}, question_id={self.question_id})>"
