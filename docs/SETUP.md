# セットアップガイド

AI Content Moderation Systemの詳細なセットアップ手順を説明します。

## 📋 前提条件

### 必要なソフトウェア
- **Node.js**: v18.14.1以上
- **npm**: v9.0.0以上
- **Git**: バージョン管理用

### 動作確認済み環境
- macOS 13.0以上
- Windows 11
- Ubuntu 20.04以上

## 🚀 セットアップ手順

### 1. プロジェクトのクローン
```bash
git clone <repository-url>
cd check_comment_ai
```

### 2. 依存関係のインストール
```bash
# ルートディレクトリで実行
npm run install-deps
```

このコマンドは以下を実行します：
- ルートディレクトリの依存関係インストール
- バックエンドの依存関係インストール
- フロントエンドの依存関係インストール

### 3. 環境変数の設定

#### バックエンド環境変数
```bash
cd backend
cp .env.example .env
```

`.env`ファイルを編集：
```env
# サーバー設定
PORT=5001
NODE_ENV=development

# OpenAI API設定（オプション）
OPENAI_API_KEY=your_openai_api_key_here

# データベース設定
DB_PATH=./database.sqlite

# Redis設定（将来実装予定）
REDIS_URL=redis://localhost:6379

# AI判定の閾値
AUTO_APPROVE_THRESHOLD=0.3
AUTO_REJECT_THRESHOLD=0.8
```

#### OpenAI APIキーの取得（オプション）
1. [OpenAI Platform](https://platform.openai.com/api-keys)にアクセス
2. アカウント作成・ログイン
3. 「Create new secret key」でAPIキーを生成
4. `.env`ファイルの`OPENAI_API_KEY`に設定

**注意**: APIキーを設定しない場合、モック機能で動作します。

### 4. データベースの初期化
初回起動時に自動でSQLiteデータベースが作成されます。手動で初期化する場合：

```bash
cd backend
node -e "require('./database/init').initializeDatabase().then(() => console.log('DB initialized'))"
```

### 5. アプリケーションの起動

#### 開発環境（推奨）
```bash
# プロジェクトルートで実行
npm run dev
```

このコマンドで以下が同時起動します：
- バックエンドサーバー（http://localhost:5001）
- フロントエンドサーバー（http://localhost:3000）

#### 個別起動
```bash
# バックエンドのみ
npm run server

# フロントエンドのみ  
npm run client
```

### 6. 動作確認

#### ブラウザでの確認
1. http://localhost:3000 にアクセス
2. 管理ダッシュボードが表示されることを確認
3. 「レビューキュー」ページに移動
4. 現在はレビュー待ちの投稿がない状態

#### APIでの動作確認
```bash
# システム情報の取得
curl http://localhost:5001/

# テスト投稿の作成
curl -X POST http://localhost:5001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "content": "この漫画面白いです！",
    "manga_title": "テスト漫画",
    "episode_number": 1
  }'

# 統計情報の確認
curl http://localhost:5001/api/moderation/stats
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. ポート競合エラー
```
Error: listen EADDRINUSE: address already in use :::5001
```

**解決方法:**
```bash
# 使用中のプロセスを確認
lsof -i :5001

# プロセスを終了
kill -9 <PID>

# または別のポートを使用
echo "PORT=5002" >> backend/.env
```

#### 2. 依存関係インストールエラー
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**解決方法:**
```bash
# キャッシュをクリア
npm cache clean --force

# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json  
rm -rf frontend/node_modules frontend/package-lock.json
npm run install-deps
```

#### 3. SQLiteデータベースエラー
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**解決方法:**
```bash
# データベースディレクトリの作成
mkdir -p backend/database

# 権限の確認・修正
chmod 755 backend/database
```

#### 4. フロントエンドのビルドエラー
```
Module not found: Error: Can't resolve '@mui/material'
```

**解決方法:**
```bash
cd frontend
npm install
```

#### 5. CORS エラー
APIリクエストでCORSエラーが発生する場合：

**解決方法:**
- ブラウザの開発者ツールでエラー詳細を確認
- バックエンドサーバーが正常に起動していることを確認
- プロキシ設定が正しいことを確認（`frontend/vite.config.ts`）

### ログの確認方法

#### バックエンドログ
```bash
cd backend
npm run dev
# コンソールにログが出力されます
```

#### フロントエンドログ
```bash
cd frontend  
npm run dev
# ブラウザの開発者ツール > Consoleでログを確認
```

#### ログファイルの場所
```
backend/
├── database.sqlite    # SQLiteデータベースファイル
└── logs/             # 将来的にログファイルを配置予定
```

## 📊 開発・デバッグのヒント

### 1. API動作確認
```bash
# ヘルスチェック
curl http://localhost:5001/

# 投稿一覧
curl http://localhost:5001/api/posts

# レビュー待ち投稿
curl http://localhost:5001/api/moderation/pending
```

### 2. データベース確認
```bash
# SQLiteコマンドライン（要sqlite3インストール）
sqlite3 backend/database.sqlite

# テーブル一覧
.tables

# 投稿データ確認
SELECT * FROM posts;

# モデレーションログ確認  
SELECT * FROM moderation_logs;
```

### 3. AI判定のテスト
```bash
# ネタバレを含む投稿（手動レビュー対象）
curl -X POST http://localhost:5001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "content": "犯人は田中です",
    "manga_title": "推理漫画"
  }'

# 個人情報を含む投稿（自動拒否対象）
curl -X POST http://localhost:5001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "content": "連絡先: 090-1234-5678",
    "manga_title": "テスト漫画"
  }'
```

## 🚀 本番環境への展開

### 1. 環境変数の設定
```bash
export NODE_ENV=production
export PORT=8080
export OPENAI_API_KEY=your_production_api_key
export DB_PATH=/app/data/database.sqlite
```

### 2. ビルド
```bash
npm run build
```

### 3. 起動
```bash
npm start
```

### 4. プロセス管理（PM2使用例）
```bash
# PM2のインストール
npm install -g pm2

# アプリケーションの起動
pm2 start backend/server.js --name "ai-moderation-backend"

# 静的ファイルサーバー（必要に応じて）
pm2 serve frontend/dist 3000 --name "ai-moderation-frontend"
```

## 📞 サポート

問題が解決しない場合：

1. [GitHub Issues](https://github.com/your-repo/check_comment_ai/issues)で既存の問題を確認
2. 新しいissueを作成（エラーメッセージとシステム情報を含める）
3. [docs/API.md](./API.md)でAPI仕様を確認

### サポート情報に含めるべき内容
- OS（macOS/Windows/Linux）
- Node.jsバージョン（`node --version`）
- npm バージョン（`npm --version`）
- エラーメッセージの全文
- 実行したコマンド