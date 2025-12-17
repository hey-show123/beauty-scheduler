# 🌟 Beauty Scheduler - 完全版システムガイド

Google OR-Toolsを活用した美容業界向けの統合スケジューリングシステムです。バックエンドAPI + フロントエンドWebアプリケーションで構成されています。

## 📋 システム全体概要

### 🏗 アーキテクチャ

```
Beauty Scheduler System
├── Backend (Python + FastAPI + OR-Tools)
│   ├── beauty_scheduler/
│   │   ├── models/          # データモデル
│   │   ├── optimizer/       # 最適化エンジン
│   │   └── api/            # REST API
│   ├── main.py             # API サーバー
│   └── example_usage.py    # デモ実行
│
└── Frontend (React + TypeScript + MUI)
    ├── src/
    │   ├── components/      # UIコンポーネント
    │   ├── pages/          # 画面
    │   ├── services/       # API通信
    │   └── types/          # 型定義
    └── public/             # 静的ファイル
```

## 🚀 完全セットアップガイド

### 1. 環境準備

#### 必要要件
- Python 3.8+
- Node.js 16+
- npm または yarn

#### リポジトリクローン
```bash
git clone <repository-url>
cd "OR -Tools"
```

### 2. バックエンド セットアップ

```bash
# Python依存関係インストール
pip install -r requirements.txt

# API サーバー起動
python main.py
```

APIが http://localhost:8000 で起動します。

#### バックエンド確認
```bash
# ヘルスチェック
curl http://localhost:8000/api/v1/health

# デモ実行
python example_usage.py

# テスト実行
python test_beauty_scheduler.py
```

### 3. フロントエンド セットアップ

```bash
# フロントエンドディレクトリに移動
cd frontend

# Node.js依存関係インストール
npm install

# 開発サーバー起動
npm start
```

フロントエンドが http://localhost:3000 で起動します。

## 🎯 主要機能詳細

### 📊 ダッシュボード
- **システム統計**: スタッフ数、予約数、サービス種類の表示
- **クイックアクション**: 各機能への直接アクセス
- **システム情報**: 利用可能サービス、スキルレベル一覧

### 👥 スタッフ管理
- **スタッフ登録**: 基本情報、時給、最大勤務時間
- **スキル管理**: サービス種類別のスキルレベル設定
- **勤務可能時間**: 曜日別の勤務時間設定
- **一覧・編集**: テーブル形式でのスタッフ管理

### 📅 予約管理  
- **顧客情報**: 名前、電話番号、メール、優先度
- **サービス選択**: 複数サービス組み合わせ対応
- **希望スタッフ**: 複数スタッフ指定可能
- **予約統計**: 日別予約数、VIP予約数の表示

### 🎯 スケジュール最適化
- **ステップガイド**: 対象日→スタッフ→予約の段階的設定
- **制約条件**: スタッフスキル、勤務時間、設備制限
- **最適化目標**: 顧客満足度、稼働率、コスト、安定性
- **結果表示**: 最適化統計、割当詳細

### 📋 スケジュール表示
- **複数ビュー**: タイムライン・グリッド表示切替
- **フィルタ機能**: 日付・スタッフ別フィルタ
- **エクスポート**: CSV出力、印刷機能
- **稼働統計**: スタッフ別稼働時間・予約数

## 🔧 設定・カスタマイズ

### バックエンド設定

#### 1. サロン制約設定
```python
salon_constraints = SalonConstraints(
    operating_hours={
        0: (time(9, 0), time(18, 0)),  # 月曜日
        5: (time(8, 0), time(19, 0)),  # 土曜日
    },
    max_staff_count=5,
    min_staff_count=2,
    equipment_constraints={"color_station": 2}
)
```

#### 2. 最適化目標重み調整
```python
objectives = OptimizationObjectives(
    customer_satisfaction_weight=0.35,  # 顧客満足度重視
    staff_utilization_weight=0.25,     # 稼働率
    cost_minimization_weight=0.25,     # コスト
    schedule_stability_weight=0.15     # 安定性
)
```

### フロントエンド設定

#### 1. API エンドポイント
```typescript
// src/services/api.ts
const API_BASE_URL = '/api/v1';  // 開発時はproxy使用
```

#### 2. テーマカスタマイズ
```typescript
// src/index.tsx
const theme = createTheme({
  palette: {
    primary: { main: '#2E7D32' },    # プライマリカラー
    secondary: { main: '#FF6B6B' },  # セカンダリカラー
  },
});
```

## 📱 画面操作ガイド

