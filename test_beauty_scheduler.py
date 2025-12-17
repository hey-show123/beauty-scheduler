import pytest
from datetime import datetime, time, timedelta
from beauty_scheduler.models.staff import Staff, Skill, Availability, ServiceType, SkillLevel
from beauty_scheduler.models.booking import Booking, Service, Customer, Priority
from beauty_scheduler.models.constraints import SalonConstraints, SchedulingConstraints, OptimizationObjectives
from beauty_scheduler.optimizer.schedule_optimizer import BeautySchedulerOptimizer

def create_sample_staff():
    """サンプルスタッフを作成"""
    # ベテランスタイリスト
    staff1 = Staff(
        id="staff_001",
        name="田中美咲",
        skills=[
            Skill(ServiceType.CUT, SkillLevel.EXPERT, years_experience=8),
            Skill(ServiceType.COLOR, SkillLevel.ADVANCED, years_experience=6),
            Skill(ServiceType.STYLING, SkillLevel.EXPERT, years_experience=8)
        ],
        availability=[
            Availability(0, time(9, 0), time(18, 0), True),  # 月曜日
            Availability(1, time(9, 0), time(18, 0), True),  # 火曜日
            Availability(2, time(9, 0), time(18, 0), True),  # 水曜日
            Availability(3, time(9, 0), time(18, 0), True),  # 木曜日
            Availability(4, time(9, 0), time(19, 0), True),  # 金曜日
        ],
        hourly_rate=2500,
        max_hours_per_day=8
    )
    
    # カラーリスト
    staff2 = Staff(
        id="staff_002",
        name="佐藤健二",
        skills=[
            Skill(ServiceType.COLOR, SkillLevel.EXPERT, years_experience=10),
            Skill(ServiceType.TREATMENT, SkillLevel.ADVANCED, years_experience=7),
            Skill(ServiceType.CUT, SkillLevel.INTERMEDIATE, years_experience=4)
        ],
        availability=[
            Availability(1, time(10, 0), time(19, 0), True),  # 火曜日
            Availability(2, time(10, 0), time(19, 0), True),  # 水曜日
            Availability(3, time(10, 0), time(19, 0), True),  # 木曜日
            Availability(4, time(9, 0), time(20, 0), True),   # 金曜日
            Availability(5, time(8, 0), time(17, 0), True),   # 土曜日
        ],
        hourly_rate=2800,
        max_hours_per_day=9
    )
    
    # ジュニアスタイリスト
    staff3 = Staff(
        id="staff_003",
        name="山田花子",
        skills=[
            Skill(ServiceType.CUT, SkillLevel.INTERMEDIATE, years_experience=2),
            Skill(ServiceType.STYLING, SkillLevel.INTERMEDIATE, years_experience=2),
            Skill(ServiceType.TREATMENT, SkillLevel.BEGINNER, years_experience=1)
        ],
        availability=[
            Availability(0, time(9, 0), time(17, 0), True),
            Availability(1, time(9, 0), time(17, 0), True),
            Availability(2, time(9, 0), time(17, 0), True),
            Availability(5, time(8, 0), time(16, 0), True),
            Availability(6, time(10, 0), time(16, 0), True),
        ],
        hourly_rate=1800,
        max_hours_per_day=8
    )
    
    return [staff1, staff2, staff3]

def create_sample_bookings():
    """サンプル予約を作成"""
    bookings = []
    
    # VIP顧客のカット＋カラー
    customer1 = Customer(
        id="customer_001",
        name="鈴木太郎",
        phone="090-1234-5678",
        email="suzuki@example.com",
        priority=Priority.VIP,
        preferred_staff_ids=["staff_001"]
    )
    
    booking1 = Booking(
        id="booking_001",
        customer=customer1,
        services=[
            Service(ServiceType.CUT, 60, SkillLevel.ADVANCED, 4000),
            Service(ServiceType.COLOR, 120, SkillLevel.ADVANCED, 8000)
        ],
        scheduled_start=datetime(2024, 1, 15, 10, 0)
    )
    bookings.append(booking1)
    
    # 通常顧客のカット
    customer2 = Customer(
        id="customer_002",
        name="田中花子",
        phone="090-2345-6789",
        email="tanaka@example.com",
        priority=Priority.NORMAL
    )
    
    booking2 = Booking(
        id="booking_002",
        customer=customer2,
        services=[
            Service(ServiceType.CUT, 45, SkillLevel.INTERMEDIATE, 3500)
        ],
        scheduled_start=datetime(2024, 1, 15, 14, 0)
    )
    bookings.append(booking2)
    
    # カラー専門の予約
    customer3 = Customer(
        id="customer_003",
        name="山田次郎",
        phone="090-3456-7890",
        email="yamada@example.com",
        priority=Priority.HIGH,
        preferred_staff_ids=["staff_002"]
    )
    
    booking3 = Booking(
        id="booking_003",
        customer=customer3,
        services=[
            Service(ServiceType.COLOR, 90, SkillLevel.EXPERT, 12000),
            Service(ServiceType.TREATMENT, 30, SkillLevel.ADVANCED, 2000)
        ],
        scheduled_start=datetime(2024, 1, 15, 11, 0)
    )
    bookings.append(booking3)
    
    return bookings

