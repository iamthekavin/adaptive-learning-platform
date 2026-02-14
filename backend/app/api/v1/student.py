from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import random
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.quiz import (
    Assessment,
    Question,
    QuizSession,
    StudentAnswer,
    QuizStatus,
)
from app.models.academic import (
    StudentEnrollment,
    Batch,
    Program,
    Regulation,
    Semester,
    SemesterCourseMap,
    Course,
)
from app.schemas.academic import (
    StudentSyllabusResponse,
    SemesterWithCourses,
    SemesterResponse,
    CourseInSyllabus,
)
from app.schemas.quiz import (
    QuizStartResponse,
    QuestionForStudent,
    AnswerSubmit,
    AnswerResponse,
    QuizResultResponse,
    QuestionResult,
    AvailableAssessment,
)

router = APIRouter()


@router.get("/syllabus", response_model=StudentSyllabusResponse)
def get_student_syllabus(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get syllabus for the current student.
    Returns semester-wise course mappings based on student's batch and regulation.
    """
    # Verify user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to students"
        )
    
    # Get student enrollment
    enrollment = db.query(StudentEnrollment).filter(
        StudentEnrollment.student_id == current_user.id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student enrollment not found. Please contact administration."
        )
    
    # Get batch with related data
    batch = db.query(Batch).filter(Batch.id == enrollment.batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch information not found"
        )
    
    # Get program
    program = db.query(Program).filter(Program.id == batch.program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program information not found"
        )
    
    # Get regulation
    regulation = db.query(Regulation).filter(Regulation.id == batch.regulation_id).first()
    if not regulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regulation information not found"
        )
    
    # Get all semesters with their courses
    semesters = db.query(Semester).order_by(Semester.semester_number).all()
    
    semesters_with_courses = []
    for semester in semesters:
        # Get courses for this semester
        course_maps = db.query(SemesterCourseMap).filter(
            SemesterCourseMap.semester_id == semester.id
        ).all()
        
        courses = []
        for course_map in course_maps:
            course = db.query(Course).filter(Course.id == course_map.course_id).first()
            if course:
                courses.append(CourseInSyllabus(
                    id=course.id,
                    name=course.name,
                    code=course.code,
                    credits=course.credits,
                    description=course.description
                ))
        
        # Only include semesters that have courses
        if courses:
            semesters_with_courses.append(SemesterWithCourses(
                semester=SemesterResponse(
                    id=semester.id,
                    name=semester.name,
                    semester_number=semester.semester_number
                ),
                courses=courses
            ))
    
    return StudentSyllabusResponse(
        student_name=current_user.name,
        enrollment_number=enrollment.enrollment_number,
        batch_name=batch.name,
        program_name=program.name,
        regulation_name=regulation.name,
        semesters=semesters_with_courses
    )


@router.get("/assessments/available")
def get_available_assessments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all available assessments for the current student based on their enrollment.
    """
    # Verify user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to students"
        )
    
    # Get student enrollment
    enrollment = db.query(StudentEnrollment).filter(
        StudentEnrollment.student_id == current_user.id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student enrollment not found"
        )
    
    # Get batch
    batch = db.query(Batch).filter(Batch.id == enrollment.batch_id).first()
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    
    # Get active assessments for student's program
    assessments = db.query(Assessment).filter(
        Assessment.program_id == batch.program_id,
        Assessment.is_active == True
    ).all()
    
    result = []
    for assessment in assessments:
        # Get semester info
        semester = db.query(Semester).filter(Semester.id == assessment.semester_id).first()
        
        # Get teacher info
        teacher = db.query(User).filter(User.id == assessment.teacher_id).first()
        
        # Count questions
        question_count = db.query(func.count(Question.id)).filter(
            Question.assessment_id == assessment.id
        ).scalar()
        
        result.append(AvailableAssessment(
            id=assessment.id,
            title=assessment.title,
            description=assessment.description,
            semester_name=semester.name if semester else "Unknown",
            duration_minutes=assessment.duration_minutes,
            total_marks=assessment.total_marks,
            total_questions=question_count,
            teacher_name=teacher.name if teacher else "Unknown",
            created_at=assessment.created_at
        ))
    
    return result


