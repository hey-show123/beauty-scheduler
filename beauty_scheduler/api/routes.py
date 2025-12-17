from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from datetime import datetime, time
from pydantic import BaseModel

from ..models.staff import Staff, Skill, Availability, ServiceType, SkillLevel
from ..models.booking import Booking, Service, Customer, Priority
from ..models.constraints import SalonConstraints, SchedulingConstraints, OptimizationObjectives
from ..optimizer.schedule_optimizer import BeautySchedulerOptimizer

router = APIRouter()

# Pydanticモデル for API
class StaffRequest(BaseModel):
    name: str
    skills: List[Dict]
    availability: List[Dict]
    hourly_rate: float
    max_hours_per_day: int = 8

class BookingRequest(BaseModel):
    customer_name: str
    customer_phone: str
    services: List[Dict]
    scheduled_start: datetime
    priority: str = "NORMAL"
    preferred_staff_ids: List[str] = []

class ScheduleOptimizationRequest(BaseModel):
    schedule_date: datetime
    staff_ids: List[str] = []
    booking_ids: List[str] = []

# 仮想データストレージ（本来はデータベース）
staff_db: Dict[str, Staff] = {}
booking_db: Dict[str, Booking] = {}

@router.post("/staff/", response_model=Dict[str, str])
async def create_staff(staff_request: StaffRequest):
    """スタッフを作成"""
    staff_id = f"staff_{len(staff_db) + 1}"
    
    skills = []
    for skill_data in staff_request.skills:
        skill = Skill(
            service_type=ServiceType(skill_data["service_type"]),
            level=SkillLevel(skill_data["level"]),
            years_experience=skill_data.get("years_experience", 0)
        )
        skills.append(skill)
    
    availability = []
    for avail_data in staff_request.availability:
        avail = Availability(
            day_of_week=avail_data["day_of_week"],
            start_time=time.fromisoformat(avail_data["start_time"]),
            end_time=time.fromisoformat(avail_data["end_time"]),
            is_preferred=avail_data.get("is_preferred", False)
        )
        availability.append(avail)
    
    staff = Staff(
        id=staff_id,
        name=staff_request.name,
        skills=skills,
        availability=availability,
        hourly_rate=staff_request.hourly_rate,
        max_hours_per_day=staff_request.max_hours_per_day
    )
    
    staff_db[staff_id] = staff
    return {"staff_id": staff_id, "message": "スタッフが正常に作成されました"}

@router.get("/staff/", response_model=List[Dict])
async def get_all_staff():
    """全スタッフを取得"""
    return [
        {
            "id": staff.id,
            "name": staff.name,
            "skills": [{"service_type": s.service_type.value, "level": s.level.value} for s in staff.skills],
            "hourly_rate": staff.hourly_rate
        }
        for staff in staff_db.values()
    ]

@router.get("/staff/{staff_id}", response_model=Dict)
async def get_staff(staff_id: str):
    """特定のスタッフを取得"""
    if staff_id not in staff_db:
        raise HTTPException(status_code=404, detail="スタッフが見つかりません")
    
    staff = staff_db[staff_id]
    return {
        "id": staff.id,
        "name": staff.name,
        "skills": [{"service_type": s.service_type.value, "level": s.level.value} for s in staff.skills],
        "availability": [
            {
                "day_of_week": a.day_of_week,
                "start_time": a.start_time.isoformat(),
                "end_time": a.end_time.isoformat(),
                "is_preferred": a.is_preferred
            }
            for a in staff.availability
        ],
        "hourly_rate": staff.hourly_rate,
        "max_hours_per_day": staff.max_hours_per_day
    }

@router.post("/bookings/", response_model=Dict[str, str])
async def create_booking(booking_request: BookingRequest):
    """予約を作成"""
    booking_id = f"booking_{len(booking_db) + 1}"
    customer_id = f"customer_{len(booking_db) + 1}"
    
    customer = Customer(
        id=customer_id,
        name=booking_request.customer_name,
        phone=booking_request.customer_phone,
        email="",  # メール未実装
        priority=Priority[booking_request.priority],
        preferred_staff_ids=booking_request.preferred_staff_ids
    )
    
    services = []
    for service_data in booking_request.services:
        service = Service(
            service_type=ServiceType(service_data["service_type"]),
            duration_minutes=service_data["duration_minutes"],
            required_skill_level=SkillLevel(service_data["required_skill_level"]),
            price=service_data["price"]
        )
        services.append(service)
    
    booking = Booking(
        id=booking_id,
        customer=customer,
        services=services,
        scheduled_start=booking_request.scheduled_start
    )
    
    booking_db[booking_id] = booking
    return {"booking_id": booking_id, "message": "予約が正常に作成されました"}

@router.get("/bookings/", response_model=List[Dict])
async def get_all_bookings():
    """全予約を取得"""
    return [
        {
            "id": booking.id,
            "customer_name": booking.customer.name,
            "services": [s.service_type.value for s in booking.services],
            "scheduled_start": booking.scheduled_start.isoformat(),
            "status": booking.status.value,
            "assigned_staff_id": booking.assigned_staff_id
        }
        for booking in booking_db.values()
    ]

@router.post("/optimize-schedule/", response_model=Dict)
async def optimize_schedule(request: ScheduleOptimizationRequest):
    """スケジュールを最適化"""
    try:
        # 制約条件の設定
        salon_constraints = SalonConstraints(
            operating_hours={
                0: (time(9, 0), time(18, 0)),  # 月曜日
                1: (time(9, 0), time(18, 0)),  # 火曜日
                2: (time(9, 0), time(18, 0)),  # 水曜日
                3: (time(9, 0), time(18, 0)),  # 木曜日
                4: (time(9, 0), time(19, 0)),  # 金曜日
                5: (time(8, 0), time(17, 0)),  # 土曜日
                6: (time(10, 0), time(16, 0)), # 日曜日
            },
            max_staff_count=5,
            min_staff_count=2
        )
        
        scheduling_constraints = SchedulingConstraints()
        objectives = OptimizationObjectives()
        objectives.normalize_weights()
        
        # 最適化器の初期化
        optimizer = BeautySchedulerOptimizer(
            salon_constraints, scheduling_constraints, objectives
        )
        
        # スタッフと予約のリストを取得
        staff_list = list(staff_db.values()) if not request.staff_ids else [
            staff_db[sid] for sid in request.staff_ids if sid in staff_db
        ]
        
        booking_list = list(booking_db.values()) if not request.booking_ids else [
            booking_db[bid] for bid in request.booking_ids if bid in booking_db
        ]
        
        if not staff_list:
            raise HTTPException(status_code=400, detail="有効なスタッフが見つかりません")
        
        if not booking_list:
            raise HTTPException(status_code=400, detail="有効な予約が見つかりません")
        
        # 最適化実行
        result = optimizer.optimize_schedule(staff_list, booking_list, request.schedule_date)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"最適化エラー: {str(e)}")

@router.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "message": "Beauty Scheduler API is running"}

@router.get("/stats")
async def get_stats():
    """統計情報を取得"""
    return {
        "total_staff": len(staff_db),
        "total_bookings": len(booking_db),
        "service_types": [service_type.value for service_type in ServiceType],
        "skill_levels": [skill_level.value for skill_level in SkillLevel]
    }