from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class University(Base):
    """University model."""
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True)
    location = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    institutions = relationship("Institution", back_populates="university")


class Institution(Base):
    """Institution/College model."""
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)
    location = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    university = relationship("University", back_populates="institutions")
    departments = relationship("Department", back_populates="institution")


class Department(Base):
    """Department model."""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    institution = relationship("Institution", back_populates="departments")
    programs = relationship("Program", back_populates="department")


class Program(Base):
    """Academic Program model (e.g., B.Tech CSE, M.Tech AI)."""
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    duration_years = Column(Integer, nullable=False, default=4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    department = relationship("Department", back_populates="programs")
    batches = relationship("Batch", back_populates="program")


class Regulation(Base):
    """Regulation/Syllabus model."""
    __tablename__ = "regulations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    year = Column(Integer, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    batches = relationship("Batch", back_populates="regulation")


class Batch(Base):
    """Batch/Year model."""
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    year = Column(Integer, nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    regulation_id = Column(Integer, ForeignKey("regulations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    program = relationship("Program", back_populates="batches")
    regulation = relationship("Regulation", back_populates="batches")
    enrollments = relationship("StudentEnrollment", back_populates="batch")


class Semester(Base):
    """Semester model."""
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    semester_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    course_maps = relationship("SemesterCourseMap", back_populates="semester")


class Course(Base):
    """Course model."""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    credits = Column(Integer, nullable=False, default=3)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    course_maps = relationship("SemesterCourseMap", back_populates="course")
    allocations = relationship("TeacherCourseAllocation", back_populates="course")


class SemesterCourseMap(Base):
    """Mapping between semesters and courses."""
    __tablename__ = "semester_course_maps"

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    semester = relationship("Semester", back_populates="course_maps")
    course = relationship("Course", back_populates="course_maps")


class TeacherCourseAllocation(Base):
    """Teacher to course allocation."""
    __tablename__ = "teacher_course_allocations"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    academic_year = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="allocations")


class StudentEnrollment(Base):
    """Student enrollment in a batch."""
    __tablename__ = "student_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    enrollment_number = Column(String(50), nullable=False, unique=True)
    enrollment_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    batch = relationship("Batch", back_populates="enrollments")
