import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Send as SendIcon,
  Assessment as AnalysisIcon,
  Warning as WarningIcon,
  CheckCircle as SafeIcon,
  Error as DangerIcon,
  Movie as MangaIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { createQuickAnalysis } from '../services/api';

interface AnalysisResult {
  post_id: number;
  status: string;
  ai_score: number;
  ai_analysis?: {
    overall_score: number;
    risks: Record<string, number>;
    reasoning: string;
    detected_issues: string[];
    detected_risks: string[];
  };
}

const RISK_LABELS: Record<string, string> = {
  harassment: '誹謗中傷',
  spoiler: 'ネタバレ',
  inappropriate_content: '不適切コンテンツ',
  brand_damage: 'ブランド毀損',
  spam: 'スパム',
  personal_info: '個人情報',
  editorial_feedback: '編集・校正指摘',
};

const SAMPLE_COMMENTS = [
  '本当に面白い漫画です！次回が楽しみ',
  '犯人は田中先生でした。最終話で明かされます',
  'この作者の作品はクソつまらない。時間の無駄',
  '連絡先: 090-1234-5678 何かあれば連絡ください',
  'この漫画のファンサイト作りました！ http://example.com',
  '主人公が最後に死ぬなんて予想外でした',
];

const QuickAnalysis: React.FC = () => {
  const [content, setContent] = useState('');
  const [mangaTitle, setMangaTitle] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState<number | ''>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<Array<{
    content: string;
    result: AnalysisResult;
    timestamp: Date;
  }>>([]);

  const analysisMutation = useMutation({
    mutationFn: (data: {
      content: string;
      manga_title?: string;
      episode_number?: number;
    }) => createQuickAnalysis(data),
    onSuccess: (result) => {
      setAnalysisResult(result);
      setAnalysisHistory(prev => [{
        content,
        result,
        timestamp: new Date(),
      }, ...prev.slice(0, 4)]); // 最新5件を保持
    },
  });

  const handleAnalyze = () => {
    if (!content.trim()) return;
    
    analysisMutation.mutate({
      content: content.trim(),
      manga_title: mangaTitle || undefined,
      episode_number: episodeNumber || undefined,
    });
  };

  const handleClear = () => {
    setContent('');
    setMangaTitle('');
    setEpisodeNumber('');
    setAnalysisResult(null);
  };

  const loadSampleComment = (comment: string) => {
    setContent(comment);
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'error';
    if (score >= 0.5) return 'warning';
    if (score >= 0.3) return 'info';
    return 'success';
  };

  const getOverallRiskLevel = (score: number) => {
    if (score >= 0.8) return { level: 'high', color: 'error', icon: <DangerIcon />, label: '高リスク' };
    if (score >= 0.5) return { level: 'medium', color: 'warning', icon: <WarningIcon />, label: '中リスク' };
    if (score >= 0.3) return { level: 'low', color: 'info', icon: <WarningIcon />, label: '低リスク' };
    return { level: 'safe', color: 'success', icon: <SafeIcon />, label: '安全' };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <AnalysisIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        クイックAI分析
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        発見したコメントを即座にAI判定できます。問題のあるコメントを見つけた際にお使いください。
      </Typography>

      <Grid container spacing={3}>
        {/* 入力エリア */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                コメント分析
              </Typography>
              
              {/* 作品情報 */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="漫画タイトル"
                    placeholder="例: 進撃の巨人"
                    value={mangaTitle}
                    onChange={(e) => setMangaTitle(e.target.value)}
                    size="small"
                    InputProps={{
                      startAdornment: <MangaIcon sx={{ color: 'action.active', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="話数"
                    placeholder="例: 1"
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value ? parseInt(e.target.value) : '')}
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* コメント入力 */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="分析するコメント"
                placeholder="分析したいコメントを入力してください..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* サンプルコメント */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  サンプルコメント:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {SAMPLE_COMMENTS.map((comment, index) => {
                    const displayText = comment.length > 20 ? `${comment.slice(0, 20)}...` : comment;
                    return (
                      <Chip
                        key={index}
                        label={displayText}
                        size="small"
                        onClick={() => loadSampleComment(comment)}
                        sx={{ cursor: 'pointer' }}
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Box>

              {/* アクションボタン */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={analysisMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={handleAnalyze}
                  disabled={!content.trim() || analysisMutation.isPending}
                >
                  {analysisMutation.isPending ? '分析中...' : 'AI分析実行'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClear}
                  disabled={analysisMutation.isPending}
                >
                  クリア
                </Button>
              </Box>

              {/* エラー表示 */}
              {analysisMutation.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  分析中にエラーが発生しました。再度お試しください。
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* 分析結果 */}
          {analysisResult && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  分析結果
                </Typography>
                
                {/* 総合判定 */}
                <Box sx={{ mb: 3 }}>
                  {(() => {
                    const risk = getOverallRiskLevel(analysisResult.ai_score);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip
                          icon={risk.icon}
                          label={`${risk.label} (${(analysisResult.ai_score * 100).toFixed(1)}%)`}
                          color={risk.color as any}
                          size="medium"
                        />
                        <Typography variant="body2" color="textSecondary">
                          投稿ID: {analysisResult.post_id} | ステータス: {analysisResult.status}
                        </Typography>
                      </Box>
                    );
                  })()}
                </Box>

                {/* リスク詳細 */}
                {analysisResult.ai_analysis && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      リスク分析詳細:
                    </Typography>
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      {Object.entries(analysisResult.ai_analysis.risks).map(([risk, score]) => (
                        score > 0 && (
                          <Grid item key={risk}>
                            <Chip
                              label={`${RISK_LABELS[risk] || risk}: ${(score * 100).toFixed(1)}%`}
                              color={getRiskColor(score)}
                              size="small"
                              variant="outlined"
                            />
                          </Grid>
                        )
                      ))}
                    </Grid>
                    
                    <Typography variant="body2" color="textSecondary">
                      <strong>判定理由:</strong> {analysisResult.ai_analysis.reasoning}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* 分析履歴 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                分析履歴
              </Typography>
              
              {analysisHistory.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  まだ分析履歴がありません
                </Typography>
              ) : (
                <List dense>
                  {analysisHistory.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {(() => {
                            const risk = getOverallRiskLevel(item.result.ai_score);
                            return risk.icon;
                          })()}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}>
                              {item.content}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                リスク: {(item.result.ai_score * 100).toFixed(1)}%
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatTime(item.timestamp)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < analysisHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* 使用方法 */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                使用方法
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary="1. 作品情報を入力（任意）"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary="2. 分析したいコメントを入力"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary="3. 「AI分析実行」ボタンをクリック"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary="4. 結果を確認してモデレーション判断"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickAnalysis;