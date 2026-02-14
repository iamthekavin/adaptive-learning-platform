"""
Seed script for quiz data.
Run with: python -m app.seed.seed_quiz
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.quiz import Assessment, Question, QuestionType
from app.models.academic import Program, Semester


def seed_quiz_data():
    """Seed quiz data."""
    print("=" * 60)
    print("Starting quiz data seeding...")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Get first teacher
        teacher = db.query(User).filter(User.role == UserRole.TEACHER).first()
        if not teacher:
            print("Error: No teacher found. Please run main seed first.")
            return
        
        # Get first program and semester
        program = db.query(Program).first()
        semester = db.query(Semester).filter(Semester.semester_number == 1).first()
        
        if not program or not semester:
            print("Error: No program or semester found. Please run main seed first.")
            return
        
        # Create assessment
        assessment = Assessment(
            title="Data Structures - Mid Term Assessment",
            description="Mid-term assessment covering arrays, linked lists, stacks, and queues",
            teacher_id=teacher.id,
            program_id=program.id,
            semester_id=semester.id,
            duration_minutes=30,
            total_marks=0.0,  # Will be updated as questions are added
            is_active=True
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        print(f"Created assessment: {assessment.title}")
        
        # Create 5 MCQ questions
        questions_data = [
            {
                "question_text": "What is the time complexity of accessing an element in an array by index?",
                "options": {
                    "A": "O(1)",
                    "B": "O(n)",
                    "C": "O(log n)",
                    "D": "O(n^2)"
                },
                "correct_answer": "A",
                "explanation": "Array elements can be accessed directly using their index in constant time O(1).",
                "marks": 2.0,
                "negative_marks": 0.5
            },
            {
                "question_text": "Which data structure uses LIFO (Last In First Out) principle?",
                "options": {
                    "A": "Queue",
                    "B": "Stack",
                    "C": "Array",
                    "D": "Linked List"
                },
                "correct_answer": "B",
                "explanation": "Stack follows LIFO principle where the last element added is the first one to be removed.",
                "marks": 2.0,
                "negative_marks": 0.5
            },
            {
                "question_text": "What is the advantage of a linked list over an array?",
                "options": {
                    "A": "Faster access time",
                    "B": "Less memory usage",
                    "C": "Dynamic size",
                    "D": "Better cache locality"
                },
                "correct_answer": "C",
                "explanation": "Linked lists can grow and shrink dynamically, unlike arrays which have fixed size.",
                "marks": 2.0,
                "negative_marks": 0.5
            },
            {
                "question_text": "In a circular queue, what happens when rear reaches the end of the array?",
                "options": {
                    "A": "Queue becomes full",
                    "B": "Rear wraps around to the beginning",
                    "C": "Queue is reset",
                    "D": "Error occurs"
                },
                "correct_answer": "B",
                "explanation": "In a circular queue, when rear reaches the end, it wraps around to the beginning if space is available.",
                "marks": 2.0,
                "negative_marks": 0.5
            },
            {
                "question_text": "What is the time complexity of inserting an element at the beginning of a singly linked list?",
                "options": {
                    "A": "O(1)",
                    "B": "O(n)",
                    "C": "O(log n)",
                    "D": "O(n^2)"
                },
                "correct_answer": "A",
                "explanation": "Inserting at the beginning of a linked list only requires updating the head pointer, which is O(1).",
                "marks": 2.0,
                "negative_marks": 0.5
            }
        ]
        
        total_marks = 0.0
        for q_data in questions_data:
            question = Question(
                assessment_id=assessment.id,
                question_text=q_data["question_text"],
                question_type=QuestionType.MCQ,
                marks=q_data["marks"],
                negative_marks=q_data["negative_marks"],
                options=q_data["options"],
                correct_answer=q_data["correct_answer"],
                explanation=q_data["explanation"]
            )
            db.add(question)
            total_marks += q_data["marks"]
        
        # Update assessment total marks
        assessment.total_marks = total_marks
        
        db.commit()
        
        print(f"Created {len(questions_data)} questions")
        print(f"Total marks: {total_marks}")
        print("=" * 60)
        print("Quiz data seeding completed successfully!")
        print("=" * 60)
        print("\nAssessment Details:")
        print(f"  Title: {assessment.title}")
        print(f"  Teacher: {teacher.name}")
        print(f"  Duration: {assessment.duration_minutes} minutes")
        print(f"  Total Questions: {len(questions_data)}")
        print(f"  Total Marks: {total_marks}")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error during quiz seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_quiz_data()
