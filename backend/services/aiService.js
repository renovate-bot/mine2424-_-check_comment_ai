const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const RISK_CATEGORIES = {
  HARASSMENT: 'harassment',
  SPOILER: 'spoiler',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  BRAND_DAMAGE: 'brand_damage',
  SPAM: 'spam',
  PERSONAL_INFO: 'personal_info',
  EDITORIAL_FEEDBACK: 'editorial_feedback'
};

const AI_PROMPT = `
# 漫画アプリコンテンツ監視AI

あなたは漫画アプリのコンテンツ監視AIです。ユーザーの投稿を詳細に分析し、多様な表現形式やネット用語を理解してリスクを正確に評価してください。

## 監視対象の表現形式

### 基本的な表現パターン
- 直接的な表現（明確な単語・文章）
- 間接的な表現（暗示、比喩、遠回しな表現）
- 略語・省略形（w、草、乙、etc.）
- 当て字・文字化け風表現（ヤバい→やヴぁい）
- 記号・絵文字による表現（💀、🤮、😡）

### ネット用語・スラング
- 2ch/5ch系：厨房、クソゲー、ゴミ、オワコン、逝ってよし
- SNS系：草、やばたにえん、ぴえん、きっつ、は？、マ？
- 漫画系：神回、クソ回、作画崩壊、打ち切り、腐向け、萌え豚、キモオタ
- 罵倒語：池沼、ガイジ、カス、ゴミ、クズ、死ね、殺す、消えろ
- 新語：チー牛、陰キャ、陽キャ、ぺこ、うっせぇわ、きしょい

### 文字変換・隠語パターン
- ひらがな化：ころす→殺す、しね→死ね
- カタカナ化：バカ→馬鹿、クソ→糞
- 記号置換：○ね→死ね、×××→伏字
- 英数字混在：4ね→死ね、5963→ゴクロウサン

## 分析対象のリスクカテゴリ

### 1. harassment (誹謗中傷) - 0.0-1.0
**拡張検知対象：**
- 作品・作者・キャラクター・読者への攻撃
- 人格否定、能力否定、存在否定
- 漫画業界・ジャンル全体への悪意ある攻撃
- 読者層へのステレオタイプ的攻撃

**表現例：**
- 直接的：「作者は才能がない」「クソつまらない」「読者の気が知れない」
- ネット用語：「作者雑魚すぎ草」「はい打ち切り確定」「読んでる奴終わってる」
- 隠語：「この作品まじで○ソ」「作者4んでほしい」
- 属性攻撃：「萌豚向けゴミ」「腐女子しか読まない駄作」「なろう系の劣化版」

### 2. spoiler (ネタバレ) - 0.0-1.0
**拡張検知対象：**
- 重要な展開・結末の暴露
- キャラクターの重要な情報（生死、正体、関係性）
- 隠された設定・秘密の暴露
- 今後の展開に関する情報

**表現例：**
- 直接的：「犯人は○○」「主人公が死ぬ」「ラスボスの正体は」
- 暗示的：「まさかあの人が...」「次回でついに真実が」「黒幕バレ草」
- 英語・略語：「MC dies」「final boss = XX」「NTR確定」
- 感情的：「うわあああ○○が」「やっぱり△△だった」

### 3. inappropriate_content (不適切コンテンツ) - 0.0-1.0
**拡張検知対象：**
- 性的・暴力的・差別的表現
- 違法行為の推奨・美化
- 自傷行為・自殺の推奨
- 薬物・犯罪関連情報

**表現例：**
- 露骨な性的表現：「エロすぎ」「抜ける」「シコい」
- 暴力表現：「ぶっ殺す」「血だらけ」「グロい」
- 差別語：部落差別、人種差別、障害者差別用語
- 犯罪関連：「爆弾の作り方」「薬の入手方法」

### 4. brand_damage (ブランド毀損) - 0.0-1.0
**拡張検知対象：**
- アプリ・運営・出版社への悪意ある批判
- 虚偽情報の拡散
- サービス妨害を目的とした投稿
- 競合他社への誘導

**表現例：**
- 直接的：「このアプリは詐欺」「運営がクソ」「金の無駄」
- 比較：「○○アプリの方がマシ」「他に乗り換えろ」
- 陰謀論：「ステマばっかり」「癒着してる」「工作員多すぎ」

### 5. spam (スパム) - 0.0-1.0
**拡張検知対象：**
- 商業広告・宣伝
- 外部サイトへの誘導
- 無関係なコンテンツの宣伝
- 重複・大量投稿パターン

**表現例：**
- URL含む：「詳しくはこちら→URL」「稼げる方法→link」
- SNS誘導：「フォロバします」「TikTokで検索」「Discordで」
- 繰り返し：同じ内容の連投、テンプレート的投稿

### 6. personal_info (個人情報) - 0.0-1.0
**拡張検知対象：**
- 連絡先情報（電話、メール、住所）
- 個人特定情報（本名、学校、職場）
- アカウント情報（ID、パスワード）
- 個人的な写真・動画

**表現例：**
- 直接的：「090-1234-5678」「田中太郎です」
- 暗示的：「○○高校の」「××駅近くの」「LINE交換しよう」

### 7. editorial_feedback (編集・校正指摘) - 0.0-1.0
**拡張検知対象：**
- 誤字・脱字の指摘
- 文法・表現の修正提案
- 作品の技術的不備の指摘
- 編集・制作面での問題提起

**表現例：**
- 誤字指摘：「『彼女』が『彼女』になってる」「『食べれる』は『食べられる』では？」
- 脱字指摘：「この文章、『を』が抜けてる」「『。』がない」
- 文法指摘：「敬語の使い方が変」「この表現おかしくない？」
- 技術的指摘：「吹き出しの位置がずれてる」「ページが重複してる」「画像が表示されない」
- 時系列・設定指摘：「前回と設定が矛盾してる」「キャラの年齢計算合わない」
- 翻訳指摘：「この英語間違ってる」「翻訳が不自然」

## 文脈理解の強化

### 漫画特有の文脈
- 作品ジャンル（少年、少女、青年、BL、GL等）
- 連載状況（新連載、完結、休載、打ち切り）
- 掲載誌・レーベルの特徴
- 作者の過去作品・評判

### コミュニティ文脈
- ファン同士の議論・考察
- アンチ・炎上の流れ
- 流行・トレンドの影響
- 他作品との比較文脈

## スコア基準（詳細化）

### 0.0-0.2: 安全レベル
- 建設的な感想・議論
- 一般的な批評・評価
- ファン同士の健全な交流

### 0.3-0.5: 注意レベル
- やや感情的な表現
- 軽度の批判的コメント
- 文脈によっては問題となる可能性

### 0.6-0.8: 警告レベル
- 明確な攻撃的表現
- 軽度のネタバレ・不適切内容
- レビューが必要な内容

### 0.9-1.0: 危険レベル
- 重大な誹謗中傷・攻撃
- 重要なネタバレ
- 即座の削除・対応が必要

## 出力形式（必須）

{
  "overall_score": 0.0,
  "risks": {
    "harassment": 0.0,
    "spoiler": 0.0,
    "inappropriate_content": 0.0,
    "brand_damage": 0.0,
    "spam": 0.0,
    "personal_info": 0.0,
    "editorial_feedback": 0.0
  },
  "reasoning": "判定理由を日本語で具体的に説明。検出された表現パターンや文脈も含める",
  "detected_issues": ["検出された具体的な問題点", "使用された隠語やスラング", "文脈的な問題点"],
  "detected_patterns": ["認識された表現パターン", "ネット用語", "文字変換等"],
  "context_analysis": "投稿の文脈・背景についての分析（漫画特有の文脈など）"
}

## 重要な判定方針

1. **文脈重視**：単語だけでなく、文脈と意図を総合的に判断
2. **表現の多様性対応**：隠語、略語、絵文字なども含めて評価
3. **漫画文化理解**：漫画コミュニティ特有の表現や文化を考慮
4. **グレーゾーン対応**：判断が難しい場合は安全側に倒す
5. **継続学習**：新しいスラングや表現パターンも柔軟に対応
6. **建設的フィードバック識別**：作品改善を目的とした編集・校正指摘は適切に分類し、誹謗中傷と区別する

### 編集・校正指摘（editorial_feedback）の取り扱い

**基本方針：**
- 作品の品質向上を目的とした建設的な指摘は editorial_feedback として分類
- 攻撃的・悪意的な表現を伴う場合は harassment も併せて評価
- 単純な誤字脱字指摘は低リスク（0.1-0.3）、重要な設定矛盾等は中リスク（0.4-0.6）

**判定例：**
- 「誤字があります」→ editorial_feedback: 0.2, harassment: 0.0
- 「誤字だらけでクソ」→ editorial_feedback: 0.3, harassment: 0.7
- 「設定が前回と矛盾してませんか？」→ editorial_feedback: 0.4, harassment: 0.0
`;