@router.post("/quiz/start/{assessment_id}", response_model=QuizStartResponse)
def start_quiz(
    assessment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Start a new quiz session for the student.
    Validates enrollment and creates a session with randomized questions.
    """
    # Verify user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can start quizzes"
        )
    
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    if not assessment.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assessment is not active"
        )
    
    # Verify student enrollment matches assessment program
    enrollment = db.query(StudentEnrollment).filter(
        StudentEnrollment.student_id == current_user.id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student enrollment not found"
        )
    
    batch = db.query(Batch).filter(Batch.id == enrollment.batch_id).first()
    if not batch or batch.program_id != assessment.program_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in the program for this assessment"
        )
    
    # Check if student already has an active session for this assessment
    existing_session = db.query(QuizSession).filter(
        QuizSession.assessment_id == assessment_id,
        QuizSession.student_id == current_user.id,
        QuizSession.status == QuizStatus.IN_PROGRESS
    ).first()
    
    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active session for this assessment"
        )
    
    # Get all questions for this assessment
    questions = db.query(Question).filter(Question.assessment_id == assessment_id).all()
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assessment has no questions"
        )
    
    # Randomize question order
    question_ids = [q.id for q in questions]
    random.shuffle(question_ids)
    
    # Create quiz session
    session = QuizSession(
        assessment_id=assessment_id,
        student_id=current_user.id,
        status=QuizStatus.IN_PROGRESS,
        max_score=assessment.total_marks,
        question_order=question_ids
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Return questions in randomized order (without correct answers)
    randomized_questions = []
    for qid in question_ids:
        question = next(q for q in questions if q.id == qid)
        randomized_questions.append(QuestionForStudent(
            id=question.id,
            question_text=question.question_text,
            question_type=question.question_type,
            marks=question.marks,
            options=question.options
        ))
    
    return QuizStartResponse(
        session_id=session.id,
        assessment_title=assessment.title,
        duration_minutes=assessment.duration_minutes,
        total_questions=len(questions),
        questions=randomized_questions
    )


@router.post("/quiz/{session_id}/answer", response_model=AnswerResponse)
def submit_answer(
    session_id: int,
    answer_data: AnswerSubmit,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submit an answer for a question in an active quiz session.
    """
    # Verify user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit answers"
        )
    
    # Get session
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    # Verify session belongs to current user
    if session.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This session does not belong to you"
        )
    
    # Verify session is still in progress
    if session.status != QuizStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz session has already been submitted"
        )
    
    # Verify question belongs to this assessment
    question = db.query(Question).filter(
        Question.id == answer_data.question_id,
        Question.assessment_id == session.assessment_id
    ).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found in this assessment"
        )
    
    # Check if answer already exists for this question
    existing_answer = db.query(StudentAnswer).filter(
        StudentAnswer.session_id == session_id,
        StudentAnswer.question_id == answer_data.question_id
    ).first()
    
    if existing_answer:
        # Update existing answer
        existing_answer.selected_answer = answer_data.selected_answer
        existing_answer.answered_at = datetime.utcnow()
    else:
        # Create new answer
        new_answer = StudentAnswer(
            session_id=session_id,
            question_id=answer_data.question_id,
            selected_answer=answer_data.selected_answer
        )
        db.add(new_answer)
    
    db.commit()
    
    return AnswerResponse(
        question_id=answer_data.question_id,
        selected_answer=answer_data.selected_answer,
        is_saved=True
    )


@router.post("/quiz/{session_id}/submit", response_model=QuizResultResponse)
def submit_quiz(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submit the quiz and calculate the score.
    """
    # Verify user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit quizzes"
        )
    
    # Get session
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    # Verify session belongs to current user
    if session.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This session does not belong to you"
        )
    
    # Verify session is still in progress
    if session.status != QuizStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This quiz has already been submitted"
        )
    
    # Get all questions for this assessment
    questions = db.query(Question).filter(
        Question.assessment_id == session.assessment_id
    ).all()
    
    # Get all student answers
    answers = db.query(StudentAnswer).filter(
        StudentAnswer.session_id == session_id
    ).all()
    
    # Create answer lookup
    answer_lookup = {ans.question_id: ans for ans in answers}
    
    # Calculate score
    total_score = 0.0
    correct_count = 0
    
    for question in questions:
        answer = answer_lookup.get(question.id)
        
        if answer:
            # Check if answer is correct
            is_correct = answer.selected_answer == question.correct_answer
            answer.is_correct = is_correct
            
            if is_correct:
                answer.marks_awarded = question.marks
                total_score += question.marks
                correct_count += 1
            else:
                # Apply negative marking if configured
                if question.negative_marks:
                    answer.marks_awarded = -question.negative_marks
                    total_score -= question.negative_marks
                else:
                    answer.marks_awarded = 0.0
        else:
            # Question not answered - create empty answer record
            empty_answer = StudentAnswer(
                session_id=session_id,
                question_id=question.id,
                selected_answer=None,
                is_correct=False,
                marks_awarded=0.0
            )
            db.add(empty_answer)
    
    # Update session
    session.status = QuizStatus.SUBMITTED
    session.submitted_at = datetime.utcnow()
    session.score = total_score
    
    db.commit()
    
    # Return result
    return get_quiz_result(session_id, current_user, db)


@router.get("/quiz/{session_id}/result", response_model=QuizResultResponse)
def get_quiz_result(
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get quiz result for a submitted session.
    """
    # Verify user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view quiz results"
        )
    
    # Get session
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz session not found"
        )
    
    # Verify session belongs to current user
    if session.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This session does not belong to you"
        )
    
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == session.assessment_id).first()
    
    # Get all questions and answers
    questions = db.query(Question).filter(
        Question.assessment_id == session.assessment_id
    ).all()
    
    answers = db.query(StudentAnswer).filter(
        StudentAnswer.session_id == session_id
    ).all()
    
    # Create answer lookup
    answer_lookup = {ans.question_id: ans for ans in answers}
    
    # Build question results
    question_results = []
    correct_count = 0
    
    for question in questions:
        answer = answer_lookup.get(question.id)
        
        if answer and answer.is_correct:
            correct_count += 1
        
        question_results.append(QuestionResult(
            question_id=question.id,
            question_text=question.question_text,
            options=question.options,
            selected_answer=answer.selected_answer if answer else None,
            correct_answer=question.correct_answer,
            is_correct=answer.is_correct if answer else False,
            marks_awarded=answer.marks_awarded if answer else 0.0,
            explanation=question.explanation
        ))
    
    return QuizResultResponse(
        session_id=session.id,
        assessment_title=assessment.title,
        status=session.status,
        score=session.score,
        max_score=session.max_score,
        total_questions=len(questions),
        correct_answers=correct_count,
        submitted_at=session.submitted_at,
        questions=question_results
    )
