const { Hono } = require('hono');
const { getDatabase } = require('../database/init');
const { analyzeContent } = require('../services/aiService');
const { processPostStatus } = require('../services/moderationService');

const app = new Hono();

app.get('/', async (c) => {
  const db = getDatabase();
  const { 
    status, 
    limit = 50, 
    offset = 0,
    search,
    user_id,
    manga_title,
    risk_type,
    ai_score_min,
    ai_score_max,
    date_from,
    date_to,
    sort_by = 'created_at',
    sort_order = 'DESC'
  } = c.req.query();
  
  try {
    let query = 'SELECT * FROM posts';
    let whereConditions = [];
    let params = [];
    
    // ステータスフィルター
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }
    
    // キーワード検索（投稿内容）
    if (search) {
      whereConditions.push('content LIKE ?');
      params.push(`%${search}%`);
    }
    
    // ユーザーIDフィルター
    if (user_id) {
      whereConditions.push('user_id LIKE ?');
      params.push(`%${user_id}%`);
    }
    
    // 漫画タイトルフィルター
    if (manga_title) {
      whereConditions.push('manga_title LIKE ?');
      params.push(`%${manga_title}%`);
    }
    
    // リスクタイプフィルター
    if (risk_type) {
      whereConditions.push('detected_risks LIKE ?');
      params.push(`%"${risk_type}"%`);
    }
    
    // AIスコア範囲フィルター
    if (ai_score_min !== undefined) {
      whereConditions.push('ai_score >= ?');
      params.push(parseFloat(ai_score_min));
    }
    
    if (ai_score_max !== undefined) {
      whereConditions.push('ai_score <= ?');
      params.push(parseFloat(ai_score_max));
    }
    
    // 日付範囲フィルター
    if (date_from) {
      whereConditions.push('DATE(created_at) >= ?');
      params.push(date_from);
    }
    
    if (date_to) {
      whereConditions.push('DATE(created_at) <= ?');
      params.push(date_to);
    }
    
    // WHERE句の構築
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // 総件数取得（フィルター適用後）
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const totalResult = await new Promise((resolve, reject) => {
      db.get(countQuery, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // ソート順序の検証
    const allowedSortFields = ['created_at', 'updated_at', 'ai_score', 'user_id', 'status'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    // ソートとページネーション
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const posts = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    const formattedPosts = posts.map(post => ({
      ...post,
      ai_analysis: post.ai_analysis ? JSON.parse(post.ai_analysis) : null,
      detected_risks: post.detected_risks ? JSON.parse(post.detected_risks) : []
    }));
    
    console.log(`Posts query executed: ${posts.length} results from ${totalResult.total} total`);
    
    return c.json({
      posts: formattedPosts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalResult.total,
        has_more: parseInt(offset) + parseInt(limit) < totalResult.total
      },
      filters: {
        status,
        search,
        user_id,
        manga_title,
        risk_type,
        ai_score_min,
        ai_score_max,
        date_from,
        date_to,
        sort_by: safeSortBy,
        sort_order: safeSortOrder
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

app.get('/:id', async (c) => {
  const db = getDatabase();
  const { id } = c.req.param();
  
  try {
    const post = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!post) {
      db.close();
      return c.json({ error: 'Post not found' }, 404);
    }
    
    const formattedPost = {
      ...post,
      ai_analysis: post.ai_analysis ? JSON.parse(post.ai_analysis) : null,
      detected_risks: post.detected_risks ? JSON.parse(post.detected_risks) : []
    };
    
    db.close();
    return c.json({ post: formattedPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    return c.json({ error: 'Failed to fetch post' }, 500);
  }
});

app.post('/', async (c) => {
  const db = getDatabase();
  
  try {
    const body = await c.req.json();
    const { user_id, content, content_type = 'text', manga_title, episode_number } = body;
    
    if (!user_id || !content) {
      return c.json({ error: 'user_id and content are required' }, 400);
    }
    
    console.log(`=== New Post Submission ===`);
    console.log(`User: ${user_id}`);
    console.log(`Content: ${content}`);
    console.log(`Type: ${content_type}`);
    console.log(`Manga: ${manga_title || 'N/A'}`);
    console.log(`Episode: ${episode_number || 'N/A'}`);
    console.log(`===========================`);
    
    // 投稿をデータベースに保存
    const postId = await new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO posts (user_id, content, content_type, manga_title, episode_number, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `);
      
      stmt.run([user_id, content, content_type, manga_title, episode_number], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      
      stmt.finalize();
    });
    
    db.close();
    
    // AI分析の実行（完全にOpenAI APIに依存）
    try {
      console.log(`Starting AI analysis for post ${postId}...`);
      const analysis = await analyzeContent(content, { manga_title, episode_number });
      console.log(`AI analysis completed for post ${postId}`);
      
      const result = await processPostStatus(postId, analysis);
      
      return c.json({ 
        message: result.message,
        post_id: postId,
        status: result.status,
        ai_score: result.score,
        ai_provider: result.ai_provider,
        detected_risks: result.detected_risks,
        analysis_timestamp: new Date().toISOString()
      }, 201);
      
    } catch (aiError) {
      console.error(`AI analysis failed for post ${postId}:`, aiError.message);
      
      // AI分析が失敗した場合のエラーハンドリング
      const db2 = getDatabase();
      await new Promise((resolve, reject) => {
        db2.run(`
          UPDATE posts 
          SET status = 'failed', ai_analysis = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [JSON.stringify({ error: aiError.message, timestamp: new Date().toISOString() }), postId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      db2.close();
      
      return c.json({ 
        error: 'AI analysis failed',
        message: aiError.message,
        post_id: postId,
        status: 'failed',
        suggestion: 'Please check OpenAI API configuration and try again'
      }, 500);
    }
    
  } catch (error) {
    console.error('Error creating post:', error);
    return c.json({ error: 'Failed to create post', details: error.message }, 500);
  }
});

module.exports = app;