"""
Seed script to populate the database with initial data.
Run with: python -m app.seed.seed_data
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.academic import (
    University,
    Institution,
    Department,
    Program,
    Regulation,
    Batch,
    Semester,
    Course,
    SemesterCourseMap,
    TeacherCourseAllocation,
    StudentEnrollment,
)


def create_users(db: Session):
    """Create initial users."""
    print("Creating users...")
    
    # Admin user
    admin = User(
        name="Admin User",
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)
    
    # Teachers
    teacher1 = User(
        name="Dr. John Smith",
        email="john.smith@example.com",
        hashed_password=get_password_hash("teacher123"),
        role=UserRole.TEACHER,
        is_active=True
    )
    teacher2 = User(
        name="Dr. Sarah Johnson",
        email="sarah.johnson@example.com",
        hashed_password=get_password_hash("teacher123"),
        role=UserRole.TEACHER,
        is_active=True
    )
    db.add_all([teacher1, teacher2])
    
    # Students
    students = [
        User(
            name="Alice Williams",
            email="alice.williams@example.com",
            hashed_password=get_password_hash("student123"),
            role=UserRole.STUDENT,
            is_active=True
        ),
        User(
            name="Bob Brown",
            email="bob.brown@example.com",
            hashed_password=get_password_hash("student123"),
            role=UserRole.STUDENT,
            is_active=True
        ),
        User(
            name="Charlie Davis",
            email="charlie.davis@example.com",
            hashed_password=get_password_hash("student123"),
            role=UserRole.STUDENT,
            is_active=True
        ),
        User(
            name="Diana Miller",
            email="diana.miller@example.com",
            hashed_password=get_password_hash("student123"),
            role=UserRole.STUDENT,
            is_active=True
        ),
        User(
            name="Ethan Wilson",
            email="ethan.wilson@example.com",
            hashed_password=get_password_hash("student123"),
            role=UserRole.STUDENT,
            is_active=True
        ),
    ]
    db.add_all(students)
    db.commit()
    
    print(f"Created {1} admin, {2} teachers, and {5} students")
    return admin, teacher1, teacher2, students


def create_academic_structure(db: Session):
    """Create university, institution, department, and program."""
    print("Creating academic structure...")
    
    # University
    university = University(
        name="Anna University",
        code="AU",
        location="Chennai, Tamil Nadu"
    )
    db.add(university)
    db.commit()
    
    # Institution
    institution = Institution(
        name="College of Engineering Guindy",
        code="CEG",
        university_id=university.id,
        location="Guindy, Chennai"
    )
    db.add(institution)
    db.commit()
    
    # Department
    department = Department(
        name="Computer Science and Engineering",
        code="CSE",
        institution_id=institution.id
    )
    db.add(department)
    db.commit()
    
    # Program
    program = Program(
        name="Bachelor of Technology in Computer Science",
        code="BTECH-CSE",
        department_id=department.id,
        duration_years=4
    )
    db.add(program)
    db.commit()
    
    print(f"Created university: {university.name}")
    print(f"Created institution: {institution.name}")
    print(f"Created department: {department.name}")
    print(f"Created program: {program.name}")
    
    return university, institution, department, program


def create_regulation_and_batch(db: Session, program: Program):
    """Create regulation and batch."""
    print("Creating regulation and batch...")
    
    # Regulation
    regulation = Regulation(
        name="Regulation 2021",
        code="R2021",
        year=2021,
        description="Updated curriculum for 2021 batch onwards"
    )
    db.add(regulation)
    db.commit()
    
    # Batch
    batch = Batch(
        name="2021-2025 Batch",
        year=2021,
        program_id=program.id,
        regulation_id=regulation.id
    )
    db.add(batch)
    db.commit()
    
    print(f"Created regulation: {regulation.name}")
    print(f"Created batch: {batch.name}")
    
    return regulation, batch


def create_semesters_and_courses(db: Session):
    """Create semesters and courses."""
    print("Creating semesters and courses...")
    
    # Semesters
    semesters = []
    for i in range(1, 9):
        semester = Semester(
            name=f"Semester {i}",
            semester_number=i
        )
        semesters.append(semester)
        db.add(semester)
    db.commit()
    
    # Courses
    courses_data = [
        {"name": "Data Structures and Algorithms", "code": "CS101", "credits": 4},
        {"name": "Database Management Systems", "code": "CS201", "credits": 4},
        {"name": "Operating Systems", "code": "CS202", "credits": 3},
        {"name": "Computer Networks", "code": "CS301", "credits": 3},
        {"name": "Machine Learning", "code": "CS401", "credits": 4},
        {"name": "Artificial Intelligence", "code": "CS402", "credits": 4},
        {"name": "Web Technologies", "code": "CS303", "credits": 3},
        {"name": "Software Engineering", "code": "CS304", "credits": 3},
    ]
    
    courses = []
    for course_data in courses_data:
        course = Course(**course_data)
        courses.append(course)
        db.add(course)
    db.commit()
    
    # Map courses to semesters
    # Semester 1-2: Basic courses
    db.add(SemesterCourseMap(semester_id=semesters[0].id, course_id=courses[0].id))
    db.add(SemesterCourseMap(semester_id=semesters[1].id, course_id=courses[1].id))
    
    # Semester 3-4: Intermediate courses
    db.add(SemesterCourseMap(semester_id=semesters[2].id, course_id=courses[2].id))
    db.add(SemesterCourseMap(semester_id=semesters[3].id, course_id=courses[3].id))
    db.add(SemesterCourseMap(semester_id=semesters[3].id, course_id=courses[6].id))
    
    # Semester 5-6: Advanced courses
    db.add(SemesterCourseMap(semester_id=semesters[4].id, course_id=courses[4].id))
    db.add(SemesterCourseMap(semester_id=semesters[5].id, course_id=courses[5].id))
    db.add(SemesterCourseMap(semester_id=semesters[5].id, course_id=courses[7].id))
    
    db.commit()
    
    print(f"Created {len(semesters)} semesters")
    print(f"Created {len(courses)} courses")
    
    return semesters, courses


def create_allocations_and_enrollments(
    db: Session,
    teacher1: User,
    teacher2: User,
    students: list[User],
    courses: list[Course],
    batch: Batch
):
    """Create teacher allocations and student enrollments."""
    print("Creating teacher allocations and student enrollments...")
    
    # Teacher allocations
    # Teacher 1 teaches first 4 courses
    for i in range(4):
        allocation = TeacherCourseAllocation(
            teacher_id=teacher1.id,
            course_id=courses[i].id,
            batch_id=batch.id,
            academic_year="2024-2025"
        )
        db.add(allocation)
    
    # Teacher 2 teaches last 4 courses
    for i in range(4, 8):
        allocation = TeacherCourseAllocation(
            teacher_id=teacher2.id,
            course_id=courses[i].id,
            batch_id=batch.id,
            academic_year="2024-2025"
        )
        db.add(allocation)
    
    # Student enrollments
    for idx, student in enumerate(students, start=1):
        enrollment = StudentEnrollment(
            student_id=student.id,
            batch_id=batch.id,
            enrollment_number=f"2021CSE{idx:03d}"
        )
        db.add(enrollment)
    
    db.commit()
    
    print(f"Created {8} teacher allocations")
    print(f"Created {len(students)} student enrollments")


def seed_database():
    """Main seed function."""
    print("=" * 60)
    print("Starting database seeding...")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Create users
        admin, teacher1, teacher2, students = create_users(db)
        
        # Create academic structure
        university, institution, department, program = create_academic_structure(db)
        
        # Create regulation and batch
        regulation, batch = create_regulation_and_batch(db, program)
        
        # Create semesters and courses
        semesters, courses = create_semesters_and_courses(db)
        
        # Create allocations and enrollments
        create_allocations_and_enrollments(
            db, teacher1, teacher2, students, courses, batch
        )
        
        print("=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)
        print("\nLogin Credentials:")
        print("-" * 60)
        print("ADMIN:")
        print("  Email: admin@example.com")
        print("  Password: admin123")
        print("\nTEACHERS:")
        print("  Email: john.smith@example.com")
        print("  Password: teacher123")
        print("  Email: sarah.johnson@example.com")
        print("  Password: teacher123")
        print("\nSTUDENTS:")
        print("  Email: alice.williams@example.com")
        print("  Password: student123")
        print("  Email: bob.brown@example.com")
        print("  Password: student123")
        print("  Email: charlie.davis@example.com")
        print("  Password: student123")
        print("  Email: diana.miller@example.com")
        print("  Password: student123")
        print("  Email: ethan.wilson@example.com")
        print("  Password: student123")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
