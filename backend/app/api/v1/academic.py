from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.academic import (
    Regulation,
    Program,
    Batch,
    Course,
    SemesterCourseMap,
)
from app.schemas.academic import (
    RegulationCreate,
    RegulationResponse,
    ProgramCreate,
    ProgramResponse,
    BatchCreate,
    BatchResponse,
    CourseCreate,
    CourseResponse,
    SemesterCourseMapCreate,
    SemesterCourseMapResponse,
)

router = APIRouter()


@router.post("/regulations", response_model=RegulationResponse, status_code=status.HTTP_201_CREATED)
def create_regulation(
    regulation_data: RegulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new regulation (admin only).
    """
    # Check if regulation code already exists
    existing = db.query(Regulation).filter(Regulation.code == regulation_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Regulation with code '{regulation_data.code}' already exists"
        )
    
    new_regulation = Regulation(**regulation_data.model_dump())
    db.add(new_regulation)
    db.commit()
    db.refresh(new_regulation)
    
    return new_regulation


@router.post("/programs", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
def create_program(
    program_data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new program (admin only).
    """
    # Verify department exists
    from app.models.academic import Department
    department = db.query(Department).filter(Department.id == program_data.department_id).first()
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department with id {program_data.department_id} not found"
        )
    
    new_program = Program(**program_data.model_dump())
    db.add(new_program)
    db.commit()
    db.refresh(new_program)
    
    return new_program


@router.post("/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    batch_data: BatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new batch (admin only).
    Links batch to program and regulation.
    """
    # Verify program exists
    program = db.query(Program).filter(Program.id == batch_data.program_id).first()
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program with id {batch_data.program_id} not found"
        )
    
    # Verify regulation exists
    regulation = db.query(Regulation).filter(Regulation.id == batch_data.regulation_id).first()
    if not regulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Regulation with id {batch_data.regulation_id} not found"
        )
    
    new_batch = Batch(**batch_data.model_dump())
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    
    return new_batch


@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new course (admin only).
    """
    # Check if course code already exists
    existing = db.query(Course).filter(Course.code == course_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Course with code '{course_data.code}' already exists"
        )
    
    new_course = Course(**course_data.model_dump())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return new_course


@router.post("/semester-course-map", response_model=SemesterCourseMapResponse, status_code=status.HTTP_201_CREATED)
def create_semester_course_map(
    map_data: SemesterCourseMapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Map a course to a semester (admin only).
    """
    # Verify semester exists
    from app.models.academic import Semester
    semester = db.query(Semester).filter(Semester.id == map_data.semester_id).first()
    if not semester:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Semester with id {map_data.semester_id} not found"
        )
    
    # Verify course exists
    course = db.query(Course).filter(Course.id == map_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {map_data.course_id} not found"
        )
    
    # Check if mapping already exists
    existing = db.query(SemesterCourseMap).filter(
        SemesterCourseMap.semester_id == map_data.semester_id,
        SemesterCourseMap.course_id == map_data.course_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This course is already mapped to this semester"
        )
    
    new_map = SemesterCourseMap(**map_data.model_dump())
    db.add(new_map)
    db.commit()
    db.refresh(new_map)
    
    return new_map
