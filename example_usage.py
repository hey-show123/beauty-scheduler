#!/usr/bin/env python3
"""
美容室スケジューリングサービスの使用例
"""

import asyncio
import json
from datetime import datetime, time, timedelta
from beauty_scheduler.models.staff import Staff, Skill, Availability, ServiceType, SkillLevel
from beauty_scheduler.models.booking import Booking, Service, Customer, Priority
from beauty_scheduler.models.constraints import SalonConstraints, SchedulingConstraints, OptimizationObjectives
from beauty_scheduler.optimizer.schedule_optimizer import BeautySchedulerOptimizer

def create_real_world_scenario():
    """実際の美容室を想定したシナリオを作成"""
    
    # スタッフの設定
    staff_list = [
        Staff(
            id="staff_001",
            name="店長・田中美咲（トップスタイリスト）",
            skills=[
                Skill(ServiceType.CUT, SkillLevel.EXPERT, years_experience=12),
                Skill(ServiceType.COLOR, SkillLevel.EXPERT, years_experience=10),
                Skill(ServiceType.STYLING, SkillLevel.EXPERT, years_experience=12),
                Skill(ServiceType.TREATMENT, SkillLevel.ADVANCED, years_experience=8)
            ],
            availability=[
                Availability(1, time(10, 0), time(20, 0), True),  # 火曜日
                Availability(2, time(10, 0), time(20, 0), True),  # 水曜日
                Availability(3, time(10, 0), time(20, 0), True),  # 木曜日
                Availability(4, time(10, 0), time(21, 0), True),  # 金曜日
                Availability(5, time(9, 0), time(19, 0), True),   # 土曜日
            ],
            hourly_rate=3500,
            max_hours_per_day=10
        ),
        
        Staff(
            id="staff_002",
            name="佐藤健二（カラーリスト）",
            skills=[
                Skill(ServiceType.COLOR, SkillLevel.EXPERT, years_experience=15),
                Skill(ServiceType.TREATMENT, SkillLevel.EXPERT, years_experience=12),
                Skill(ServiceType.CUT, SkillLevel.INTERMEDIATE, years_experience=6),
                Skill(ServiceType.PERM, SkillLevel.ADVANCED, years_experience=8)
            ],
            availability=[
                Availability(1, time(11, 0), time(20, 0), True),
                Availability(2, time(11, 0), time(20, 0), True),
                Availability(3, time(11, 0), time(20, 0), True),
                Availability(4, time(11, 0), time(21, 0), True),
                Availability(5, time(9, 0), time(18, 0), True),
                Availability(6, time(10, 0), time(17, 0), True),  # 日曜日
            ],
            hourly_rate=3200,
            max_hours_per_day=9
        ),
        
        Staff(
            id="staff_003",
            name="山田花子（スタイリスト）",
            skills=[
                Skill(ServiceType.CUT, SkillLevel.ADVANCED, years_experience=5),
                Skill(ServiceType.STYLING, SkillLevel.ADVANCED, years_experience=5),
                Skill(ServiceType.COLOR, SkillLevel.INTERMEDIATE, years_experience=3),
                Skill(ServiceType.TREATMENT, SkillLevel.INTERMEDIATE, years_experience=2)
            ],
            availability=[
                Availability(0, time(9, 0), time(18, 0), True),  # 月曜日
                Availability(1, time(9, 0), time(18, 0), True),
                Availability(2, time(9, 0), time(18, 0), True),
                Availability(4, time(9, 0), time(19, 0), True),
                Availability(5, time(8, 0), time(17, 0), True),
            ],
            hourly_rate=2300,
            max_hours_per_day=8
        ),
        
        Staff(
            id="staff_004",
            name="鈴木一郎（ジュニアスタイリスト）",
            skills=[
                Skill(ServiceType.CUT, SkillLevel.INTERMEDIATE, years_experience=2),
                Skill(ServiceType.STYLING, SkillLevel.BEGINNER, years_experience=1),
                Skill(ServiceType.TREATMENT, SkillLevel.BEGINNER, years_experience=1)
            ],
            availability=[
                Availability(0, time(9, 0), time(17, 0), True),
                Availability(1, time(9, 0), time(17, 0), True),
                Availability(2, time(9, 0), time(17, 0), True),
                Availability(3, time(9, 0), time(17, 0), True),
                Availability(5, time(9, 0), time(16, 0), True),
                Availability(6, time(10, 0), time(15, 0), True),
            ],
            hourly_rate=1800,
            max_hours_per_day=7
        )
    ]
    
    # 予約リスト（土曜日の忙しい日を想定）
    bookings = [
        Booking(
            id="booking_001",
            customer=Customer(
                id="cust_001", 
                name="VIP常連・高橋様", 
                phone="090-1111-1111", 
                email="takahashi@example.com",
                priority=Priority.VIP,
                preferred_staff_ids=["staff_001"]
            ),
            services=[
                Service(ServiceType.CUT, 90, SkillLevel.EXPERT, 8000),
                Service(ServiceType.COLOR, 150, SkillLevel.EXPERT, 15000),
                Service(ServiceType.STYLING, 30, SkillLevel.EXPERT, 3000)
            ],
            scheduled_start=datetime(2024, 1, 20, 10, 0)  # 土曜日 10:00
        ),
        
        Booking(
            id="booking_002",
            customer=Customer(
                id="cust_002",
                name="新規・田中様",
                phone="090-2222-2222",
                email="tanaka.new@example.com",
                priority=Priority.NORMAL
            ),
            services=[
                Service(ServiceType.CUT, 60, SkillLevel.INTERMEDIATE, 4500)
            ],
            scheduled_start=datetime(2024, 1, 20, 9, 0)
        ),
        
        Booking(
            id="booking_003",
            customer=Customer(
                id="cust_003",
                name="結婚式前・佐藤様",
                phone="090-3333-3333",
                email="sato.bride@example.com",
                priority=Priority.HIGH,
                preferred_staff_ids=["staff_002"]
            ),
            services=[
                Service(ServiceType.COLOR, 120, SkillLevel.EXPERT, 12000),
                Service(ServiceType.TREATMENT, 45, SkillLevel.EXPERT, 4000),
                Service(ServiceType.STYLING, 60, SkillLevel.ADVANCED, 5000)
            ],
            scheduled_start=datetime(2024, 1, 20, 11, 0)
        ),
        
        Booking(
            id="booking_004",
            customer=Customer(
                id="cust_004",
                name="学生・山田様",
                phone="090-4444-4444",
                email="yamada.student@example.com",
                priority=Priority.LOW
            ),
            services=[
                Service(ServiceType.CUT, 45, SkillLevel.BEGINNER, 2800)
            ],
            scheduled_start=datetime(2024, 1, 20, 14, 0)
        ),
        
        Booking(
            id="booking_005",
            customer=Customer(
                id="cust_005",
                name="常連・鈴木様",
                phone="090-5555-5555",
                email="suzuki.regular@example.com",
                priority=Priority.NORMAL,
                preferred_staff_ids=["staff_003"]
            ),
            services=[
                Service(ServiceType.CUT, 75, SkillLevel.ADVANCED, 5500),
                Service(ServiceType.STYLING, 30, SkillLevel.ADVANCED, 2500)
            ],
            scheduled_start=datetime(2024, 1, 20, 13, 0)
        ),
        
        Booking(
            id="booking_006",
            customer=Customer(
                id="cust_006",
                name="パーマ希望・伊藤様",
                phone="090-6666-6666",
                email="ito.perm@example.com",
                priority=Priority.NORMAL,
                preferred_staff_ids=["staff_002"]
            ),
            services=[
                Service(ServiceType.PERM, 180, SkillLevel.ADVANCED, 18000),
                Service(ServiceType.TREATMENT, 30, SkillLevel.INTERMEDIATE, 2500)
            ],
            scheduled_start=datetime(2024, 1, 20, 15, 0)
        )
    ]
    
    return staff_list, bookings

