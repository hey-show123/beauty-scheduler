from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional
from enum import Enum
from .staff import ServiceType, SkillLevel

class BookingStatus(Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Priority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    VIP = 4

@dataclass
class Service:
    service_type: ServiceType
    duration_minutes: int
    required_skill_level: SkillLevel
    price: float
    setup_time_minutes: int = 0  # 準備時間
    cleanup_time_minutes: int = 0  # 片付け時間

@dataclass
class Customer:
    id: str
    name: str
    phone: str
    email: str
    priority: Priority = Priority.NORMAL
    preferred_staff_ids: List[str] = None
    notes: str = ""
    
    def __post_init__(self):
        if self.preferred_staff_ids is None:
            self.preferred_staff_ids = []

@dataclass
class Booking:
    id: str
    customer: Customer
    services: List[Service]
    scheduled_start: datetime
    status: BookingStatus = BookingStatus.SCHEDULED
    assigned_staff_id: Optional[str] = None
    notes: str = ""
    is_flexible_time: bool = False  # 時間調整可能か
    latest_acceptable_start: Optional[datetime] = None
    
    @property
    def total_duration(self) -> timedelta:
        total_minutes = sum(
            service.duration_minutes + service.setup_time_minutes + service.cleanup_time_minutes
            for service in self.services
        )
        return timedelta(minutes=total_minutes)
    
    @property
    def estimated_end_time(self) -> datetime:
        return self.scheduled_start + self.total_duration
    
    def requires_skill_level(self, service_type: ServiceType) -> Optional[SkillLevel]:
        for service in self.services:
            if service.service_type == service_type:
                return service.required_skill_level
        return None
    
    def needs_service_type(self, service_type: ServiceType) -> bool:
        return any(service.service_type == service_type for service in self.services)