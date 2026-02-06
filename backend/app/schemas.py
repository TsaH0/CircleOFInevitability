from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, computed_field

# ── Auth ─────────────────────────────────────────────────────────────────────


class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    rating: int
    total_contests: int
    total_problems_solved: int
    total_problems_attempted: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ── Problems ─────────────────────────────────────────────────────────────────


class ProblemResponse(BaseModel):
    id: str
    name: str
    url: str
    source: str
    original_difficulty: Optional[str] = None
    internal_rating: int
    primary_skills: List[str] = []
    secondary_skills: List[str] = []
    pattern_id: Optional[str] = None
    tags: List[str] = []
    extra: Optional[Dict[str, Any]] = None


# ── Contest Problem (per-problem row in the DB) ─────────────────────────────


class ContestProblemOut(BaseModel):
    """Mirrors the contest_problems row but shaped for the frontend question list."""

    id: str  # problem_id (the external id, e.g. codeforces problem id)
    name: str
    url: Optional[str] = None
    source: str
    internal_rating: int
    topic: str
    tags: List[str] = []
    is_weak_topic_problem: bool = False


# ── Contest Detail — the shape the frontend actually reads ───────────────────


class ContestDetailResponse(BaseModel):
    """
    Shaped for the frontend FightPage / LevelSelectionPage / ResultPage.

    Fields like ``questions``, ``questionStates``, ``solvedCount`` and
    ``totalQuestions`` are assembled on the fly from the ``contest_problems``
    rows rather than stored as JSON blobs.
    """

    # identifiers
    contestId: int
    userId: int
    title: Optional[str] = None
    status: str

    # problems — built from contest_problems join
    questions: List[ContestProblemOut] = []
    questionStates: Dict[str, int] = {}  # {problem_id: 0|1}

    # aggregates
    solvedCount: int = 0
    totalQuestions: int = 0

    # rating
    ratingBefore: int
    ratingAfter: Optional[int] = None

    # timestamps
    createdAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContestListResponse(BaseModel):
    contests: List[ContestDetailResponse]
    total: int


# ── Mark-solved ──────────────────────────────────────────────────────────────


class MarkQuestionSolvedRequest(BaseModel):
    questionId: str


class MarkQuestionSolvedResponse(BaseModel):
    success: bool
    questionId: str
    solved: bool
    solvedCount: int
    totalQuestions: int
    tagsUpdated: List[str]


# ── Complete / Abandon ───────────────────────────────────────────────────────


class CompleteContestRequest(BaseModel):
    pass


class CompleteContestResponse(BaseModel):
    success: bool
    contestId: int
    status: str
    solvedCount: int
    totalQuestions: int
    ratingBefore: int
    ratingAfter: int
    ratingChange: int
    levelBefore: int
    levelAfter: int
    newTraits: List[str] = []
    newTitle: Optional[str] = None


# ── History ──────────────────────────────────────────────────────────────────


class ContestHistoryResponse(BaseModel):
    history: List[ContestDetailResponse]
    total: int
    totalSolved: int
    successfulContests: int


# ── User Profile (used by AuthContext.refreshUser) ───────────────────────────


class UserProfileResponse(BaseModel):
    userId: int
    username: str
    rating: int
    level: int
    title: str
    stats: Dict[str, int] = {}
    traits: List[str] = []
    totalQuestionsSolved: int = 0
    totalContests: int = 0
    successfulContests: int = 0
    activeContestId: Optional[int] = None
    activeContest: Optional[ContestDetailResponse] = None

    class Config:
        from_attributes = True