def setup_optimization_parameters():
    """最適化パラメーターの設定"""
    
    # サロン制約
    salon_constraints = SalonConstraints(
        operating_hours={
            0: (time(9, 0), time(18, 0)),   # 月曜日
            1: (time(9, 0), time(20, 0)),   # 火曜日
            2: (time(9, 0), time(20, 0)),   # 水曜日
            3: (time(9, 0), time(20, 0)),   # 木曜日
            4: (time(9, 0), time(21, 0)),   # 金曜日
            5: (time(8, 0), time(19, 0)),   # 土曜日（繁忙日）
            6: (time(10, 0), time(17, 0)),  # 日曜日
        },
        max_staff_count=4,
        min_staff_count=2,
        equipment_constraints={
            "color_station": 2,
            "shampoo_station": 3,
            "styling_chair": 4
        }
    )
    
    # スケジューリング制約
    scheduling_constraints = SchedulingConstraints(
        max_customer_wait_time=timedelta(minutes=20),
        buffer_time_between_bookings=timedelta(minutes=15),
        staff_break_frequency=timedelta(hours=4),
        min_staff_break_duration=timedelta(minutes=30),
        max_consecutive_bookings=6,
        allow_overtime=True,
        overtime_premium_rate=1.5
    )
    
    # 最適化目標
    objectives = OptimizationObjectives(
        customer_satisfaction_weight=0.35,  # 顧客満足度重視
        staff_utilization_weight=0.25,     # スタッフ稼働率
        cost_minimization_weight=0.25,     # コスト最小化
        schedule_stability_weight=0.15     # スケジュール安定性
    )
    objectives.normalize_weights()
    
    return salon_constraints, scheduling_constraints, objectives

