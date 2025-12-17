# 🌟 Beauty Scheduler - 美容室スケジューリングシステム

Google OR-Toolsを活用した美容業界向けの最適化スケジューリングサービスです。スタッフのスキル、顧客の要望、サロンの制約条件を考慮して最適なシフト表を自動生成します。

## 📋 機能

### 🎯 主要機能
- **スタッフスキル管理**: カット、カラー、パーマ、トリートメント等のスキルレベル管理
- **予約管理**: 顧客情報、サービス内容、希望時間の管理
- **最適化エンジン**: OR-Toolsによる制約充足問題として最適スケジュールを計算
- **RESTful API**: FastAPIベースのWebAPI提供

### 🛠 技術スタック
- **最適化**: Google OR-Tools (CP-SAT Solver)
- **Web Framework**: FastAPI
- **言語**: Python 3.8+
- **テスト**: pytest

## 🚀 クイックスタート

### 1. 環境構築

```bash
# リポジトリをクローン
git clone <repository-url>
cd OR-Tools

# 依存関係をインストール
pip install -r requirements.txt
```

### 2. 基本的な使用方法

#### サーバー起動
```bash
python main.py
```

APIサーバーが http://localhost:8000 で起動します。

#### デモンストレーション実行
```bash
python example_usage.py
```

実際の美容室を想定したシナリオでスケジュール最適化のデモが実行されます。

### 3. テスト実行
```bash
# pytestでテスト実行
pytest test_beauty_scheduler.py -v

# または直接実行
python test_beauty_scheduler.py
```

## 📊 API使用例

### スタッフ登録
```bash
curl -X POST "http://localhost:8000/api/v1/staff/" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "田中美咲",
       "skills": [
         {"service_type": "cut", "level": 4, "years_experience": 8},
         {"service_type": "color", "level": 3, "years_experience": 6}
       ],
       "availability": [
         {"day_of_week": 0, "start_time": "09:00", "end_time": "18:00", "is_preferred": true}
       ],
       "hourly_rate": 2500
     }'
```

### 予約作成
```bash
curl -X POST "http://localhost:8000/api/v1/bookings/" \
     -H "Content-Type: application/json" \
     -d '{
       "customer_name": "鈴木太郎",
       "customer_phone": "090-1234-5678",
       "services": [
         {"service_type": "cut", "duration_minutes": 60, "required_skill_level": 3, "price": 4000}
       ],
       "scheduled_start": "2024-01-15T10:00:00",
       "priority": "VIP"
     }'
```

### スケジュール最適化
```bash
curl -X POST "http://localhost:8000/api/v1/optimize-schedule/" \
     -H "Content-Type: application/json" \
     -d '{
       "schedule_date": "2024-01-15T00:00:00"
     }'
```

## 🏗 アーキテクチャ

```
beauty_scheduler/
├── models/           # データモデル
│   ├── staff.py     # スタッフ、スキル、可用性
│   ├── booking.py   # 予約、サービス、顧客
│   └── constraints.py # 制約条件、最適化目標
├── optimizer/        # 最適化エンジン
│   └── schedule_optimizer.py # OR-Tools実装
└── api/             # Web API
    └── routes.py    # FastAPI エンドポイント
```

## 🎯 最適化モデル

### 制約条件
- **スタッフスキル制約**: 各サービスに必要なスキルレベルを満たすスタッフのみ担当可能
- **時間制約**: スタッフの勤務可能時間、連続勤務時間制限
- **サロン制約**: 営業時間、最小・最大スタッフ数
- **予約制約**: 各予約は必ず1人のスタッフが担当

### 最適化目標
- **顧客満足度** (35%): 希望スタッフとのマッチング
- **スタッフ稼働率** (25%): 効率的なスタッフ活用
- **コスト最小化** (25%): 人件費の最適化
- **スケジュール安定性** (15%): 変更しやすいスケジュール

## 🔧 設定

### サロン制約設定例
```python
salon_constraints = SalonConstraints(
    operating_hours={
        0: (time(9, 0), time(18, 0)),  # 月曜日
        5: (time(8, 0), time(19, 0)),  # 土曜日（繁忙日）
    },
    max_staff_count=5,
    min_staff_count=2,
    equipment_constraints={"color_station": 2}
)
```

### 最適化目標重み調整例
```python
objectives = OptimizationObjectives(
    customer_satisfaction_weight=0.4,  # 顧客満足度重視
    staff_utilization_weight=0.3,
    cost_minimization_weight=0.2,
    schedule_stability_weight=0.1
)
```

## 📈 パフォーマンス

- **小規模サロン** (3-5名、10-15予約): 通常1秒以下
- **中規模サロン** (6-10名、20-30予約): 2-5秒
- **大規模サロン** (11名以上、30予約以上): 5-15秒

## 🤝 貢献

1. Forkしてブランチを作成
2. 機能追加・バグ修正
3. テストを追加・実行
4. Pull Request作成

## 📄 ライセンス

MIT License

## 🆘 サポート

- Issues: GitHubのIssueページ
- Email: support@beauty-scheduler.com

---

**🌟 このプロジェクトが美容業界のDXに貢献できれば幸いです！**