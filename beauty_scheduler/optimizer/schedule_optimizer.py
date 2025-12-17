from ortools.sat.python import cp_model
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, time
from ..models.staff import Staff, ServiceType, SkillLevel
from ..models.booking import Booking, Service, Customer
from ..models.constraints import SalonConstraints, SchedulingConstraints, OptimizationObjectives

class BeautySchedulerOptimizer:
    def __init__(self, salon_constraints: SalonConstraints, 
                 scheduling_constraints: SchedulingConstraints,
                 objectives: OptimizationObjectives):
        self.salon_constraints = salon_constraints
        self.scheduling_constraints = scheduling_constraints
        self.objectives = objectives
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        
    def optimize_schedule(self, 
                         staff_list: List[Staff],
                         bookings: List[Booking],
                         schedule_date: datetime) -> Dict:
        """メインの最適化関数"""
        
        # 時間スロットを15分単位で分割
        time_slots = self._generate_time_slots(schedule_date)
        
        # 変数の定義
        assignment_vars = {}
        staff_schedule_vars = {}
        
        # スタッフ-予約の割り当て変数
        for booking in bookings:
            for staff in staff_list:
                if self._can_staff_handle_booking(staff, booking):
                    for slot in time_slots:
                        var_name = f"assign|{booking.id}|{staff.id}|{slot}"
                        assignment_vars[var_name] = self.model.NewBoolVar(var_name)
        
        # スタッフのスケジュール変数
        for staff in staff_list:
            for slot in time_slots:
                var_name = f"staff_{staff.id}_slot_{slot}"
                staff_schedule_vars[var_name] = self.model.NewBoolVar(var_name)
        
        # 制約条件を追加
        self._add_booking_constraints(assignment_vars, bookings, staff_list, time_slots)
        self._add_staff_constraints(staff_schedule_vars, assignment_vars, staff_list, time_slots)
        self._add_salon_constraints(assignment_vars, staff_schedule_vars, staff_list, time_slots)
        
        # 目的関数の設定
        objective_expr = self._create_objective_function(assignment_vars, staff_schedule_vars, 
                                                        bookings, staff_list, time_slots)
        self.model.Maximize(objective_expr)
        
        # 求解
        status = self.solver.Solve(self.model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            return self._extract_solution(assignment_vars, staff_schedule_vars, 
                                        bookings, staff_list, time_slots)
        else:
            return {"status": "INFEASIBLE", "message": "最適解が見つかりませんでした"}
    
    def _generate_time_slots(self, schedule_date: datetime) -> List[int]:
        """15分単位のタイムスロットを生成"""
        day_of_week = schedule_date.weekday()
        if day_of_week not in self.salon_constraints.operating_hours:
            return []
        
        start_time, end_time = self.salon_constraints.operating_hours[day_of_week]
        slots = []
        
        current_time = datetime.combine(schedule_date.date(), start_time)
        end_datetime = datetime.combine(schedule_date.date(), end_time)
        
        slot_id = 0
        while current_time < end_datetime:
            slots.append(slot_id)
            current_time += timedelta(minutes=15)
            slot_id += 1
        
        return slots
    
    def _can_staff_handle_booking(self, staff: Staff, booking: Booking) -> bool:
        """スタッフが予約を処理できるかチェック"""
        for service in booking.services:
            if not staff.can_perform_service(service.service_type, service.required_skill_level):
                return False
        return True
    
    def _add_booking_constraints(self, assignment_vars: Dict, bookings: List[Booking], 
                               staff_list: List[Staff], time_slots: List[int]):
        """予約関連の制約を追加"""
        for booking in bookings:
            # 各予約は必ず1人のスタッフに1つの時間に割り当てられる
            booking_assignments = []
            for staff in staff_list:
                for slot in time_slots:
                    var_name = f"assign|{booking.id}|{staff.id}|{slot}"
                    if var_name in assignment_vars:
                        booking_assignments.append(assignment_vars[var_name])
            
            if booking_assignments:
                self.model.Add(sum(booking_assignments) == 1)
    
    def _add_staff_constraints(self, staff_schedule_vars: Dict, assignment_vars: Dict,
                             staff_list: List[Staff], time_slots: List[int]):
        """スタッフ関連の制約を追加"""
        for staff in staff_list:
            # 同時に複数の予約を担当できない
            for slot in time_slots:
                slot_assignments = []
                for var_name in assignment_vars.keys():
                    if f"|{staff.id}|{slot}" in var_name:
                        slot_assignments.append(assignment_vars[var_name])
                
                if slot_assignments:
                    self.model.Add(sum(slot_assignments) <= 1)
            
            # 連続勤務時間制限
            self._add_consecutive_work_constraint(staff, assignment_vars, time_slots)
    
    def _add_salon_constraints(self, assignment_vars: Dict, staff_schedule_vars: Dict,
                             staff_list: List[Staff], time_slots: List[int]):
        """サロン全体の制約を追加"""
        # 最小・最大スタッフ数制約
        for slot in time_slots:
            working_staff = []
            for staff in staff_list:
                var_name = f"staff_{staff.id}_slot_{slot}"
                if var_name in staff_schedule_vars:
                    working_staff.append(staff_schedule_vars[var_name])
            
            if working_staff:
                self.model.Add(sum(working_staff) >= self.salon_constraints.min_staff_count)
                self.model.Add(sum(working_staff) <= self.salon_constraints.max_staff_count)
    
    def _add_consecutive_work_constraint(self, staff: Staff, assignment_vars: Dict, 
                                       time_slots: List[int]):
        """連続勤務時間制限を追加"""
        consecutive_limit_slots = staff.consecutive_work_limit * 4  # 4スロット = 1時間
        
        for start_slot in range(len(time_slots) - consecutive_limit_slots):
            consecutive_vars = []
            for i in range(consecutive_limit_slots + 1):
                slot = time_slots[start_slot + i]
                for var_name in assignment_vars:
                    if f"_{staff.id}_{slot}" in var_name:
                        consecutive_vars.append(assignment_vars[var_name])
            
            if consecutive_vars:
                self.model.Add(sum(consecutive_vars) <= consecutive_limit_slots)
    
    def _create_objective_function(self, assignment_vars: Dict, staff_schedule_vars: Dict,
                                 bookings: List[Booking], staff_list: List[Staff], 
                                 time_slots: List[int]) -> cp_model.LinearExpr:
        """目的関数を作成"""
        objective_terms = []
        
        # 顧客満足度: 希望スタッフとの組み合わせ
        for booking in bookings:
            for preferred_staff_id in booking.customer.preferred_staff_ids:
                for staff in staff_list:
                    if staff.id == preferred_staff_id:
                        for slot in time_slots:
                            var_name = f"assign|{booking.id}|{staff.id}|{slot}"
                            if var_name in assignment_vars:
                                weight = int(self.objectives.customer_satisfaction_weight * 100)
                                objective_terms.append(weight * assignment_vars[var_name])
        
        # スタッフ稼働率の最大化
        for staff in staff_list:
            for slot in time_slots:
                var_name = f"staff_{staff.id}_slot_{slot}"
                if var_name in staff_schedule_vars:
                    weight = int(self.objectives.staff_utilization_weight * 10)
                    objective_terms.append(weight * staff_schedule_vars[var_name])
        
        return sum(objective_terms) if objective_terms else 0
    
    def _extract_solution(self, assignment_vars: Dict, staff_schedule_vars: Dict,
                         bookings: List[Booking], staff_list: List[Staff], 
                         time_slots: List[int]) -> Dict:
        """解を抽出"""
        schedule = []
        
        for var_name, var in assignment_vars.items():
            if self.solver.Value(var) == 1:
                # var_name format: "assign|booking_id|staff_id|slot"
                parts = var_name.split('|')
                if len(parts) >= 4:
                    try:
                        booking_id = parts[1]
                        staff_id = parts[2]
                        slot_id = int(parts[3])
                        
                        booking = next((b for b in bookings if b.id == booking_id), None)
                        staff_member = next((s for s in staff_list if s.id == staff_id), None)
                        
                        if booking and staff_member:
                            schedule.append({
                                "booking_id": booking_id,
                                "staff_id": staff_id,
                                "staff_name": staff_member.name,
                                "customer_name": booking.customer.name,
                                "services": [s.service_type.value for s in booking.services],
                                "start_slot": slot_id,
                                "duration_slots": int(booking.total_duration.total_seconds() // 900)  # 15分単位
                            })
                    except (ValueError, IndexError) as e:
                        print(f"Warning: Failed to parse variable {var_name}: {e}")
                        continue
        
        return {
            "status": "OPTIMAL" if schedule else "INFEASIBLE",
            "schedule": schedule,
            "solver_stats": {
                "solve_time": self.solver.WallTime(),
                "objective_value": self.solver.ObjectiveValue() if schedule else 0
            }
        }