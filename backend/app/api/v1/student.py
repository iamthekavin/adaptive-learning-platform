from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_active_user, require_student
from app.models.user import User, UserRole
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
