# AI Content Moderation System - API仕様書

## 概要
漫画アプリのユーザー投稿コンテンツを監視するAIシステムのREST API仕様書です。

## ベースURL
```
http://localhost:5001
```

## 認証
現在のバージョンでは認証は実装されていません。

---

## エンドポイント一覧

### システム情報

#### `GET /`
システムの基本情報を取得

**レスポンス:**
```json
{
  "message": "AI Content Moderation System API",
  "version": "1.0.0",
  "endpoints": {
    "posts": "/api/posts",
    "moderation": "/api/moderation"
  }
}
```

---

## 投稿関連API

### `GET /api/posts`
投稿一覧を取得

**クエリパラメータ:**
- `status` (オプション): フィルター条件 (`approved`, `pending`, `rejected`)
- `limit` (オプション): 取得件数 (デフォルト: 50)
- `offset` (オプション): オフセット (デフォルト: 0)

**レスポンス例:**
```json
{
  "posts": [
    {
      "id": 1,
      "user_id": "test_user",
      "content": "これは普通のコメントです",
      "content_type": "text",
      "image_url": null,
      "manga_title": "テスト漫画",
      "episode_number": 1,
      "status": "approved",
      "ai_score": 0.1,
      "ai_analysis": {
        "overall_score": 0.1,
        "risks": {
          "harassment": 0.0,
          "spoiler": 0.0,
          "inappropriate_content": 0.0,
          "brand_damage": 0.0,
          "spam": 0.0,
          "personal_info": 0.0
        },
        "reasoning": "Mock analysis based on keyword detection",
        "detected_issues": [],
        "detected_risks": []
      },
      "detected_risks": [],
      "created_at": "2025-06-16 02:21:32",
      "updated_at": "2025-06-16 02:21:33",
      "reviewed_by": null,
      "reviewed_at": null
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### `GET /api/posts/:id`
特定の投稿詳細を取得

**パラメータ:**
- `id`: 投稿ID

**レスポンス:**
```json
{
  "post": {
    "id": 1,
    "user_id": "test_user",
    "content": "投稿内容...",
    "status": "approved",
    "ai_score": 0.1,
    // ... その他のフィールド
  }
}
```

### `POST /api/posts`
新規投稿を作成

**リクエストボディ:**
```json
{
  "user_id": "user123",
  "content": "投稿内容",
  "content_type": "text",
  "manga_title": "漫画タイトル",
  "episode_number": 1
}
```

**必須フィールド:**
- `user_id`: ユーザーID
- `content`: 投稿内容

**オプションフィールド:**
- `content_type`: コンテンツタイプ (デフォルト: "text")
- `manga_title`: 漫画タイトル
- `episode_number`: 話数

**レスポンス:**
```json
{
  "message": "Post submitted successfully",
  "post_id": 1,
  "status": "processing"
}
```

---

## モデレーション関連API

### `GET /api/moderation/pending`
レビュー待ちの投稿一覧を取得

**クエリパラメータ:**
- `limit` (オプション): 取得件数 (デフォルト: 20)
- `offset` (オプション): オフセット (デフォルト: 0)

**レスポンス:**
```json
{
  "posts": [
    {
      "id": 2,
      "user_id": "test_user2",
      "content": "犯人は田中です。最終回で主人公が死ぬ",
      "status": "pending",
      "ai_score": 0.7,
      "ai_analysis": {
        "overall_score": 0.7,
        "risks": {
          "spoiler": 0.7
        },
        "reasoning": "ネタバレの可能性が検出されました",
        "detected_issues": ["ネタバレの可能性"],
        "detected_risks": ["spoiler"]
      },
      "detected_risks": ["spoiler"]
      // ... その他のフィールド
    }
  ]
}
```

### `POST /api/moderation/:id/approve`
投稿を承認

**パラメータ:**
- `id`: 投稿ID

**リクエストボディ:**
```json
{
  "moderator_id": "admin_user",
  "reason": "問題ないと判断"
}
```

**レスポンス:**
```json
{
  "message": "Post approved successfully"
}
```

### `POST /api/moderation/:id/reject`
投稿を拒否

**パラメータ:**
- `id`: 投稿ID

**リクエストボディ:**
```json
{
  "moderator_id": "admin_user",
  "reason": "ネタバレを含むため"
}
```

**必須フィールド:**
- `moderator_id`: モデレーターID
- `reason`: 拒否理由

**レスポンス:**
```json
{
  "message": "Post rejected successfully"
}
```

### `GET /api/moderation/stats`
モデレーション統計を取得

**レスポンス:**
```json
{
  "daily_stats": [
    {
      "status": "approved",
      "count": 2,
      "date": "2025-06-16"
    }
  ],
  "total_counts": [
    {
      "status": "approved",
      "count": 2
    },
    {
      "status": "pending",
      "count": 1
    },
    {
      "status": "rejected",
      "count": 0
    }
  ]
}
```

---

## AI判定システム

### リスクカテゴリ
システムは以下のリスクを検出します:

| カテゴリ | 説明 |
|---------|------|
| `harassment` | 誹謗中傷・攻撃的な表現 |
| `spoiler` | ネタバレ・物語の核心に触れる内容 |
| `inappropriate_content` | 不適切コンテンツ（暴力的・性的・差別的） |
| `brand_damage` | ブランド毀損・運営会社への悪意ある批判 |
| `spam` | スパム・広告・宣伝 |
| `personal_info` | 個人情報（電話番号・住所・メールアドレス等） |

### 判定フロー
1. 投稿受信
2. AI分析実行（0.0-1.0のスコア算出）
3. スコアに基づく振り分け:
   - `< 0.3`: 自動承認
   - `0.3 - 0.8`: 手動レビュー (pending)
   - `≥ 0.8`: 自動拒否

### AI分析レスポンス形式
```json
{
  "overall_score": 0.7,
  "risks": {
    "harassment": 0.0,
    "spoiler": 0.7,
    "inappropriate_content": 0.0,
    "brand_damage": 0.0,
    "spam": 0.0,
    "personal_info": 0.0
  },
  "reasoning": "判定理由の説明",
  "detected_issues": ["検出された具体的な問題点のリスト"],
  "detected_risks": ["threshold超過したリスクカテゴリ"]
}
```

---

## エラーレスポンス

### 形式
```json
{
  "error": "エラーメッセージ"
}
```

### HTTPステータスコード
- `200`: 成功
- `201`: 作成成功
- `400`: リクエストエラー
- `404`: リソースが見つからない
- `500`: サーバーエラー

---

## 使用例

### 投稿作成からレビューまでの流れ

1. **投稿作成**
```bash
curl -X POST http://localhost:5001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "content": "この漫画面白いですね！",
    "manga_title": "テスト漫画",
    "episode_number": 1
  }'
```

2. **レビュー待ち確認**
```bash
curl -X GET http://localhost:5001/api/moderation/pending
```

3. **投稿承認**
```bash
curl -X POST http://localhost:5001/api/moderation/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "moderator_id": "admin_user",
    "reason": "問題なし"
  }'
```

4. **統計確認**
```bash
curl -X GET http://localhost:5001/api/moderation/stats
```