### 1. 初期データ準備

#### スタッフ登録例
1. スタッフ管理 → スタッフ追加
2. 基本情報入力:
   - 名前: "田中美咲"
   - 時給: 2500円
   - 最大勤務時間: 8時間/日
3. スキル追加:
   - カット: エキスパート(8年経験)
   - カラー: 上級(6年経験)
4. 勤務可能時間設定:
   - 月-金: 9:00-18:00

#### 予約作成例  
1. 予約管理 → 予約追加
2. 顧客情報:
   - 名前: "鈴木太郎"
   - 電話: "090-1234-5678"
   - 優先度: VIP
3. サービス選択:
   - カット: 60分, 上級レベル, 4000円
   - カラー: 120分, 上級レベル, 8000円
4. 予約日時: 2024-01-15 10:00

### 2. スケジュール最適化実行

1. スケジュール最適化ページ
2. 対象日選択: 2024-01-15
3. スタッフ選択: 全スタッフまたは特定スタッフ
4. 予約選択: 対象予約を選択
5. 最適化実行 → 結果確認

### 3. スケジュール確認

1. スケジュール表示ページ
2. フィルタ設定: 日付・スタッフ
3. ビューモード選択: タイムライン/グリッド
4. 必要に応じてCSV出力・印刷

## 🎮 API使用例

### スタッフ作成
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
  "hourly_rate": 2500,
  "max_hours_per_day": 8
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
  "schedule_date": "2024-01-15T00:00:00",
  "staff_ids": [],
  "booking_ids": []
}'
```

## 📊 パフォーマンス指標

### バックエンド
- **小規模**: 3-5名スタッフ, 10-15予約 → 1秒以下
- **中規模**: 6-10名スタッフ, 20-30予約 → 2-5秒  
- **大規模**: 11名以上, 30予約以上 → 5-15秒

### フロントエンド
- **初期表示**: 1-2秒
- **画面遷移**: 0.5秒以下
- **API通信**: 1-3秒（バックエンド処理時間依存）

## 🔒 セキュリティ・本番運用

### セキュリティ対策
- 入力値バリデーション
- SQLインジェクション対策
- CORS設定
- 機密情報ログ出力禁止

### 本番デプロイ例

#### バックエンド (Docker)
```dockerfile
FROM python:3.9-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### フロントエンド (Nginx)
```bash
npm run build
# buildディレクトリをNginxで配信
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. OR-Toolsインストールエラー
```bash
# 解決策
pip install --upgrade pip
pip install ortools
```

#### 2. フロントエンドAPIエラー
- バックエンドサーバーの起動確認
- CORSエラーの場合はバックエンド設定確認

#### 3. 最適化で解が見つからない
- 制約条件が厳しすぎる可能性
- スタッフのスキルと予約要求の不一致を確認

#### 4. 画面表示エラー
```bash
# キャッシュクリア
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 🔄 開発・拡張

### 新機能追加手順

#### バックエンド
1. モデル定義 (`models/`)
2. API エンドポイント追加 (`api/routes.py`)
3. 最適化ロジック更新 (`optimizer/`)
4. テスト追加

#### フロントエンド  
1. 型定義追加 (`types/index.ts`)
2. API クライアント更新 (`services/api.ts`)
3. コンポーネント・画面作成 (`pages/`, `components/`)
4. ルーティング追加 (`App.tsx`)

### カスタマイズポイント
- **サービス種類**: `ServiceType` enum
- **スキルレベル**: `SkillLevel` enum  
- **制約条件**: `SalonConstraints` クラス
- **最適化目標**: `OptimizationObjectives` クラス

## 📚 技術詳細

### バックエンド技術スタック
- **Python 3.8+**: メイン言語
- **FastAPI**: Web フレームワーク
- **OR-Tools**: 最適化エンジン (CP-SAT Solver)
- **Pydantic**: データバリデーション
- **Uvicorn**: ASGI サーバー

### フロントエンド技術スタック
- **React 18**: UIライブラリ
- **TypeScript**: 型安全性
- **Material-UI**: UIコンポーネント
- **React Hook Form**: フォーム管理
- **Axios**: HTTP通信
- **Date-fns**: 日付処理

## 📞 サポート・コミュニティ

- **Issues**: GitHubリポジトリのIssue
- **Documentation**: READMEファイル
- **Email**: support@beauty-scheduler.com

---

**🌟 このシステムが美容業界のデジタル変革に貢献し、効率的で顧客満足度の高いサロン運営を実現できることを願っています！**