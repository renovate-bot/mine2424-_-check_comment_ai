# AI Content Moderation System

漫画アプリにおけるユーザー投稿コンテンツのAI監視システムです。テキスト・画像コンテンツをリアルタイムに監視し、不適切な投稿やネタバレなどのリスク投稿を自動検出します。

## 🚀 クイックスタート

### 1. 依存関係のインストール
```bash
# プロジェクトルートで実行
npm run install-deps
```

### 2. 環境設定
```bash
cd backend
cp .env.example .env
# .envファイルのOPENAI_API_KEYを設定（オプション）
```

### 3. アプリケーション起動
```bash
# プロジェクトルートで実行
npm run dev
```

### 4. アクセス
- **管理ダッシュボード**: http://localhost:3000
- **API**: http://localhost:5001

## 📚 ドキュメント
- **API仕様書**: [docs/API.md](docs/API.md)
- **詳細セットアップガイド**: [docs/SETUP.md](docs/SETUP.md)
- **要件仕様書**: [docs/requirements.md](docs/requirements.md)
- **統計分析機能ガイド**: [docs/ANALYTICS_GUIDE.md](docs/ANALYTICS_GUIDE.md)
- **高度検索・フィルタリング機能ガイド**: [docs/SEARCH_FILTER_GUIDE.md](docs/SEARCH_FILTER_GUIDE.md)
- **類似投稿参考表示機能ガイド**: [docs/SIMILAR_POSTS_GUIDE.md](docs/SIMILAR_POSTS_GUIDE.md)
- **クイックAI分析ガイド**: [docs/QUICK_ANALYSIS_GUIDE.md](docs/QUICK_ANALYSIS_GUIDE.md)
- **新規投稿作成ガイド**: [docs/CREATE_POST_GUIDE.md](docs/CREATE_POST_GUIDE.md)

## 📋 システム構成

- **フロントエンド**: React + TypeScript + MUI + Recharts
- **バックエンド**: Node.js + Hono
- **データベース**: SQLite
- **AI分析**: OpenAI GPT-3.5-turbo (完全統合)

## ✨ 機能

### Core Features (完全実装済み)
- ✅ **AI分析エンジン**: OpenAI GPT-3.5-turbo完全統合（誹謗中傷・ネタバレ・個人情報等6カテゴリ検出）
- ✅ **自動モデレーション**: 3段階判定（自動承認/手動レビュー/自動拒否）
- ✅ **管理者ダッシュボード**: リアルタイム統計とシステム概要
- ✅ **レビューワークフロー**: 待機投稿の一覧・詳細・承認拒否機能
- ✅ **高度な検索・フィルタ**: 投稿内容・ユーザー・リスクタイプ・日付範囲での絞り込み
- ✅ **統計分析・グラフ**: 時系列チャート・リスク分布・ユーザー統計（Recharts使用）
- ✅ **クイックAI分析**: 発見したコメントの即座AI判定ツール
- ✅ **投稿シミュレーター**: テスト・デモ用投稿作成機能
- ✅ **類似投稿参考表示**: 過去の判定事例に基づく一貫性のあるレビュー支援

### Advanced Features (実装済み)
- ✅ **包括的検索**: キーワード・ユーザーID・作品名・AIスコア範囲・日付範囲
- ✅ **視覚的統計**: 日別推移・ステータス分布・時間別パターン・トップユーザー/作品
- ✅ **リアルタイム更新**: 1分間隔での統計自動更新
- ✅ **詳細ログ**: AI分析過程の完全追跡とエラーハンドリング
- ✅ **レスポンシブデザイン**: モバイル・デスクトップ完全対応
- ✅ **判定支援**: 類似投稿検索による一貫性のあるモデレーション

### Future Enhancements (Phase 2)
- 🔄 画像解析機能（不適切画像・著作権侵害検出）
- 🔄 バルク操作機能（一括承認・拒否）
- 🔄 外部API連携（他の監視サービスとの統合）

## 🧠 AI判定システム

### リスクカテゴリ
| カテゴリ | 日本語名 | 説明 |
|---------|---------|------|
| `harassment` | 誹謗中傷 | 特定の人物・作品への攻撃的表現 |
| `spoiler` | ネタバレ | 物語の重要な展開・結末の暴露 |
| `inappropriate_content` | 不適切コンテンツ | 暴力的・性的・差別的な内容 |
| `brand_damage` | ブランド毀損 | 運営会社・作品への悪意ある批判 |
| `spam` | スパム | 広告・宣伝・重複投稿 |
| `personal_info` | 個人情報 | 電話番号・住所・メールアドレス等 |
| `editorial_feedback` | 編集・校正指摘 | 誤字・脱字・設定矛盾等の指摘 |

