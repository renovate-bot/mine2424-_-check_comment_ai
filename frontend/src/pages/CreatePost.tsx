import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Send as SendIcon,
  PostAdd as PostIcon,
  Person as PersonIcon,
  Movie as MangaIcon,
  Clear as ClearIcon,
  CheckCircle as SuccessIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { createPost } from '../services/api';

interface PostSubmissionResult {
  post_id: number;
  status: string;
  message: string;
}

interface PostHistory {
  id: number;
  user_id: string;
  content: string;
  status: string;
  manga_title?: string;
  episode_number?: number;
  timestamp: Date;
}

const SAMPLE_USERS = [
  'test_user_001',
  'manga_fan_123',
  'review_writer',
  'casual_reader',
  'spoiler_user',
];

const POPULAR_MANGA = [
  'ワンピース',
  '進撃の巨人',
  '鬼滅の刃',
  '呪術廻戦',
  '僕のヒーローアカデミア',
  'ドラゴンボール',
  'ナルト',
  '銀魂',
];

const SAMPLE_COMMENTS = {
  normal: [
    'この漫画本当に面白いです！',
    '作画がとても綺麗ですね',
    'キャラクターがみんな魅力的',
    '次回が楽しみです',
    'おすすめの漫画教えてください',
  ],
  spoiler: [
    '犯人は○○でした',
    '最終回で主人公が死ぬ',
    'ラスボスの正体は○○',
    '次回で重要キャラが退場',
    '隠されていた秘密が明らかに',
  ],
  inappropriate: [
    'この作者の作品はクソつまらない',
    '時間の無駄だった',
    'こんな漫画読むやつの気が知れない',
    '作者は才能がない',
    '最悪の展開',
  ],
  spam: [
    '私のサイトをチェックしてください http://example.com',
    '格安で漫画売ります。連絡ください',
    'フォロバします！',
    '相互フォローお願いします',
    '私のYouTubeチャンネル登録してください',
  ],
};