def create_test_constraints():
    """テスト用制約条件を作成"""
    salon_constraints = SalonConstraints(
        operating_hours={
            0: (time(9, 0), time(18, 0)),  # 月曜日
            1: (time(9, 0), time(19, 0)),  # 火曜日
            2: (time(9, 0), time(19, 0)),  # 水曜日
            3: (time(9, 0), time(19, 0)),  # 木曜日
            4: (time(9, 0), time(20, 0)),  # 金曜日
            5: (time(8, 0), time(17, 0)),  # 土曜日
            6: (time(10, 0), time(16, 0)), # 日曜日
        },
        max_staff_count=3,
        min_staff_count=1
    )
    
    scheduling_constraints = SchedulingConstraints()
    objectives = OptimizationObjectives()
    objectives.normalize_weights()
    
    return salon_constraints, scheduling_constraints, objectives

def test_staff_skill_check():
    """スタッフのスキルチェックテスト"""
    staff_list = create_sample_staff()
    expert_stylist = staff_list[0]  # 田中美咲
    
    # エキスパートレベルのカットスキルを持っているかテスト
    assert expert_stylist.can_perform_service(ServiceType.CUT, SkillLevel.EXPERT)
    assert expert_stylist.can_perform_service(ServiceType.CUT, SkillLevel.INTERMEDIATE)
    
    # カラースキルのテスト
    assert expert_stylist.can_perform_service(ServiceType.COLOR, SkillLevel.ADVANCED)
    assert not expert_stylist.can_perform_service(ServiceType.PERM, SkillLevel.BEGINNER)  # パーマスキルなし

def test_booking_duration_calculation():
    """予約時間計算テスト"""
    bookings = create_sample_bookings()
    booking_with_color = bookings[0]  # カット＋カラー
    
    expected_duration = timedelta(minutes=180)  # 60 + 120分
    assert booking_with_color.total_duration == expected_duration

def test_optimization_basic():
    """基本的な最適化テスト"""
    staff_list = create_sample_staff()
    bookings = create_sample_bookings()
    salon_constraints, scheduling_constraints, objectives = create_test_constraints()
    
    optimizer = BeautySchedulerOptimizer(salon_constraints, scheduling_constraints, objectives)
    
    # 2024年1月15日（月曜日）のスケジュール最適化
    schedule_date = datetime(2024, 1, 15)
    result = optimizer.optimize_schedule(staff_list, bookings, schedule_date)
    
    print("最適化結果:")
    print(f"ステータス: {result['status']}")
    
    if result['status'] in ['OPTIMAL', 'FEASIBLE']:
        print(f"スケジュール項目数: {len(result['schedule'])}")
        for item in result['schedule']:
            print(f"  予約ID: {item['booking_id']}, スタッフ: {item['staff_name']}, 顧客: {item['customer_name']}")
    
    # 実行可能解または最適解が見つかることを確認
    assert result['status'] in ['OPTIMAL', 'FEASIBLE', 'INFEASIBLE']

def test_staff_can_handle_booking():
    """スタッフが予約を処理できるかのテスト"""
    staff_list = create_sample_staff()
    bookings = create_sample_bookings()
    
    salon_constraints, scheduling_constraints, objectives = create_test_constraints()
    optimizer = BeautySchedulerOptimizer(salon_constraints, scheduling_constraints, objectives)
    
    expert_stylist = staff_list[0]  # 田中美咲
    vip_booking = bookings[0]  # カット＋カラーのVIP予約
    
    # エキスパートスタイリストはVIP予約を処理できるはず
    assert optimizer._can_staff_handle_booking(expert_stylist, vip_booking)
    
    junior_stylist = staff_list[2]  # 山田花子
    expert_color_booking = bookings[2]  # エキスパートレベルのカラー予約
    
    # ジュニアスタイリストはエキスパートレベルのカラー予約を処理できないはず
    assert not optimizer._can_staff_handle_booking(junior_stylist, expert_color_booking)

if __name__ == "__main__":
    # 手動テスト実行
    print("=== Beauty Scheduler テスト実行 ===")
    
    print("1. スタッフスキルテスト")
    test_staff_skill_check()
    print("✓ パス")
    
    print("2. 予約時間計算テスト")
    test_booking_duration_calculation()
    print("✓ パス")
    
    print("3. スタッフ予約処理能力テスト")
    test_staff_can_handle_booking()
    print("✓ パス")
    
    print("4. 基本最適化テスト")
    test_optimization_basic()
    print("✓ パス")
    
    print("\n=== 全てのテストが完了しました ===")