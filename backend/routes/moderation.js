const { Hono } = require('hono');
const { getDatabase } = require('../database/init');
const { analyzeContent } = require('../services/aiService');

const app = new Hono();

app.get('/pending', async (c) => {
  const db = getDatabase();
  const { limit = 20, offset = 0 } = c.req.query();
  
  try {
    const posts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM posts 
        WHERE status = 'pending' 
        ORDER BY created_at ASC 
        LIMIT ? OFFSET ?
      `, [parseInt(limit), parseInt(offset)], (err, rows) => {
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
    
    return c.json({ posts: formattedPosts });
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    return c.json({ error: 'Failed to fetch pending posts' }, 500);
  }
});

app.post('/:id/approve', async (c) => {
  const db = getDatabase();
  const { id } = c.req.param();
  
  try {
    const body = await c.req.json();
    const { moderator_id, reason } = body;
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION');
      
      db.run(`
        UPDATE posts 
        SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [moderator_id, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        db.run(`
          INSERT INTO moderation_logs (post_id, action, moderator_id, reason, previous_status, new_status)
          VALUES (?, 'approve', ?, ?, 'pending', 'approved')
        `, [id, moderator_id, reason], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          db.run('COMMIT');
          resolve();
        });
      });
    });
    
    db.close();
    return c.json({ message: 'Post approved successfully' });
  } catch (error) {
    console.error('Error approving post:', error);
    return c.json({ error: 'Failed to approve post' }, 500);
  }
});

app.post('/:id/reject', async (c) => {
  const db = getDatabase();
  const { id } = c.req.param();
  
  try {
    const body = await c.req.json();
    const { moderator_id, reason } = body;
    
    if (!reason) {
      return c.json({ error: 'Reason is required for rejection' }, 400);
    }
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION');
      
      db.run(`
        UPDATE posts 
        SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [moderator_id, id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        db.run(`
          INSERT INTO moderation_logs (post_id, action, moderator_id, reason, previous_status, new_status)
          VALUES (?, 'reject', ?, ?, 'pending', 'rejected')
        `, [id, moderator_id, reason], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          db.run('COMMIT');
          resolve();
        });
      });
    });
    
    db.close();
    return c.json({ message: 'Post rejected successfully' });
  } catch (error) {
    console.error('Error rejecting post:', error);
    return c.json({ error: 'Failed to reject post' }, 500);
  }
});

app.get('/stats', async (c) => {
  const db = getDatabase();
  const { days = 30 } = c.req.query();
  
  try {
    // 時系列統計（日別）
    const dailyStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          status,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM posts 
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY status, DATE(created_at)
        ORDER BY date DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // 全期間統計
    const totalCounts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT status, COUNT(*) as count
        FROM posts
        GROUP BY status
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // AIスコア分布統計
    const scoreDistribution = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          CASE 
            WHEN ai_score < 0.1 then '0.0-0.1'
            WHEN ai_score < 0.3 then '0.1-0.3'
            WHEN ai_score < 0.5 then '0.3-0.5'
            WHEN ai_score < 0.7 then '0.5-0.7'
            WHEN ai_score < 0.9 then '0.7-0.9'
            ELSE '0.9-1.0'
          END as score_range,
          COUNT(*) as count
        FROM posts
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY score_range
        ORDER BY score_range
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // リスクタイプ統計
    const riskStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT detected_risks, COUNT(*) as count
        FROM posts
        WHERE detected_risks != '[]' 
        AND created_at >= date('now', '-${days} days')
        GROUP BY detected_risks
        ORDER BY count DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 時間別統計（24時間）
    const hourlyStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          strftime('%H', created_at) as hour,
          COUNT(*) as count,
          AVG(ai_score) as avg_score
        FROM posts
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY hour
        ORDER BY hour
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // ユーザー活動統計（トップ10）
    const userStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          user_id,
          COUNT(*) as post_count,
          AVG(ai_score) as avg_score,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
        FROM posts
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY user_id
        ORDER BY post_count DESC
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 漫画別統計
    const mangaStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          manga_title,
          COUNT(*) as post_count,
          AVG(ai_score) as avg_score,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
        FROM posts
        WHERE manga_title IS NOT NULL 
        AND manga_title != ''
        AND created_at >= date('now', '-${days} days')
        GROUP BY manga_title
        ORDER BY post_count DESC
        LIMIT 10
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();

    // リスクタイプのカウント集計
    const riskCounts = {};
    riskStats.forEach(row => {
      try {
        const risks = JSON.parse(row.detected_risks);
        risks.forEach(risk => {
          riskCounts[risk] = (riskCounts[risk] || 0) + row.count;
        });
      } catch (e) {
        console.error('Error parsing detected_risks:', e);
      }
    });
    
    return c.json({
      period_days: days,
      daily_stats: dailyStats,
      total_counts: totalCounts,
      score_distribution: scoreDistribution,
      risk_distribution: riskCounts,
      hourly_stats: hourlyStats,
      user_stats: userStats,
      manga_stats: mangaStats,
      summary: {
        total_posts: totalCounts.reduce((sum, item) => sum + item.count, 0),
        posts_last_period: dailyStats.reduce((sum, item) => sum + item.count, 0),
        avg_daily_posts: Math.round(dailyStats.reduce((sum, item) => sum + item.count, 0) / days),
        risk_posts: Object.values(riskCounts).reduce((sum, count) => sum + count, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// 編集・校正指摘専用エンドポイント
app.get('/editorial-feedback', async (c) => {
  const db = getDatabase();
  const { limit = 20, offset = 0, status = 'all', sort_by = 'created_at', sort_order = 'DESC' } = c.req.query();
  
  try {
    let statusCondition = '';
    if (status !== 'all') {
      statusCondition = `AND status = '${status}'`;
    }

    const posts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM posts 
        WHERE JSON_EXTRACT(detected_risks, '$') LIKE '%editorial_feedback%'
        ${statusCondition}
        ORDER BY ${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      `, [parseInt(limit), parseInt(offset)], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 総件数取得
    const totalCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as total FROM posts 
        WHERE JSON_EXTRACT(detected_risks, '$') LIKE '%editorial_feedback%'
        ${statusCondition}
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });
    
    db.close();
    
    const formattedPosts = posts.map(post => ({
      ...post,
      ai_analysis: post.ai_analysis ? JSON.parse(post.ai_analysis) : null,
      detected_risks: post.detected_risks ? JSON.parse(post.detected_risks) : []
    }));
    
    return c.json({ 
      posts: formattedPosts,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching editorial feedback posts:', error);
    return c.json({ error: 'Failed to fetch editorial feedback posts' }, 500);
  }
});

// 編集・校正指摘の承認（作品改善として有効）
app.post('/:id/approve-editorial', async (c) => {
  const db = getDatabase();
  const { id } = c.req.param();
  
  try {
    const body = await c.req.json();
    const { moderator_id, reason } = body;
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION');
      
      // 投稿を承認済みに変更
      db.run(`
        UPDATE posts 
        SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND JSON_EXTRACT(detected_risks, '$') LIKE '%editorial_feedback%'
      `, [id], function(updateErr) {
        if (updateErr) {
          db.run('ROLLBACK');
          reject(updateErr);
          return;
        }
        
        // モデレーションログに記録
        db.run(`
          INSERT INTO moderation_logs (post_id, action, moderator_id, reason, created_at)
          VALUES (?, 'approve_editorial', ?, ?, CURRENT_TIMESTAMP)
        `, [id, moderator_id, reason || '編集・校正指摘として有効'], function(logErr) {
          if (logErr) {
            db.run('ROLLBACK');
            reject(logErr);
            return;
          }
          
          db.run('COMMIT');
          resolve();
        });
      });
    });
    
    db.close();
    
    return c.json({ 
      message: 'Editorial feedback approved successfully',
      post_id: parseInt(id)
    });
  } catch (error) {
    console.error('Error approving editorial feedback:', error);
    return c.json({ error: 'Failed to approve editorial feedback' }, 500);
  }
});