const CreatePost: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [content, setContent] = useState('');
  const [mangaTitle, setMangaTitle] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState<number | ''>('');
  const [contentType, setContentType] = useState('text');
  const [submissionResult, setSubmissionResult] = useState<PostSubmissionResult | null>(null);
  const [postHistory, setPostHistory] = useState<PostHistory[]>([]);

  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: (postData: {
      user_id: string;
      content: string;
      content_type: string;
      manga_title?: string;
      episode_number?: number;
    }) => createPost(postData),
    onSuccess: (result) => {
      setSubmissionResult({
        post_id: result.post_id,
        status: result.status,
        message: result.message,
      });
      
      // 投稿履歴に追加
      setPostHistory(prev => [{
        id: result.post_id,
        user_id: userId,
        content,
        status: result.status,
        manga_title: mangaTitle || undefined,
        episode_number: episodeNumber || undefined,
        timestamp: new Date(),
      }, ...prev.slice(0, 9)]); // 最新10件を保持

      // 他のクエリを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
    },
  });

  const handleSubmit = () => {
    if (!userId.trim() || !content.trim()) return;
    
    createPostMutation.mutate({
      user_id: userId.trim(),
      content: content.trim(),
      content_type: contentType,
      manga_title: mangaTitle || undefined,
      episode_number: episodeNumber || undefined,
    });
  };

  const handleClear = () => {
    setUserId('');
    setContent('');
    setMangaTitle('');
    setEpisodeNumber('');
    setContentType('text');
    setSubmissionResult(null);
  };

  const loadSampleUser = (user: string) => {
    setUserId(user);
  };

  const loadSampleManga = (manga: string) => {
    setMangaTitle(manga);
  };

  const loadSampleComment = (comment: string) => {
    setContent(comment);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <SuccessIcon color="success" />;
      case 'pending': return <PendingIcon color="warning" />;
      case 'rejected': return <RejectedIcon color="error" />;
      default: return <PendingIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return '承認済み';
      case 'pending': return 'レビュー待ち';
      case 'rejected': return '拒否済み';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <PostIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        新規投稿作成
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        ユーザー投稿をシミュレートしてAI監視システムの動作を確認できます。テスト目的やデモンストレーション用にご利用ください。
      </Typography>

      <Grid container spacing={3}>
        {/* 投稿作成エリア */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                投稿情報
              </Typography>
              
              {/* ユーザー情報 */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="ユーザーID"
                    placeholder="例: manga_fan_123"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    size="small"
                    required
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ color: 'action.active', mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>コンテンツタイプ</InputLabel>
                    <Select
                      value={contentType}
                      label="コンテンツタイプ"
                      onChange={(e) => setContentType(e.target.value)}
                    >
                      <MenuItem value="text">テキスト</MenuItem>
                      <MenuItem value="image">画像</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* サンプルユーザー */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  サンプルユーザー:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {SAMPLE_USERS.map((user, index) => (
                    <Chip
                      key={index}
                      label={user}
                      size="small"
                      onClick={() => loadSampleUser(user)}
                      sx={{ cursor: 'pointer' }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 作品情報 */}
              <Typography variant="subtitle1" gutterBottom>
                作品情報（任意）
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="漫画タイトル"
                    placeholder="例: ワンピース"
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
                    placeholder="例: 1001"
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value ? parseInt(e.target.value) : '')}
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* 人気漫画 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  人気漫画:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {POPULAR_MANGA.map((manga, index) => (
                    <Chip
                      key={index}
                      label={manga}
                      size="small"
                      onClick={() => loadSampleManga(manga)}
                      sx={{ cursor: 'pointer' }}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* コメント入力 */}
              <Typography variant="subtitle1" gutterBottom>
                投稿内容
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="投稿内容"
                placeholder="投稿したい内容を入力してください..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 2 }}
                required
              />

              {/* サンプルコメント */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  サンプルコメント:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" display="block" gutterBottom>
                      通常コメント:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {SAMPLE_COMMENTS.normal.map((comment, index) => (
                        <Chip
                          key={index}
                          label={comment}
                          size="small"
                          onClick={() => loadSampleComment(comment)}
                          sx={{ cursor: 'pointer' }}
                          variant="outlined"
                          color="success"
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" display="block" gutterBottom>
                      ネタバレ:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {SAMPLE_COMMENTS.spoiler.map((comment, index) => (
                        <Chip
                          key={index}
                          label={comment}
                          size="small"
                          onClick={() => loadSampleComment(comment)}
                          sx={{ cursor: 'pointer' }}
                          variant="outlined"
                          color="warning"
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" display="block" gutterBottom>
                      不適切:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {SAMPLE_COMMENTS.inappropriate.map((comment, index) => (
                        <Chip
                          key={index}
                          label={comment}
                          size="small"
                          onClick={() => loadSampleComment(comment)}
                          sx={{ cursor: 'pointer' }}
                          variant="outlined"
                          color="error"
                        />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" display="block" gutterBottom>
                      スパム:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {SAMPLE_COMMENTS.spam.map((comment, index) => (
                        <Chip
                          key={index}
                          label={comment}
                          size="small"
                          onClick={() => loadSampleComment(comment)}
                          sx={{ cursor: 'pointer' }}
                          variant="outlined"
                          color="info"
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* アクションボタン */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={createPostMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                  onClick={handleSubmit}
                  disabled={!userId.trim() || !content.trim() || createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? '投稿中...' : '投稿作成'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClear}
                  disabled={createPostMutation.isPending}
                >
                  クリア
                </Button>
              </Box>

              {/* エラー表示 */}
              {createPostMutation.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  投稿の作成中にエラーが発生しました。再度お試しください。
                </Alert>
              )}

              {/* 成功表示 */}
              {submissionResult && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    投稿が正常に作成されました！
                  </Typography>
                  <Typography variant="body2">
                    投稿ID: {submissionResult.post_id} | 
                    ステータス: {getStatusLabel(submissionResult.status)} | 
                    メッセージ: {submissionResult.message}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 投稿履歴・ガイド */}
        <Grid item xs={12} md={4}>
          {/* 投稿履歴 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                投稿履歴
              </Typography>
              
              {postHistory.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  まだ投稿履歴がありません
                </Typography>
              ) : (
                <List dense>
                  {postHistory.map((post, index) => (
                    <React.Fragment key={post.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getStatusIcon(post.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="body2" sx={{ 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }}>
                                {post.content}
                              </Typography>
                              <Chip
                                label={getStatusLabel(post.status)}
                                color={getStatusColor(post.status) as any}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                ID: {post.id} | {post.user_id}
                              </Typography>
                              {post.manga_title && (
                                <Typography variant="caption" display="block">
                                  {post.manga_title}{post.episode_number ? ` #${post.episode_number}` : ''}
                                </Typography>
                              )}
                              <Typography variant="caption" color="textSecondary">
                                {formatTime(post.timestamp)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < postHistory.length - 1 && <Divider />}
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
                    primary="1. ユーザーIDを入力"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary="2. 作品情報を入力（任意）"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary="3. 投稿内容を入力"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary="4. 投稿作成ボタンをクリック"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemText 
                    primary="5. AI分析結果を他の画面で確認"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                期待される動作:
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemText 
                    primary="通常コメント → 自動承認"
                    primaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemText 
                    primary="ネタバレ・不適切 → レビュー待ち"
                    primaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.25 }}>
                  <ListItemText 
                    primary="個人情報・重大違反 → 自動拒否"
                    primaryTypographyProps={{ variant: 'caption' }}
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

export default CreatePost;