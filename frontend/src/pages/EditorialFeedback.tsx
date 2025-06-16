import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Collapse,
  Paper,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  KeyboardArrowUp,
  KeyboardArrowDown,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  Movie as MangaIcon,
} from '@mui/icons-material';
import { fetchEditorialFeedback, approveEditorialFeedback, rejectEditorialFeedback, Post } from '../services/api';

interface ExpandableRowProps {
  post: Post;
  onAction: () => void;
}

const ExpandableRow: React.FC<ExpandableRowProps> = ({ post, onAction }) => {
  const [open, setOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveReason, setApproveReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => approveEditorialFeedback(post.id, 'moderator_1', approveReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-feedback'] });
      setApproveDialogOpen(false);
      setApproveReason('');
      onAction();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectEditorialFeedback(post.id, 'moderator_1', rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-feedback'] });
      setRejectDialogOpen(false);
      setRejectReason('');
      onAction();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return '有効として承認';
      case 'pending': return 'レビュー待ち';
      case 'rejected': return '不適切として拒否';
      default: return status;
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'success';
    if (score < 0.8) return 'warning';
    return 'error';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const getEditorialFeedbackScore = () => {
    return post.ai_analysis?.risks?.editorial_feedback || 0;
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {post.id}
        </TableCell>
        <TableCell>{post.user_id}</TableCell>
        <TableCell>
          <Box sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.content}
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={`${(getEditorialFeedbackScore() * 100).toFixed(1)}%`}
            color={getRiskColor(getEditorialFeedbackScore())}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          <Chip
            label={getStatusLabel(post.status)}
            color={getStatusColor(post.status) as any}
            size="small"
          />
        </TableCell>
        <TableCell>
          {formatDate(post.created_at)}
        </TableCell>
        <TableCell>
          {post.status === 'pending' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<ApproveIcon />}
                onClick={() => setApproveDialogOpen(true)}
                disabled={approveMutation.isPending}
              >
                有効
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<RejectIcon />}
                onClick={() => setRejectDialogOpen(true)}
                disabled={rejectMutation.isPending}
              >
                却下
              </Button>
            </Box>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom component="div">
                    投稿詳細
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <PersonIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      ユーザー情報
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ユーザーID: {post.user_id}
                    </Typography>
                  </Box>

                  {post.manga_title && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        <MangaIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        作品情報
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.manga_title}
                        {post.episode_number && ` 第${post.episode_number}話`}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <TimeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      投稿時間
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(post.created_at)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      投稿内容
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="body2">
                        {post.content}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom component="div">
                    AI分析結果
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      編集・校正指摘スコア
                    </Typography>
                    <Chip
                      label={`${(getEditorialFeedbackScore() * 100).toFixed(1)}%`}
                      color={getRiskColor(getEditorialFeedbackScore())}
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  {post.ai_analysis && (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          全体AIスコア
                        </Typography>
                        <Chip
                          label={`${(post.ai_analysis.overall_score * 100).toFixed(1)}%`}
                          color={getRiskColor(post.ai_analysis.overall_score)}
                          sx={{ mb: 1 }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          AI判定理由
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {post.ai_analysis.reasoning}
                        </Typography>
                      </Box>

                      {post.ai_analysis.detected_issues.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            検出された問題点
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {post.ai_analysis.detected_issues.map((issue, index) => (
                              <Chip
                                key={index}
                                label={issue}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* 承認ダイアログ */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
        <DialogTitle>編集・校正指摘として承認</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            この投稿を「有効な編集・校正指摘」として承認しますか？
          </Typography>
          <TextField
            fullWidth
            label="承認理由（任意）"
            multiline
            rows={3}
            value={approveReason}
            onChange={(e) => setApproveReason(e.target.value)}
            placeholder="例: 有効な誤字指摘、建設的な改善提案など"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={() => approveMutation.mutate()} 
            color="success" 
            variant="contained"
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? <CircularProgress size={20} /> : '承認'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 却下ダイアログ */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>編集・校正指摘として却下</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            この投稿を「不適切な編集・校正指摘」として却下しますか？
          </Typography>
          <TextField
            fullWidth
            label="却下理由（任意）"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="例: 攻撃的な表現を含む、建設的でない批判など"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>キャンセル</Button>
          <Button 
            onClick={() => rejectMutation.mutate()} 
            color="error" 
            variant="contained"
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? <CircularProgress size={20} /> : '却下'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const EditorialFeedback: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  const { data, isLoading, error } = useQuery({
    queryKey: ['editorial-feedback', statusFilter, page, rowsPerPage, sortBy, sortOrder],
    queryFn: () => 
      fetchEditorialFeedback(statusFilter, rowsPerPage, page * rowsPerPage, sortBy, sortOrder),
    refetchInterval: 30000,
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleRefresh = () => {
    // Query will auto-refresh, we can manually trigger if needed
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        編集・校正指摘データの読み込みに失敗しました
      </Alert>
    );
  }

  const posts = data?.posts || [];
  const totalCount = data?.pagination?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <EditIcon sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          編集・校正指摘管理
        </Typography>
      </Box>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        ユーザーからの建設的な編集・校正指摘を確認し、有効な改善提案かどうかを判定します。
      </Typography>

      {/* フィルターとコントロール */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={statusFilter}
                  label="ステータス"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">全て</MenuItem>
                  <MenuItem value="pending">レビュー待ち</MenuItem>
                  <MenuItem value="approved">承認済み</MenuItem>
                  <MenuItem value="rejected">却下済み</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>並び順</InputLabel>
                <Select
                  value={`${sortBy}_${sortOrder}`}
                  label="並び順"
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('_');
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                    setPage(0);
                  }}
                >
                  <MenuItem value="created_at_DESC">作成日時（新しい順）</MenuItem>
                  <MenuItem value="created_at_ASC">作成日時（古い順）</MenuItem>
                  <MenuItem value="ai_score_DESC">AIスコア（高い順）</MenuItem>
                  <MenuItem value="ai_score_ASC">AIスコア（低い順）</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                編集・校正指摘投稿数: {totalCount}件
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* テーブル */}
      <TableContainer component={Paper}>
        <Table aria-label="編集・校正指摘テーブル">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>ID</TableCell>
              <TableCell>ユーザー</TableCell>
              <TableCell>内容</TableCell>
              <TableCell>指摘スコア</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>作成日時</TableCell>
              <TableCell>アクション</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <ExpandableRow
                key={post.id}
                post={post}
                onAction={handleRefresh}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ページネーション */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="1ページあたりの行数:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}–${to} / ${count !== -1 ? count : `${to}以上`}`
        }
      />
    </Box>
  );
};

export default EditorialFeedback;