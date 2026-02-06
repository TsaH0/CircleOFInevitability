from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Contest,
    ContestProblem,
    ContestStatus,
    ProblemHistory,
    SubmissionStatus,
    User,
    UserTopicRating,
)
from app.schemas import (
    CompleteContestResponse,
    ContestDetailResponse,
    ContestHistoryResponse,
    ContestListResponse,
    ContestProblemOut,
    MarkQuestionSolvedRequest,
    MarkQuestionSolvedResponse,
    UserProfileResponse,
)
from app.services.contest_generator import ContestGenerator

router = APIRouter(prefix="/api/contests", tags=["contests"])

contest_generator = ContestGenerator()

# ── Helpers ──────────────────────────────────────────────────────────────────

LEVEL_TITLES = [
    "Novice Coder",
    "Code Apprentice",
    "Algorithm Knight",
    "Binary Baron",
    "Data Duke",
    "Logic Lord",
    "Syntax Sovereign",
    "Algorithm Archmage",
    "Code Champion",
    "Master of Recursion",
    "Grandmaster",
]


def _user_level(rating: int) -> int:
    """Derive a level number from the user's rating."""
    return max(1, rating // 10 + 1)


def _user_title(level: int) -> str:
    idx = min(level // 5, len(LEVEL_TITLES) - 1)
    return LEVEL_TITLES[idx]


def _build_contest_detail(contest: Contest) -> ContestDetailResponse:
    """
    Convert a Contest ORM object (with its related contest_problems loaded)
    into the shape the frontend expects.
    """
    questions: list[ContestProblemOut] = []
    question_states: dict[str, int] = {}

    for cp in contest.problems:
        questions.append(
            ContestProblemOut(
                id=cp.problem_id,
                name=cp.problem_name,
                url=cp.problem_url,
                source=cp.source,
                internal_rating=cp.difficulty,
                topic=cp.topic,
                tags=[cp.topic] if cp.topic else [],
                is_weak_topic_problem=cp.is_weak_topic_problem or False,
            )
        )
        question_states[cp.problem_id] = (
            1 if cp.status == SubmissionStatus.SOLVED else 0
        )

    solved_count = sum(v for v in question_states.values())
    rating_after = (
        contest.rating_at_start + (contest.rating_change or 0)
        if contest.rating_change is not None
        else None
    )

    return ContestDetailResponse(
        contestId=contest.id,
        userId=contest.user_id,
        title=contest.title or f"Contest #{contest.id}",
        status=contest.status.value.lower()
        if isinstance(contest.status, ContestStatus)
        else str(contest.status).lower(),
        questions=questions,
        questionStates=question_states,
        solvedCount=solved_count,
        totalQuestions=contest.num_problems or len(questions),
        ratingBefore=contest.rating_at_start,
        ratingAfter=rating_after,
        createdAt=contest.started_at,
        completedAt=contest.ended_at,
    )


def _get_active_contest_for_user(db: Session, user_id: int) -> Contest | None:
    return (
        db.query(Contest)
        .filter(Contest.user_id == user_id, Contest.status == ContestStatus.ACTIVE)
        .first()
    )


# ── Auth dependency ──────────────────────────────────────────────────────────


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid user id in token")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# ── Routes ───────────────────────────────────────────────────────────────────


@router.get("/generate", response_model=ContestDetailResponse)
def generate_contest(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check for an existing active contest
    active = _get_active_contest_for_user(db, current_user.id)
    if active:
        raise HTTPException(
            status_code=400,
            detail="You already have an active contest. Complete or abandon it first.",
        )

    user_rating = current_user.rating or 0

    # Build a tag-stats dict from the user_topic_ratings table
    topic_rows = (
        db.query(UserTopicRating)
        .filter(UserTopicRating.user_id == current_user.id)
        .all()
    )
    user_stats = {tr.topic: tr.problems_solved or 0 for tr in topic_rows}

    contest_data = contest_generator.generate_contest(
        user_id=str(current_user.id),
        user_rating=user_rating,
        user_stats=user_stats,
    )

    questions = contest_data["questions"]

    # Determine target difficulty (average internal_rating of selected problems)
    avg_diff = 0
    if questions:
        avg_diff = sum(q.get("internal_rating", 0) for q in questions) // len(questions)

    new_contest = Contest(
        user_id=current_user.id,
        title=contest_data["title"],
        status=ContestStatus.ACTIVE,
        rating_at_start=user_rating,
        rating_change=0,
        num_problems=len(questions),
        target_difficulty=avg_diff,
        problems_solved=0,
        total_time_seconds=0,
    )

    db.add(new_contest)
    db.flush()  # get new_contest.id

    # Create a ContestProblem row for every question
    for q in questions:
        cp = ContestProblem(
            contest_id=new_contest.id,
            problem_id=q["id"],
            problem_name=q.get("name", "Unknown"),
            problem_url=q.get("url"),
            topic=(q.get("tags") or ["general"])[0],
            difficulty=q.get("internal_rating", 0),
            source=q.get("source", "unknown"),
            is_weak_topic_problem=False,
            status=SubmissionStatus.PENDING,
        )
        db.add(cp)

    db.commit()
    db.refresh(new_contest)

    return _build_contest_detail(new_contest)


@router.post("/mark-solved", response_model=MarkQuestionSolvedResponse)
def mark_question_solved(
    request_data: MarkQuestionSolvedRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active = _get_active_contest_for_user(db, current_user.id)
    if not active:
        raise HTTPException(status_code=400, detail="No active contest found")

    if active.status != ContestStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Contest is not active")

    # Find the matching contest_problem row
    cp = (
        db.query(ContestProblem)
        .filter(
            ContestProblem.contest_id == active.id,
            ContestProblem.problem_id == request_data.questionId,
        )
        .first()
    )

    if not cp:
        raise HTTPException(
            status_code=404, detail="Question not found in this contest"
        )

    if cp.status == SubmissionStatus.SOLVED:
        raise HTTPException(status_code=400, detail="Question already marked as solved")

    # Mark solved
    cp.status = SubmissionStatus.SOLVED
    cp.submitted_at = datetime.utcnow()
    cp.attempts = (cp.attempts or 0) + 1

    db.flush()  # flush so the recount query below sees the updated status

    # Recount solved problems on the contest
    solved_count = (
        db.query(ContestProblem)
        .filter(
            ContestProblem.contest_id == active.id,
            ContestProblem.status == SubmissionStatus.SOLVED,
        )
        .count()
    )
    active.problems_solved = solved_count

    # Update per-topic stats in user_topic_ratings
    topic = cp.topic
    topic_row = (
        db.query(UserTopicRating)
        .filter(
            UserTopicRating.user_id == current_user.id,
            UserTopicRating.topic == topic,
        )
        .first()
    )
    if topic_row:
        topic_row.problems_solved = (topic_row.problems_solved or 0) + 1
        topic_row.updated_at = datetime.utcnow()
    else:
        topic_row = UserTopicRating(
            user_id=current_user.id,
            topic=topic,
            rating=0,
            problems_solved=1,
            problems_attempted=1,
        )
        db.add(topic_row)

    # Update problem_history
    ph = (
        db.query(ProblemHistory)
        .filter(
            ProblemHistory.user_id == current_user.id,
            ProblemHistory.problem_id == cp.problem_id,
        )
        .first()
    )
    if ph:
        ph.times_solved = (ph.times_solved or 0) + 1
        ph.times_attempted = (ph.times_attempted or 0) + 1
        ph.last_attempted_at = datetime.utcnow()
    else:
        ph = ProblemHistory(
            user_id=current_user.id,
            problem_id=cp.problem_id,
            times_solved=1,
            times_attempted=1,
        )
        db.add(ph)

    # Update user aggregate counters
    current_user.total_problems_solved = (current_user.total_problems_solved or 0) + 1
    current_user.total_problems_attempted = (
        current_user.total_problems_attempted or 0
    ) + 1
    current_user.updated_at = datetime.utcnow()

    db.commit()

    return MarkQuestionSolvedResponse(
        success=True,
        questionId=cp.problem_id,
        solved=True,
        solvedCount=solved_count,
        totalQuestions=active.num_problems or 0,
        tagsUpdated=[topic] if topic else [],
    )


@router.post("/complete", response_model=CompleteContestResponse)
def complete_contest(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active = _get_active_contest_for_user(db, current_user.id)
    if not active:
        raise HTTPException(status_code=400, detail="No active contest found")

    if active.status != ContestStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Contest is not active")

    level_before = _user_level(current_user.rating or 0)
    rating_before = active.rating_at_start
    solved_count = active.problems_solved or 0
    total_questions = active.num_problems or 0

    is_successful = solved_count == total_questions and total_questions > 0

    # Calculate rating change
    if is_successful:
        rating_change = 10
        active.status = ContestStatus.COMPLETED
    else:
        rating_change = min(solved_count * 2, 6)
        active.status = ContestStatus.COMPLETED

    rating_after = rating_before + rating_change
    active.rating_change = rating_change
    active.ended_at = datetime.utcnow()

    # Update user rating & counters
    current_user.rating = rating_after
    current_user.total_contests = (current_user.total_contests or 0) + 1
    current_user.updated_at = datetime.utcnow()

    level_after = _user_level(rating_after)

    # Generate traits / title when successful (cosmetic, never stored in DB)
    new_traits: list[str] = []
    new_title: str | None = None

    if is_successful:
        topic_rows = (
            db.query(UserTopicRating)
            .filter(UserTopicRating.user_id == current_user.id)
            .all()
        )
        user_stats = {tr.topic: tr.problems_solved or 0 for tr in topic_rows}

        new_traits, new_title = contest_generator.generate_traits_and_title(
            user_stats=user_stats,
            current_level=level_after,
            current_traits=[],
            solved_count=solved_count,
        )

    db.commit()

    return CompleteContestResponse(
        success=True,
        contestId=active.id,
        status=active.status.value.lower()
        if isinstance(active.status, ContestStatus)
        else str(active.status).lower(),
        solvedCount=solved_count,
        totalQuestions=total_questions,
        ratingBefore=rating_before,
        ratingAfter=rating_after,
        ratingChange=rating_change,
        levelBefore=level_before,
        levelAfter=level_after,
        newTraits=new_traits,
        newTitle=new_title,
    )


@router.post("/abandon")
def abandon_contest(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active = _get_active_contest_for_user(db, current_user.id)
    if not active:
        raise HTTPException(status_code=400, detail="No active contest found")

    active.status = ContestStatus.ABANDONED
    active.ended_at = datetime.utcnow()
    active.rating_change = 0

    current_user.total_contests = (current_user.total_contests or 0) + 1
    current_user.updated_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "message": "Contest abandoned",
        "contestId": active.id,
    }


@router.get("/active", response_model=ContestDetailResponse)
def get_active_contest(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    active = _get_active_contest_for_user(db, current_user.id)
    if not active:
        raise HTTPException(status_code=404, detail="No active contest found")

    return _build_contest_detail(active)


@router.get("/history", response_model=ContestHistoryResponse)
def get_contest_history(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contests = (
        db.query(Contest)
        .filter(
            Contest.user_id == current_user.id,
            Contest.status.in_([ContestStatus.COMPLETED, ContestStatus.ABANDONED]),
        )
        .order_by(Contest.ended_at.desc())
        .all()
    )

    details = [_build_contest_detail(c) for c in contests]
    total_solved = sum(d.solvedCount for d in details)
    successful = sum(
        1
        for d in details
        if d.status == "completed" and d.solvedCount == d.totalQuestions
    )

    return ContestHistoryResponse(
        history=details,
        total=len(details),
        totalSolved=total_solved,
        successfulContests=successful,
    )


@router.get("/", response_model=ContestListResponse)
def get_user_contests(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contests = (
        db.query(Contest)
        .filter(Contest.user_id == current_user.id)
        .order_by(Contest.started_at.desc())
        .all()
    )

    details = [_build_contest_detail(c) for c in contests]
    return ContestListResponse(contests=details, total=len(details))


@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Active contest
    active = _get_active_contest_for_user(db, current_user.id)
    active_detail = _build_contest_detail(active) if active else None

    # Aggregate counts
    total_contests = (
        db.query(Contest).filter(Contest.user_id == current_user.id).count()
    )
    successful_contests = (
        db.query(Contest)
        .filter(
            Contest.user_id == current_user.id,
            Contest.status == ContestStatus.COMPLETED,
            Contest.problems_solved == Contest.num_problems,
        )
        .count()
    )

    # Per-topic stats dict
    topic_rows = (
        db.query(UserTopicRating)
        .filter(UserTopicRating.user_id == current_user.id)
        .all()
    )
    stats = {tr.topic: tr.problems_solved or 0 for tr in topic_rows}

    # Derived fields
    level = _user_level(current_user.rating or 0)
    title = _user_title(level)

    # Traits: top topics the user has solved problems in
    sorted_topics = sorted(stats.items(), key=lambda x: -x[1])
    traits = [t for t, _ in sorted_topics[:5]] if sorted_topics else []

    return UserProfileResponse(
        userId=current_user.id,
        username=current_user.username,
        rating=current_user.rating or 0,
        level=level,
        title=title,
        stats=stats,
        traits=traits,
        totalQuestionsSolved=current_user.total_problems_solved or 0,
        totalContests=total_contests,
        successfulContests=successful_contests,
        activeContestId=active.id if active else None,
        activeContest=active_detail,
    )


@router.get("/{contest_id}", response_model=ContestDetailResponse)
def get_contest(
    contest_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contest = (
        db.query(Contest)
        .filter(Contest.id == contest_id, Contest.user_id == current_user.id)
        .first()
    )

    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")

    return _build_contest_detail(contest)