def print_schedule_result(result):
    """スケジュール結果を見やすく表示"""
    print("=" * 80)
    print("🌟 美容室スケジュール最適化結果 🌟")
    print("=" * 80)
    
    if result['status'] == 'OPTIMAL':
        print("✅ 最適解が見つかりました！")
    elif result['status'] == 'FEASIBLE':
        print("⚠️  実行可能解が見つかりました")
    else:
        print("❌ 解が見つかりませんでした")
        print(f"理由: {result.get('message', '不明なエラー')}")
        return
    
    print(f"\n📊 最適化統計:")
    if 'solver_stats' in result:
        stats = result['solver_stats']
        print(f"   求解時間: {stats.get('solve_time', 0):.3f}秒")
        print(f"   目的関数値: {stats.get('objective_value', 0)}")
    
    print(f"\n📅 スケジュール詳細 (予約数: {len(result['schedule'])}件):")
    print("-" * 80)
    
    # 時間順にソート
    schedule = sorted(result['schedule'], key=lambda x: x['start_slot'])
    
    for item in schedule:
        duration_hours = item['duration_slots'] * 0.25  # 15分単位なので0.25時間
        start_time = 9.0 + (item['start_slot'] * 0.25)  # 9時スタートと仮定
        end_time = start_time + duration_hours
        
        print(f"🕒 {int(start_time):02d}:{int((start_time % 1) * 60):02d} - "
              f"{int(end_time):02d}:{int((end_time % 1) * 60):02d}")
        print(f"   👤 {item['staff_name']}")
        print(f"   💁 {item['customer_name']}")
        print(f"   ✂️  {', '.join(item['services'])}")
        print(f"   ⏱️  所要時間: {duration_hours:.1f}時間")
        print()

def main():
    """メイン実行関数"""
    print("🌟 美容室スケジューリングシステム - デモンストレーション 🌟\n")
    
    # シナリオ作成
    print("1️⃣ 実際の美容室シナリオを作成中...")
    staff_list, bookings = create_real_world_scenario()
    print(f"   ✅ スタッフ数: {len(staff_list)}名")
    print(f"   ✅ 予約数: {len(bookings)}件")
    
    # パラメーター設定
    print("\n2️⃣ 最適化パラメーターを設定中...")
    salon_constraints, scheduling_constraints, objectives = setup_optimization_parameters()
    print("   ✅ 制約条件設定完了")
    print("   ✅ 最適化目標設定完了")
    
    # 最適化実行
    print("\n3️⃣ スケジュール最適化を実行中...")
    optimizer = BeautySchedulerOptimizer(salon_constraints, scheduling_constraints, objectives)
    
    # 土曜日（2024年1月20日）のスケジュール
    schedule_date = datetime(2024, 1, 20)
    print(f"   📅 対象日: {schedule_date.strftime('%Y年%m月%d日 (%A)')}")
    
    result = optimizer.optimize_schedule(staff_list, bookings, schedule_date)
    
    # 結果表示
    print("\n4️⃣ 結果を表示中...")
    print_schedule_result(result)
    
    # スタッフ別サマリー
    if result['status'] in ['OPTIMAL', 'FEASIBLE']:
        print("\n👥 スタッフ別稼働サマリー:")
        print("-" * 40)
        staff_workload = {}
        for item in result['schedule']:
            staff_id = item['staff_id']
            duration = item['duration_slots'] * 0.25
            if staff_id not in staff_workload:
                staff_workload[staff_id] = {'name': item['staff_name'], 'total_hours': 0, 'bookings': 0}
            staff_workload[staff_id]['total_hours'] += duration
            staff_workload[staff_id]['bookings'] += 1
        
        for staff_id, data in staff_workload.items():
            print(f"👤 {data['name']}")
            print(f"   ⏱️  稼働時間: {data['total_hours']:.1f}時間")
            print(f"   📝 担当予約: {data['bookings']}件")
            print()
    
    print("=" * 80)
    print("🎉 デモンストレーション完了！")
    print("=" * 80)

if __name__ == "__main__":
    main()