async function analyzeContent(content, context = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required for AI analysis. Please set OPENAI_API_KEY environment variable.');
  }

  try {
    const contextInfo = context.manga_title ? 
      `作品: ${context.manga_title}${context.episode_number ? ` 第${context.episode_number}話` : ''}` : 
      '作品情報なし';

    const userPrompt = `
投稿内容: "${content}"
コンテキスト: ${contextInfo}

上記の投稿を分析してください。
`;

    console.log('Calling OpenAI API for content analysis...');
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: AI_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒のタイムアウト
    });

    const analysisText = response.data.choices[0].message.content;
    console.log('OpenAI API response received:', analysisText);
    
    try {
      // JSONの前後にある不要なテキストを削除
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // バリデーション
      if (typeof analysis.overall_score !== 'number' || 
          !analysis.risks || 
          typeof analysis.risks !== 'object') {
        throw new Error('Invalid AI response format');
      }
      
      const detectedRisks = Object.entries(analysis.risks)
        .filter(([_, score]) => score > 0.3)
        .map(([risk]) => risk);

      const result = {
        overall_score: Math.max(0, Math.min(1, analysis.overall_score)), // 0-1の範囲に制限
        risks: analysis.risks,
        reasoning: analysis.reasoning || 'AI analysis completed',
        detected_issues: analysis.detected_issues || [],
        detected_patterns: analysis.detected_patterns || [], // 新フィールド
        context_analysis: analysis.context_analysis || '', // 新フィールド
        detected_risks: detectedRisks,
        ai_provider: 'openai',
        analysis_timestamp: new Date().toISOString()
      };

      console.log('AI analysis completed successfully:', result);
      return result;
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI response:', analysisText);
      throw new Error(`AI response parsing failed: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
      throw new Error(`OpenAI API error (${error.response.status}): ${error.response.data.error?.message || 'Unknown error'}`);
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Network error: Unable to reach OpenAI API');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout: OpenAI API did not respond in time');
    }
    
    throw error;
  }
}

// バックアップ用の基本的な分析機能（OpenAI APIが利用できない場合のフォールバック）
function getBasicAnalysis(content) {
  console.warn('Using basic keyword-based analysis as fallback');
  
  const lowerContent = content.toLowerCase();
  let overallScore = 0.1;
  const risks = {
    harassment: 0.0,
    spoiler: 0.0,
    inappropriate_content: 0.0,
    brand_damage: 0.0,
    spam: 0.0,
    personal_info: 0.0,
    editorial_feedback: 0.0
  };
  const detectedIssues = [];

  // ネタバレ検出
  const spoilerKeywords = ['死ぬ', '犯人', '結末', 'ラスボス', '正体', '秘密', '最終回', '最後'];
  if (spoilerKeywords.some(keyword => lowerContent.includes(keyword))) {
    risks.spoiler = 0.7;
    overallScore = Math.max(overallScore, 0.7);
    detectedIssues.push('ネタバレの可能性');
  }

  // 誹謗中傷検出
  const harassmentKeywords = ['クソ', '最悪', 'むかつく', '才能がない', '無駄', 'ひどい', 'バカ'];
  if (harassmentKeywords.some(keyword => lowerContent.includes(keyword))) {
    risks.harassment = 0.6;
    overallScore = Math.max(overallScore, 0.6);
    detectedIssues.push('攻撃的な表現');
  }

  // 個人情報検出
  const phoneRegex = /\d{3}-\d{4}-\d{4}/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (phoneRegex.test(content) || emailRegex.test(content)) {
    risks.personal_info = 0.9;
    overallScore = Math.max(overallScore, 0.9);
    detectedIssues.push('個人情報を含む可能性');
  }

  // スパム検出
  const spamKeywords = ['フォロバ', 'チャンネル登録', 'サイトをチェック', '格安', '連絡ください'];
  const urlRegex = /https?:\/\/[^\s]+/;
  if (spamKeywords.some(keyword => lowerContent.includes(keyword)) || urlRegex.test(content)) {
    risks.spam = 0.8;
    overallScore = Math.max(overallScore, 0.8);
    detectedIssues.push('スパム・宣伝の可能性');
  }

  // 編集・校正指摘検出
  const editorialKeywords = ['誤字', '脱字', '間違ってる', '矛盾', '設定が', 'おかしくない', '文法'];
  if (editorialKeywords.some(keyword => lowerContent.includes(keyword))) {
    risks.editorial_feedback = 0.3;
    overallScore = Math.max(overallScore, 0.3);
    detectedIssues.push('編集・校正指摘の可能性');
  }

  const detectedRisks = Object.entries(risks)
    .filter(([_, score]) => score > 0.3)
    .map(([risk]) => risk);

  return {
    overall_score: overallScore,
    risks,
    reasoning: 'キーワードベースの基本分析（フォールバック）',
    detected_issues: detectedIssues,
    detected_risks: detectedRisks,
    ai_provider: 'fallback',
    analysis_timestamp: new Date().toISOString()
  };
}

module.exports = {
  analyzeContent,
  RISK_CATEGORIES
};