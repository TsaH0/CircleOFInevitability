from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ContestStatus(PyEnum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class SubmissionStatus(PyEnum):
    PENDING = "PENDING"
    SOLVED = "SOLVED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100), nullable=True)
    rating = Column(Integer, nullable=False, default=30)
    total_contests = Column(Integer, default=0)
    total_problems_solved = Column(Integer, default=0)
    total_problems_attempted = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    contests = relationship("Contest", back_populates="user", lazy="dynamic")
    topic_ratings = relationship(
        "UserTopicRating", back_populates="user", lazy="dynamic"
    )
    weak_topics = relationship("WeakTopic", back_populates="user", lazy="dynamic")
    problem_history = relationship(
        "ProblemHistory", back_populates="user", lazy="dynamic"
    )


class Contest(Base):
    __tablename__ = "contests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=True)
    status = Column(
        Enum(ContestStatus, name="conteststatus", create_type=False),
        nullable=False,
        default=ContestStatus.ACTIVE,
    )
    rating_at_start = Column(Integer, nullable=False)
    rating_change = Column(Integer, default=0)
    num_problems = Column(Integer, default=4)
    target_difficulty = Column(Integer, nullable=False, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    time_limit_minutes = Column(Integer, nullable=True)
    problems_solved = Column(Integer, default=0)
    total_time_seconds = Column(Integer, default=0)

    user = relationship("User", back_populates="contests")
    problems = relationship("ContestProblem", back_populates="contest", lazy="joined")


class ContestProblem(Base):
    __tablename__ = "contest_problems"

    id = Column(Integer, primary_key=True, autoincrement=True)
    contest_id = Column(Integer, ForeignKey("contests.id"), nullable=False)
    problem_id = Column(String(100), nullable=False)
    problem_name = Column(String(255), nullable=False)
    problem_url = Column(String(500), nullable=True)
    topic = Column(String(100), nullable=False)
    difficulty = Column(Integer, nullable=False)
    source = Column(String(50), nullable=False)
    is_weak_topic_problem = Column(Boolean, default=False)
    status = Column(
        Enum(SubmissionStatus, name="submissionstatus", create_type=False),
        nullable=False,
        default=SubmissionStatus.PENDING,
    )
    started_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)
    attempts = Column(Integer, default=0)
    user_approach = Column(Text, nullable=True)

    contest = relationship("Contest", back_populates="problems")
    reflection = relationship(
        "ProblemReflection", back_populates="contest_problem", uselist=False
    )


class UserTopicRating(Base):
    __tablename__ = "user_topic_ratings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False, default=0)
    problems_solved = Column(Integer, default=0)
    problems_attempted = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="topic_ratings")


class WeakTopic(Base):
    __tablename__ = "weak_topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(100), nullable=False)
    current_level = Column(Integer, nullable=False, default=0)
    target_level = Column(Integer, nullable=False, default=0)
    consecutive_solves = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)
    total_failures = Column(Integer, default=0)
    detected_at = Column(DateTime, default=datetime.utcnow)
    last_attempt_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="weak_topics")


class ProblemHistory(Base):
    __tablename__ = "problem_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    problem_id = Column(String(100), nullable=False)
    last_attempted_at = Column(DateTime, default=datetime.utcnow)
    times_attempted = Column(Integer, default=0)
    times_solved = Column(Integer, default=0)
    best_time_seconds = Column(Integer, nullable=True)

    user = relationship("User", back_populates="problem_history")


class ProblemReflection(Base):
    __tablename__ = "problem_reflections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    contest_problem_id = Column(
        Integer, ForeignKey("contest_problems.id"), nullable=False
    )
    editorial_text = Column(Text, nullable=True)
    editorial_url = Column(String(500), nullable=True)
    pivot_sentence = Column(Text, nullable=True)
    tips = Column(Text, nullable=True)
    what_to_improve = Column(Text, nullable=True)
    master_approach = Column(Text, nullable=True)
    full_response = Column(Text, nullable=True)
    model_used = Column(String(100), nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    generation_error = Column(Text, nullable=True)

    contest_problem = relationship("ContestProblem", back_populates="reflection")
