from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.quiz import Assessment, Question
from app.models.academic import Program, Semester
from app.schemas.quiz import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentWithQuestions,
    QuestionCreate,
    QuestionResponse,
)

router = APIRouter()


@router.post("/assessments", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new assessment (teacher only).
    """
    # Verify user is a teacher
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create assessments"
        )
    
    # Verify program exists
    program = db.query(Program).filter(Program.id == assessment_data.program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with id {assessment_data.program_id} not found"
        )
    
    # Verify semester exists
    semester = db.query(Semester).filter(Semester.id == assessment_data.semester_id).first()
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Semester with id {assessment_data.semester_id} not found"
        )
    
    # Create assessment
    new_assessment = Assessment(
        **assessment_data.model_dump(),
        teacher_id=current_user.id,
        total_marks=0.0  # Will be updated when questions are added
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    return new_assessment


@router.post("/assessments/{assessment_id}/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def add_question(
    assessment_id: int,
    question_data: QuestionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add a question to an assessment (teacher only, must be owner).
    """
    # Verify user is a teacher
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can add questions"
        )
    
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with id {assessment_id} not found"
        )
    
    # Verify teacher owns this assessment
    if assessment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only add questions to your own assessments"
        )
    
    # Validate options format
    if not isinstance(question_data.options, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Options must be a dictionary"
        )
    
    # Validate correct answer is in options
    if question_data.correct_answer not in question_data.options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Correct answer '{question_data.correct_answer}' must be one of the option keys"
        )
    
    # Create question
    new_question = Question(
        **question_data.model_dump(),
        assessment_id=assessment_id
    )
    db.add(new_question)
    
    # Update assessment total marks
    assessment.total_marks += question_data.marks
    
    db.commit()
    db.refresh(new_question)
    
    return new_question


@router.get("/assessments/{assessment_id}", response_model=AssessmentWithQuestions)
def get_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get assessment details with questions (teacher only, must be owner).
    """
    # Verify user is a teacher
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view assessment details"
        )
    
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with id {assessment_id} not found"
        )
    
    # Verify teacher owns this assessment
    if assessment.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own assessments"
        )
    
    return assessment