### 判定フロー
```
投稿受信 → AI分析 → スコア算出(0.0-1.0) → 自動振り分け
```

| スコア範囲 | 処理 | 説明 |
|-----------|------|------|
| < 0.3 | 自動承認 | リスクが低い投稿 |
| 0.3 - 0.8 | 手動レビュー | AI判定が曖昧な投稿 |
| ≥ 0.8 | 自動拒否 | 明らかに問題のある投稿 |

## 📊 動作確認済みテストケース

### 自動承認例
```bash
curl -X POST http://localhost:5001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user", 
    "content": "この漫画面白いですね！", 
    "manga_title": "テスト漫画"
  }'
# → スコア: 0.1, ステータス: approved
```

### 手動レビュー例
```bash
curl -X POST http://localhost:5001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user", 
    "content": "犯人は田中です。最終回で主人公が死ぬ", 
    "manga_title": "テスト漫画"
  }'
# → スコア: 0.7, ステータス: pending（ネタバレ検出）
```

## 🛠 開発コマンド

### 基本コマンド
```bash
# 全体起動（推奨）
npm run dev

# 個別起動
npm run server   # バックエンドのみ（ポート5001）
npm run client   # フロントエンドのみ（ポート3000）

# 依存関係インストール
npm run install-deps

# 本番ビルド
npm run build

# 本番起動
npm start
```

### ディレクトリ構造
```
check_comment_ai/
├── README.md
├── package.json
├── docs/                      # 包括的ドキュメント
│   ├── requirements.md        # 要件仕様書
│   ├── API.md                 # API仕様書
│   ├── SETUP.md               # セットアップガイド
│   ├── ANALYTICS_GUIDE.md     # 統計分析機能ガイド
│   ├── SEARCH_FILTER_GUIDE.md # 検索・フィルタリングガイド
│   ├── QUICK_ANALYSIS_GUIDE.md # クイックAI分析ガイド
│   └── CREATE_POST_GUIDE.md   # 投稿作成機能ガイド
├── backend/                   # Honoサーバー
│   ├── server.js              # メインサーバー
│   ├── routes/                # APIルート
│   │   ├── posts.js           # 投稿API（検索・作成）
│   │   └── moderation.js      # モデレーション・統計API
│   ├── services/              # ビジネスロジック
│   │   ├── aiService.js       # OpenAI統合AI分析
│   │   └── moderationService.js # モデレーション処理
│   └── database/              # データベース
│       ├── init.js            # DB初期化
│       └── schema.sql         # テーブル定義
└── frontend/                  # Reactアプリ
    ├── src/
    │   ├── components/        # 再利用可能コンポーネント
    │   │   ├── Sidebar.tsx    # ナビゲーション
    │   │   └── PostsList.tsx  # 投稿一覧・検索
    │   ├── pages/             # ページコンポーネント
    │   │   ├── Dashboard.tsx  # ダッシュボード
    │   │   ├── ReviewQueue.tsx # レビュー管理
    │   │   ├── QuickAnalysis.tsx # AI分析ツール
    │   │   ├── CreatePost.tsx # 投稿作成ツール
    │   │   └── Analytics.tsx  # 統計分析・グラフ
    │   └── services/          # API通信
    │       └── api.ts         # バックエンドAPI呼び出し
    └── public/
```

## 🔧 設定

### 環境変数（backend/.env）
```env
PORT=5001                           # サーバーポート
NODE_ENV=development                # 環境
OPENAI_API_KEY=your_key_here       # OpenAI APIキー（オプション）
DB_PATH=./database.sqlite          # データベースファイル
AUTO_APPROVE_THRESHOLD=0.3         # 自動承認の閾値
AUTO_REJECT_THRESHOLD=0.8          # 自動拒否の閾値
```

**重要**: `OPENAI_API_KEY`の設定が必須です。未設定の場合はエラーになります。

## 📡 API仕様

詳細なAPI仕様は [docs/API.md](docs/API.md) を参照してください。

### 主要エンドポイント
- `POST /api/posts` - 投稿作成（AI分析付き）
- `GET /api/posts` - 投稿一覧・検索（高度フィルタ対応）
- `GET /api/moderation/pending` - レビュー待ち一覧
- `POST /api/moderation/:id/approve` - 投稿承認
- `POST /api/moderation/:id/reject` - 投稿拒否
- `GET /api/moderation/stats` - 詳細統計情報（時系列・リスク分析）
- `POST /api/moderation/quick-analysis` - クイックAI分析

