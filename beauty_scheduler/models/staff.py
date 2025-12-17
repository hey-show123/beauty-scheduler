from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional
from datetime import datetime, time

class SkillLevel(Enum):
    BEGINNER = 1
    INTERMEDIATE = 2
    ADVANCED = 3
    EXPERT = 4

class ServiceType(Enum):
    CUT = "cut"
    COLOR = "color"
    PERM = "perm"
    TREATMENT = "treatment"
    STYLING = "styling"
    FACIAL = "facial"

@dataclass
class Skill:
    service_type: ServiceType
    level: SkillLevel
    certification_date: Optional[datetime] = None
    years_experience: int = 0

@dataclass
class Availability:
    day_of_week: int  # 0=月曜, 6=日曜
    start_time: time
    end_time: time
    is_preferred: bool = False

@dataclass
class Staff:
    id: str
    name: str
    skills: List[Skill]
    availability: List[Availability]
    hourly_rate: float
    max_hours_per_day: int = 8
    max_hours_per_week: int = 40
    min_break_minutes: int = 30  # 最低休憩時間
    consecutive_work_limit: int = 4  # 連続勤務時間制限
    preferred_customers: List[str] = None
    
    def __post_init__(self):
        if self.preferred_customers is None:
            self.preferred_customers = []
    
    def get_skill_level(self, service_type: ServiceType) -> Optional[SkillLevel]:
        for skill in self.skills:
            if skill.service_type == service_type:
                return skill.level
        return None
    
    def can_perform_service(self, service_type: ServiceType, required_level: SkillLevel = SkillLevel.BEGINNER) -> bool:
        skill_level = self.get_skill_level(service_type)
        if skill_level is None:
            return False
        return skill_level.value >= required_level.value