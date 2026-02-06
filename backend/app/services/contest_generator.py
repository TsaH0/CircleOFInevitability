import os
import json
import random
from typing import List, Dict, Optional, Tuple
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PROBLEMS_FILE = os.path.join(os.path.dirname(__file__), "../../output/standardized_problems.json")


class ContestGenerator:
    def __init__(self):
        self.problems = self._load_problems()
        self.client = None
        if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
            self.client = genai.Client(api_key=GEMINI_API_KEY)

    def _load_problems(self) -> List[Dict]:
        try:
            with open(PROBLEMS_FILE, "r") as f:
                data = json.load(f)
                return data.get("problems", [])
        except FileNotFoundError:
            return []

    def get_problems_in_rating_range(
        self, min_rating: int, max_rating: int
    ) -> List[Dict]:
        return [
            p
            for p in self.problems
            if min_rating <= p.get("internal_rating", 0) <= max_rating
        ]

    def select_random_questions(
        self, user_rating: int, count: int = 4
    ) -> List[Dict]:
        min_rating = user_rating
        max_rating = user_rating + 10

        eligible_problems = self.get_problems_in_rating_range(min_rating, max_rating)

        if len(eligible_problems) < count:
            eligible_problems = self.get_problems_in_rating_range(
                max(1, min_rating - 5), max_rating + 5
            )

        if len(eligible_problems) < count:
            return eligible_problems

        return random.sample(eligible_problems, count)

    def generate_title(self, user_stats: Dict[str, int]) -> str:
        if not self.client:
            return self._generate_fallback_title()

        try:
            stats_summary = ", ".join(
                [f"{tag}: {count}" for tag, count in user_stats.items()]
            )
            if not stats_summary:
                stats_summary = "New adventurer with no completed challenges yet"

            prompt = f"""Generate a creative, epic title for a boss mission/contest in a competitive programming game.
            The player has the following stats (tags they've practiced): {stats_summary}

            Make it sound like an epic quest or boss battle. Keep it short (3-6 words).
            Just return the title, nothing else. No quotes, no explanation."""

            response = self.client.models.generate_content(
                model="gemini-2.5-flash-preview-05-20",
                contents=prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=50,
                    temperature=0.9,
                ),
            )
            return response.text.strip().strip('"').strip("'")
        except Exception:
            return self._generate_fallback_title()

    def _generate_fallback_title(self) -> str:
        prefixes = [
            "The Shadow",
            "Trial of the",
            "Rise of",
            "The Fallen",
            "Siege of",
            "Dawn of",
            "The Last",
            "Echoes of",
        ]
        themes = [
            "Algorithm Master",
            "Code Breaker",
            "Binary Phantom",
            "Recursive Dragon",
            "Stack Overflow",
            "Null Pointer",
            "Infinite Loop",
            "Memory Leviathan",
            "Logic Fortress",
            "Data Serpent",
        ]
        return f"{random.choice(prefixes)} {random.choice(themes)}"

    def generate_contest(
        self, user_id: str, user_rating: int, user_stats: Dict[str, int]
    ) -> Dict:
        questions = self.select_random_questions(user_rating, count=4)
        title = self.generate_title(user_stats)

        question_states = {q["id"]: 0 for q in questions}

        return {
            "title": title,
            "questions": questions,
            "questionStates": question_states,
            "ratingBefore": user_rating,
            "totalQuestions": len(questions),
        }

    def generate_traits_and_title(
        self,
        user_stats: Dict[str, int],
        current_level: int,
        current_traits: List[str],
        solved_count: int,
    ) -> Tuple[List[str], Optional[str]]:
        if not self.client:
            return self._generate_fallback_traits_and_title(current_level, solved_count)

        try:
            stats_summary = ", ".join(
                [f"{tag}: {count}" for tag, count in sorted(user_stats.items(), key=lambda x: -x[1])[:10]]
            )
            if not stats_summary:
                stats_summary = "Beginner with limited experience"

            existing_traits = ", ".join(current_traits) if current_traits else "None yet"

            prompt = f"""You are generating character progression for a competitive programming game player.

Player Stats:
- Level: {current_level}
- Top practiced tags: {stats_summary}
- Questions solved in this contest: {solved_count}/4
- Current traits: {existing_traits}

Generate 1-2 NEW traits and optionally a new title based on their progression.
Traits should be short, epic-sounding attributes (e.g., "Binary Sage", "Loop Breaker", "Greedy Tactician").
Title should be an epic character title based on their strongest skills.

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{{"traits": ["trait1", "trait2"], "title": "Epic Title Here"}}

If no new title is warranted, use null for title.
Make traits unique and not duplicate existing ones."""

            response = self.client.models.generate_content(
                model="gemini-2.5-flash-preview-05-20",
                contents=prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=150,
                    temperature=0.8,
                ),
            )

            response_text = response.text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            result = json.loads(response_text)
            new_traits = result.get("traits", [])
            new_title = result.get("title")

            unique_traits = [t for t in new_traits if t not in current_traits]

            return unique_traits[:2], new_title

        except Exception as e:
            print(f"Error generating traits: {e}")
            return self._generate_fallback_traits_and_title(current_level, solved_count)

    def _generate_fallback_traits_and_title(
        self, current_level: int, solved_count: int
    ) -> Tuple[List[str], Optional[str]]:
        trait_pool = [
            "Algorithm Adept",
            "Code Warrior",
            "Binary Sage",
            "Loop Master",
            "Recursion Wizard",
            "Data Whisperer",
            "Stack Slayer",
            "Graph Navigator",
            "Dynamic Dynamo",
            "Greedy Genius",
            "Divide Conqueror",
            "Search Sentinel",
            "Sort Sorcerer",
            "Tree Tamer",
            "Hash Hero",
        ]

        title_pool = [
            "Rising Coder",
            "Code Apprentice",
            "Algorithm Knight",
            "Binary Baron",
            "Data Duke",
            "Logic Lord",
            "Syntax Sovereign",
            "Algorithm Archmage",
            "Code Champion",
            "Master of Recursion",
        ]

        new_traits = random.sample(trait_pool, min(2, len(trait_pool)))

        new_title = None
        if solved_count == 4:
            title_index = min(current_level // 10, len(title_pool) - 1)
            new_title = title_pool[title_index]

        return new_traits, new_title

    @staticmethod
    def get_all_tags() -> List[str]:
        try:
            with open(PROBLEMS_FILE, "r") as f:
                data = json.load(f)
                tags = set()
                for problem in data.get("problems", []):
                    tags.update(problem.get("tags", []))
                return sorted(list(tags))
        except FileNotFoundError:
            return []