## 🗄 データベース構造

### posts テーブル
```sql
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    manga_title VARCHAR(255),
    episode_number INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    ai_score REAL DEFAULT 0.0,
    ai_analysis TEXT,  -- JSON形式
    detected_risks TEXT,  -- JSON配列
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- その他のフィールド...
);
```

### moderation_logs テーブル
```sql
CREATE TABLE moderation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,  -- 'approve', 'reject', 'auto_approve', 'auto_reject'
    moderator_id VARCHAR(255),
    reason VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

## 🎯 使用例

### 管理者ワークフロー
1. **ダッシュボード**（http://localhost:3000）にアクセス
2. **レビューキュー**でAI判定待ちの投稿を確認
3. 各投稿のAI分析結果を参考に承認・拒否を決定
4. **全投稿一覧**で過去の投稿を高度検索・フィルタリング
5. **統計分析**で時系列・リスク分布・ユーザー活動を分析
6. **クイックAI分析**で発見したコメントを即座に判定
7. **新規投稿作成**でテストデータ生成・システム動作確認

### 🆕 クイックAI分析機能
- **目的**: 発見したコメントをその場で即座にAI判定
- **使用場面**: SNS、他の掲示板で問題のあるコメントを見つけた際
- **機能**: 
  - リアルタイムAI分析（1.5秒で結果表示）
  - 6種類のリスク検出（誹謗中傷、ネタバレ、個人情報等）
  - 分析履歴の保存（最新5件）
  - サンプルコメントでのテスト機能
- **アクセス**: http://localhost:3000/quick-analysis

### 🆕 新規投稿作成機能
- **目的**: ユーザー投稿をシミュレート、テストデータ生成
- **使用場面**: システムテスト、デモンストレーション、動作確認
- **機能**:
  - 多様なサンプルコメント（通常/ネタバレ/不適切/スパム）
  - 人気漫画タイトルのプリセット
  - サンプルユーザーID
  - 投稿履歴表示（最新10件）
  - リアルタイムステータス更新
- **アクセス**: http://localhost:3000/create-post

### 🆕 統計分析・グラフ機能
- **目的**: システム運用状況の可視化と分析
- **使用場面**: 定期レポート作成、トレンド分析、問題の早期発見
- **機能**:
  - 日別投稿数推移（ステータス別積み上げエリアチャート）
  - ステータス分布（パイチャート）
  - AIスコア分布・リスクタイプ別統計（バーチャート）
  - 時間別投稿パターン（複合チャート）
  - ユーザー・作品別活動ランキング
  - 期間選択（7日/30日/90日）・リアルタイム更新
- **アクセス**: http://localhost:3000/analytics

### 🆕 高度検索・フィルタリング機能
- **目的**: 膨大な投稿データから特定条件での効率的な検索
- **検索条件**:
  - キーワード検索（投稿内容）
  - ユーザーID・漫画タイトル（部分一致）
  - ステータス・リスクタイプ別絞り込み
  - AIスコア範囲指定（スライダー）
  - 日付範囲指定
  - 柔軟なソート機能（作成日時・AIスコア・ユーザーID）
- **機能**: 詳細フィルター切り替え・ワンクリッククリア・正確なページネーション

### API利用例
```bash
# 投稿作成（AI分析付き）
curl -X POST http://localhost:5001/api/posts \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "content": "投稿内容", "manga_title": "作品名"}'

# 高度検索（リスクタイプフィルタ）
curl "http://localhost:5001/api/posts?risk_type=harassment&limit=10"

# 統計データ取得
curl "http://localhost:5001/api/moderation/stats?days=30"

# クイックAI分析
curl -X POST http://localhost:5001/api/moderation/quick-analysis \
  -H "Content-Type: application/json" \
  -d '{"content": "分析したいコメント"}'

# レビュー待ち確認  
curl http://localhost:5001/api/moderation/pending

# 承認
curl -X POST http://localhost:5001/api/moderation/1/approve \
  -H "Content-Type: application/json" \
  -d '{"moderator_id": "admin", "reason": "問題なし"}'
```

## 🚀 本番環境デプロイ

1. **環境変数設定**
   ```bash
   export NODE_ENV=production
   export OPENAI_API_KEY=your_production_key
   export PORT=8080
   ```

2. **ビルド**
   ```bash
   npm run build
   ```

3. **起動**
   ```bash
   npm start
   ```

## 🤝 コントリビューション

1. フォークしてブランチを作成
2. 機能追加・バグ修正
3. テスト実行とコード品質確認
4. プルリクエスト作成

## 📄 ライセンス

MIT License