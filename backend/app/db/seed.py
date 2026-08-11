from datetime import datetime
import asyncio
from app.db.session import AsyncSessionLocal
from app.repositories.user import UserRepository
from app.repositories.school import SchoolRepository
from app.models.user import User
from app.models.school import School
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.class_ import Class
from app.models.attendance import Attendance
from app.models.enums import Role, AttendanceStatus
from app.models.teacher import Teacher
from app.schemas.user import UserCreate
from app.schemas.school import SchoolCreate

async def seed_users():
    async with AsyncSessionLocal() as session:
        user_repo = UserRepository(session)
        school_repo = SchoolRepository(session)
        
        # Create Schools
        schools_data = [
            SchoolCreate(name="School A", contact_email="admin@schoola.com"),
            SchoolCreate(name="School B", contact_email="admin@schoolb.com")
        ]
        
        schools = {}
        for school_in in schools_data:
            # Simple check if school exists by name
            existing_schools = await school_repo.get_all()
            school = next((s for s in existing_schools if s.name == school_in.name), None)
            if not school:
                school = await school_repo.create(school_in)
                print(f"Created seed school: {school.name}")
            else:
                print(f"Seed school already exists: {school.name}")
            schools[school.name] = school
            
        # Create Users
        users_data = [
            {"email": "super_admin@example.com", "role": Role.SUPER_ADMIN, "school_id": None},
            {"email": "schoola_admin@example.com", "role": Role.SCHOOL_ADMIN, "school_id": schools["School A"].id},
            {"email": "schoola_teacher@example.com", "role": Role.TEACHER, "school_id": schools["School A"].id},
            {"email": "schoola_student@example.com", "role": Role.STUDENT, "school_id": schools["School A"].id},
            {"email": "schoolb_admin@example.com", "role": Role.SCHOOL_ADMIN, "school_id": schools["School B"].id},
            {"email": "schoolb_teacher@example.com", "role": Role.TEACHER, "school_id": schools["School B"].id},
            {"email": "schoolb_student@example.com", "role": Role.STUDENT, "school_id": schools["School B"].id},
        ]
        
        for ud in users_data:
            existing = await user_repo.get_by_email(ud["email"])
            if not existing:
                user_in = UserCreate(
                    email=ud["email"],
                    password="password123",
                    role=ud["role"],
                    school_id=ud["school_id"]
                )
                await user_repo.create(user_in)
                print(f"Created seed user: {ud['email']}")
            else:
                print(f"Seed user already exists: {ud['email']}")

        # Retrieve the user mapping
        from sqlalchemy import select
        result = await session.execute(select(User))
        all_users = result.scalars().all()
        user_map = {u.email: u.id for u in all_users}
        
        # Create Students
        student_result = await session.execute(select(Student))
        existing_students = student_result.scalars().all()
        if not any(s.student_id == "STU-A-001" for s in existing_students):
            student1 = Student(
                student_id="STU-A-001",
                name="Alice Student",
                grade="10",
                section="A",
                parent_name="Alice Parent",
                school_id=schools["School A"].id,
                user_id=user_map["schoola_student@example.com"]
            )
            session.add(student1)
            print("Created seed student: STU-A-001")
            
        if not any(s.student_id == "STU-A-002" for s in existing_students):
            student2 = Student(
                student_id="STU-A-002",
                name="Bob Student",
                grade="10",
                section="B",
                parent_name="Bob Parent",
                school_id=schools["School A"].id
            )
            session.add(student2)
            print("Created seed student: STU-A-002")

        if not any(s.student_id == "STU-B-001" for s in existing_students):
            student3 = Student(
                student_id="STU-B-001",
                name="Charlie Student",
                grade="9",
                section="A",
                parent_name="Charlie Parent",
                school_id=schools["School B"].id,
                user_id=user_map["schoolb_student@example.com"]
            )
            session.add(student3)
            print("Created seed student: STU-B-001")
            
        await session.commit()
        
        # Build student_map
        student_result_after = await session.execute(select(Student))
        student_map = {s.student_id: s for s in student_result_after.scalars().all()}
        
        # Create Teachers
        teacher_result = await session.execute(select(Teacher))
        existing_teachers = teacher_result.scalars().all()
        teacher_map = {}
        
        if not any(t.teacher_id == "TCH-A-001" for t in existing_teachers):
            teacher1 = Teacher(
                teacher_id="TCH-A-001",
                name="Alice Teacher",
                email="schoola_teacher@example.com",
                phone="123-456-7890",
                school_id=schools["School A"].id,
                user_id=user_map["schoola_teacher@example.com"]
            )
            session.add(teacher1)
            print("Created seed teacher: TCH-A-001")
            teacher_map["TCH-A-001"] = teacher1
        else:
            teacher_map["TCH-A-001"] = next(t for t in existing_teachers if t.teacher_id == "TCH-A-001")
            
        if not any(t.teacher_id == "TCH-A-002" for t in existing_teachers):
            teacher2 = Teacher(
                teacher_id="TCH-A-002",
                name="Bob Teacher",
                email="bob.teacher@schoola.com",
                school_id=schools["School A"].id
            )
            session.add(teacher2)
            print("Created seed teacher: TCH-A-002")
            teacher_map["TCH-A-002"] = teacher2
        else:
            teacher_map["TCH-A-002"] = next(t for t in existing_teachers if t.teacher_id == "TCH-A-002")

        if not any(t.teacher_id == "TCH-B-001" for t in existing_teachers):
            teacher3 = Teacher(
                teacher_id="TCH-B-001",
                name="Charlie Teacher",
                email="schoolb_teacher@example.com",
                school_id=schools["School B"].id,
                user_id=user_map["schoolb_teacher@example.com"]
            )
            session.add(teacher3)
            print("Created seed teacher: TCH-B-001")
            teacher_map["TCH-B-001"] = teacher3
        else:
            teacher_map["TCH-B-001"] = next(t for t in existing_teachers if t.teacher_id == "TCH-B-001")

        if not any(t.teacher_id == "TCH-B-002" for t in existing_teachers):
            teacher4 = Teacher(
                teacher_id="TCH-B-002",
                name="Diana Teacher",
                email="diana.teacher@schoolb.com",
                school_id=schools["School B"].id
            )
            session.add(teacher4)
            print("Created seed teacher: TCH-B-002")
            teacher_map["TCH-B-002"] = teacher4
        else:
            teacher_map["TCH-B-002"] = next(t for t in existing_teachers if t.teacher_id == "TCH-B-002")
            
        await session.commit()
        
        # Create Classes
        class_result = await session.execute(select(Class))
        existing_classes = class_result.scalars().all()
        
        if not any(c.grade == "10" and c.section == "A" and c.school_id == schools["School A"].id for c in existing_classes):
            class1 = Class(
                grade="10",
                section="A",
                name="10th Grade Section A",
                school_id=schools["School A"].id,
                teacher_id=teacher_map["TCH-A-001"].id
            )
            session.add(class1)
            print("Created seed class: 10 A (School A)")

        if not any(c.grade == "10" and c.section == "B" and c.school_id == schools["School A"].id for c in existing_classes):
            class2 = Class(
                grade="10",
                section="B",
                name="10th Grade Section B",
                school_id=schools["School A"].id,
                teacher_id=teacher_map["TCH-A-002"].id
            )
            session.add(class2)
            print("Created seed class: 10 B (School A)")
            
        if not any(c.grade == "9" and c.section == "A" and c.school_id == schools["School B"].id for c in existing_classes):
            class3 = Class(
                grade="9",
                section="A",
                name="9th Grade Section A",
                school_id=schools["School B"].id,
                teacher_id=teacher_map["TCH-B-001"].id
            )
            session.add(class3)
            print("Created seed class: 9 A (School B)")

        if not any(c.grade == "9" and c.section == "B" and c.school_id == schools["School B"].id for c in existing_classes):
            class4 = Class(
                grade="9",
                section="B",
                name="9th Grade Section B",
                school_id=schools["School B"].id,
                teacher_id=teacher_map["TCH-B-002"].id
            )
            session.add(class4)
            print("Created seed class: 9 B (School B)")
            
        await session.commit()
        
        # Create Attendance
        attendance_result = await session.execute(select(Attendance))
        existing_attendance = attendance_result.scalars().all()
        
        target_date = datetime.now().date()
        if not existing_attendance:
            att = Attendance(
                student_id=student_map["STU-A-001"].id,
                school_id=schools["School A"].id,
                attendance_date=target_date,
                status=AttendanceStatus.PRESENT.value,
                marked_by=user_map["schoola_teacher@example.com"]
            )
            session.add(att)
            await session.commit()
            print(f"Created seed attendance for STU-A-001 on {target_date}")


if __name__ == "__main__":
    asyncio.run(seed_users())
