const { getDatabase } = require('../database/init');

const AUTO_APPROVE_THRESHOLD = parseFloat(process.env.AUTO_APPROVE_THRESHOLD) || 0.3;
const AUTO_REJECT_THRESHOLD = parseFloat(process.env.AUTO_REJECT_THRESHOLD) || 0.8;

async function processPostStatus(postId, analysis) {
  const db = getDatabase();
  
  try {
    let newStatus = 'pending';
    let action = 'ai_review';
    let moderatorNote = '';
    
    // AI分析結果に基づくステータス決定
    if (analysis.overall_score < AUTO_APPROVE_THRESHOLD) {
      newStatus = 'approved';
      action = 'auto_approve';
      moderatorNote = `AI判定による自動承認 (スコア: ${analysis.overall_score.toFixed(3)})`;
    } else if (analysis.overall_score >= AUTO_REJECT_THRESHOLD) {
      newStatus = 'rejected';
      action = 'auto_reject';
      moderatorNote = `AI判定による自動拒否 (スコア: ${analysis.overall_score.toFixed(3)})`;
    } else {
      moderatorNote = `AI判定により手動レビューが必要 (スコア: ${analysis.overall_score.toFixed(3)})`;
    }
    
    // AI分析結果の詳細なログ記録
    console.log(`=== AI Analysis Result for Post ${postId} ===`);
    console.log(`Overall Score: ${analysis.overall_score}`);
    console.log(`Status: ${newStatus}`);
    console.log(`Provider: ${analysis.ai_provider || 'unknown'}`);
    console.log(`Detected Risks:`, analysis.detected_risks);
    console.log(`Risk Breakdown:`, analysis.risks);
    console.log(`Reasoning: ${analysis.reasoning}`);
    console.log(`Detected Issues:`, analysis.detected_issues);
    console.log(`==========================================`);
    
    const analysisJson = JSON.stringify({
      ...analysis,
      processing_timestamp: new Date().toISOString(),
      thresholds: {
        auto_approve: AUTO_APPROVE_THRESHOLD,
        auto_reject: AUTO_REJECT_THRESHOLD
      }
    });
    const detectedRisksJson = JSON.stringify(analysis.detected_risks || []);
    
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION');
      
      db.run(`
        UPDATE posts 
        SET status = ?, ai_score = ?, ai_analysis = ?, detected_risks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newStatus, analysis.overall_score, analysisJson, detectedRisksJson, postId], function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        db.run(`
          INSERT INTO moderation_logs (post_id, action, reason, previous_status, new_status, moderator_id)
          VALUES (?, ?, ?, 'pending', ?, 'ai_system')
        `, [postId, action, `${analysis.reasoning}. ${moderatorNote}`, newStatus], function(err) {
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
    
    return {
      post_id: postId,
      status: newStatus,
      score: analysis.overall_score,
      action: action,
      ai_provider: analysis.ai_provider,
      detected_risks: analysis.detected_risks,
      message: `AI分析完了: ${newStatus === 'approved' ? '自動承認' : newStatus === 'rejected' ? '自動拒否' : '手動レビュー待ち'}`
    };
    
  } catch (error) {
    console.error('Error processing post status:', error);
    db.close();
    throw error;
  }
}

async function getModerationStats(days = 30) {
  const db = getDatabase();
  
  try {
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          action,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM moderation_logs 
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY action, DATE(created_at)
        ORDER BY date DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const riskStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          detected_risks,
          COUNT(*) as count
        FROM posts
        WHERE detected_risks != '[]' AND created_at >= date('now', '-${days} days')
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
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
    
    return {
      daily_actions: stats,
      risk_distribution: riskCounts,
      period_days: days
    };
    
  } catch (error) {
    console.error('Error getting moderation stats:', error);
    db.close();
    throw error;
  }
}

async function getPostsByRisk(riskType, limit = 20) {
  const db = getDatabase();
  
  try {
    const posts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM posts 
        WHERE detected_risks LIKE '%"${riskType}"%'
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    db.close();
    
    return posts.map(post => ({
      ...post,
      ai_analysis: post.ai_analysis ? JSON.parse(post.ai_analysis) : null,
      detected_risks: post.detected_risks ? JSON.parse(post.detected_risks) : []
    }));
    
  } catch (error) {
    console.error('Error getting posts by risk:', error);
    db.close();
    throw error;
  }
}

module.exports = {
  processPostStatus,
  getModerationStats,
  getPostsByRisk,
  AUTO_APPROVE_THRESHOLD,
  AUTO_REJECT_THRESHOLD
};