// 編集・校正指摘の却下（建設的でない）
app.post('/:id/reject-editorial', async (c) => {
  const db = getDatabase();
  const { id } = c.req.param();
  
  try {
    const body = await c.req.json();
    const { moderator_id, reason } = body;
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION');
      
      // 投稿を拒否済みに変更
      db.run(`
        UPDATE posts 
        SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND JSON_EXTRACT(detected_risks, '$') LIKE '%editorial_feedback%'
      `, [id], function(updateErr) {
        if (updateErr) {
          db.run('ROLLBACK');
          reject(updateErr);
          return;
        }
        
        // モデレーションログに記録
        db.run(`
          INSERT INTO moderation_logs (post_id, action, moderator_id, reason, created_at)
          VALUES (?, 'reject_editorial', ?, ?, CURRENT_TIMESTAMP)
        `, [id, moderator_id, reason || '編集・校正指摘として不適切'], function(logErr) {
          if (logErr) {
            db.run('ROLLBACK');
            reject(logErr);
            return;
          }
          
          db.run('COMMIT');
          resolve();
        });
      });
    });
    
    db.close();
    
    return c.json({ 
      message: 'Editorial feedback rejected successfully',
      post_id: parseInt(id)
    });
  } catch (error) {
    console.error('Error rejecting editorial feedback:', error);
    return c.json({ error: 'Failed to reject editorial feedback' }, 500);
  }
});

// クイックAI分析エンドポイント（フロントエンド用）
app.post('/quick-analysis', async (c) => {
  try {
    const body = await c.req.json();
    const { content, context } = body;
    
    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }
    
    console.log(`=== Quick AI Analysis Request ===`);
    console.log(`Content: ${content}`);
    console.log(`Context:`, context);
    console.log(`================================`);
    
    // AI分析実行（完全にOpenAI APIに依存）
    const analysis = await analyzeContent(content, context || {});
    
    console.log(`Quick AI analysis completed:`, analysis);
    
    return c.json({
      content,
      analysis,
      timestamp: new Date().toISOString(),
      ai_provider: analysis.ai_provider
    });
    
  } catch (error) {
    console.error('Error in quick analysis:', error);
    return c.json({ 
      error: 'AI analysis failed', 
      message: error.message,
      suggestion: 'Please check OpenAI API configuration'
    }, 500);
  }
});

module.exports = app;