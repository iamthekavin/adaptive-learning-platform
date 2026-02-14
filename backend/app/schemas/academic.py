from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


# Regulation Schemas
class RegulationBase(BaseModel):
    name: str
    code: str
    year: int
    description: Optional[str] = None


class RegulationCreate(RegulationBase):
    pass


class RegulationResponse(RegulationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Program Schemas
class ProgramBase(BaseModel):
    name: str
    code: str
    department_id: int
    duration_years: int = 4


class ProgramCreate(ProgramBase):
    pass


class ProgramResponse(ProgramBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Batch Schemas
class BatchBase(BaseModel):
    name: str
    year: int
    program_id: int
    regulation_id: int


class BatchCreate(BatchBase):
    pass


class BatchResponse(BatchBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Course Schemas
class CourseBase(BaseModel):
    name: str
    code: str
    credits: int = 3
    description: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# SemesterCourseMap Schemas
class SemesterCourseMapBase(BaseModel):
    semester_id: int
    course_id: int


class SemesterCourseMapCreate(SemesterCourseMapBase):
    pass


class SemesterCourseMapResponse(SemesterCourseMapBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Semester Schema (for student syllabus)
class SemesterResponse(BaseModel):
    id: int
    name: str
    semester_number: int

    model_config = ConfigDict(from_attributes=True)


# Student Syllabus Response
class CourseInSyllabus(BaseModel):
    id: int
    name: str
    code: str
    credits: int
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SemesterWithCourses(BaseModel):
    semester: SemesterResponse
    courses: List[CourseInSyllabus]


class StudentSyllabusResponse(BaseModel):
    student_name: str
    enrollment_number: str
    batch_name: str
    program_name: str
    regulation_name: str
    semesters: List[SemesterWithCourses]


# Rebuild models to resolve forward references
SemesterWithCourses.model_rebuild()
StudentSyllabusResponse.model_rebuild()
