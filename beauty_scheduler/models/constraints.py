from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, time, timedelta

@dataclass
class SalonConstraints:
    """美容室全体の制約条件"""
    operating_hours: Dict[int, tuple]  # 曜日別営業時間 {0: (time(9,0), time(18,0))}
    max_staff_count: int = 10
    min_staff_count: int = 2
    lunch_break_start: time = time(12, 0)
    lunch_break_duration: timedelta = timedelta(hours=1)
    equipment_constraints: Dict[str, int] = None  # 設備制限 {"color_station": 3, "shampoo_station": 2}
    
    def __post_init__(self):
        if self.equipment_constraints is None:
            self.equipment_constraints = {}

@dataclass
class SchedulingConstraints:
    """スケジューリング制約"""
    max_customer_wait_time: timedelta = timedelta(minutes=15)  # 最大待ち時間
    buffer_time_between_bookings: timedelta = timedelta(minutes=10)  # 予約間の余裕時間
    staff_break_frequency: timedelta = timedelta(hours=4)  # 休憩頻度
    min_staff_break_duration: timedelta = timedelta(minutes=15)  # 最小休憩時間
    max_consecutive_bookings: int = 5  # 連続予約数制限
    allow_overtime: bool = False  # 残業許可
    overtime_premium_rate: float = 1.5  # 残業代率
    
@dataclass
class OptimizationObjectives:
    """最適化目標の重み"""
    customer_satisfaction_weight: float = 0.4  # 顧客満足度
    staff_utilization_weight: float = 0.3  # スタッフ稼働率
    cost_minimization_weight: float = 0.2  # コスト削減
    schedule_stability_weight: float = 0.1  # スケジュール安定性
    
    def normalize_weights(self):
        total = (self.customer_satisfaction_weight + 
                self.staff_utilization_weight + 
                self.cost_minimization_weight + 
                self.schedule_stability_weight)
        
        self.customer_satisfaction_weight /= total
        self.staff_utilization_weight /= total
        self.cost_minimization_weight /= total
        self.schedule_stability_weight /= total