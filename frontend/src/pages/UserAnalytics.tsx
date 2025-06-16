import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Button,
  Paper,
  Slider,
  Collapse,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { fetchUserActivity, UserActivityFilter, UserActivity } from '../services/api';

const RISK_TYPES = [
  { value: 'all', label: '全て' },
  { value: 'harassment', label: '誹謗中傷' },
  { value: 'spoiler', label: 'ネタバレ' },
  { value: 'inappropriate_content', label: '不適切コンテンツ' },
  { value: 'brand_damage', label: 'ブランド毀損' },
  { value: 'spam', label: 'スパム' },
  { value: 'personal_info', label: '個人情報' },
  { value: 'editorial_feedback', label: '編集・校正指摘' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: '全て' },
  { value: 'approved', label: '承認済み' },
  { value: 'pending', label: 'レビュー待ち' },
  { value: 'rejected', label: '拒否済み' },
];

const SORT_OPTIONS = [
  { value: 'post_count_DESC', label: '投稿数（多い順）' },
  { value: 'post_count_ASC', label: '投稿数（少ない順）' },
  { value: 'avg_score_DESC', label: '平均スコア（高い順）' },
  { value: 'avg_score_ASC', label: '平均スコア（低い順）' },
  { value: 'first_post_date_DESC', label: '初回投稿（新しい順）' },
  { value: 'first_post_date_ASC', label: '初回投稿（古い順）' },
  { value: 'last_post_date_DESC', label: '最終投稿（新しい順）' },
  { value: 'last_post_date_ASC', label: '最終投稿（古い順）' },
];

const UserAnalytics: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // フィルター状態
  const [filters, setFilters] = useState<UserActivityFilter>({
    user_id: '',
    min_posts: 1,
    max_posts: 1000,
    min_avg_score: 0,
    max_avg_score: 1,
    risk_type: 'all',
    status: 'all',
    date_from: '',
    date_to: '',
    sort_by: 'post_count',
    sort_order: 'DESC',
  });

  // API呼び出し用のフィルター
  const apiFilters = {
    ...filters,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-activity', apiFilters],
    queryFn: () => fetchUserActivity(apiFilters),
    refetchInterval: 60000, // 1分間隔で更新
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key: keyof UserActivityFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      user_id: '',
      min_posts: 1,
      max_posts: 1000,
      min_avg_score: 0,
      max_avg_score: 1,
      risk_type: 'all',
      status: 'all',
      date_from: '',
      date_to: '',
      sort_by: 'post_count',
      sort_order: 'DESC',
    });
    setPage(0);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    setFilters(prev => ({ ...prev, sort_by: sortBy, sort_order: sortOrder }));
    setPage(0);
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return 'error';
    if (score >= 0.4) return 'warning';
    return 'success';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getUserAvatar = (userId: string) => {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#00796b'];
    const colorIndex = userId.charCodeAt(0) % colors.length;
    return colors[colorIndex];
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
        ユーザー活動データの読み込みに失敗しました
      </Alert>
    );
  }

  const users = data?.users || [];
  const totalCount = data?.pagination?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PeopleIcon sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          ユーザー活動分析
        </Typography>
      </Box>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        ユーザーの投稿活動、リスクパターン、行動傾向を詳細に分析します。
      </Typography>

      {/* フィルターコントロール */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => setFiltersOpen(!filtersOpen)}>
              <ExpandMoreIcon sx={{ transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </IconButton>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              詳細フィルター
            </Typography>
            <Box sx={{ ml: 'auto' }}>
              <Button variant="outlined" size="small" onClick={handleClearFilters}>
                クリア
              </Button>
            </Box>
          </Box>

          <Collapse in={filtersOpen}>
            <Grid container spacing={2}>
              {/* ユーザーID検索 */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="ユーザーID"
                  size="small"
                  value={filters.user_id || ''}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  placeholder="部分一致で検索"
                />
              </Grid>

              {/* 投稿数範囲 */}
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  投稿数: {filters.min_posts} - {filters.max_posts}
                </Typography>
                <Slider
                  value={[filters.min_posts || 1, filters.max_posts || 1000]}
                  onChange={(_, newValue) => {
                    const [min, max] = newValue as number[];
                    handleFilterChange('min_posts', min);
                    handleFilterChange('max_posts', max);
                  }}
                  valueLabelDisplay="auto"
                  min={1}
                  max={1000}
                  size="small"
                />
              </Grid>

              {/* 平均スコア範囲 */}
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  平均スコア: {(filters.min_avg_score || 0).toFixed(2)} - {(filters.max_avg_score || 1).toFixed(2)}
                </Typography>
                <Slider
                  value={[filters.min_avg_score || 0, filters.max_avg_score || 1]}
                  onChange={(_, newValue) => {
                    const [min, max] = newValue as number[];
                    handleFilterChange('min_avg_score', min);
                    handleFilterChange('max_avg_score', max);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={1}
                  step={0.01}
                  size="small"
                />
              </Grid>

              {/* リスクタイプ */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>リスクタイプ</InputLabel>
                  <Select
                    value={filters.risk_type || 'all'}
                    label="リスクタイプ"
                    onChange={(e) => handleFilterChange('risk_type', e.target.value)}
                  >
                    {RISK_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* ステータス */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    value={filters.status || 'all'}
                    label="ステータス"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 日付範囲 */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="開始日"
                  type="date"
                  size="small"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="終了日"
                  type="date"
                  size="small"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* ソート */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>並び順</InputLabel>
                  <Select
                    value={`${filters.sort_by}_${filters.sort_order}`}
                    label="並び順"
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>

          {/* 統計サマリー */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="textSecondary">
              フィルター結果: {totalCount}ユーザー
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ユーザーテーブル */}
      <TableContainer component={Paper}>
        <Table aria-label="ユーザー活動テーブル">
          <TableHead>
            <TableRow>
              <TableCell>ユーザー</TableCell>
              <TableCell align="right">投稿数</TableCell>
              <TableCell align="right">平均スコア</TableCell>
              <TableCell align="right">承認率</TableCell>
              <TableCell align="right">リスクスコア</TableCell>
              <TableCell align="right">活動期間</TableCell>
              <TableCell align="right">投稿/日</TableCell>
              <TableCell>対象作品</TableCell>
              <TableCell align="right">アクション</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: UserActivity) => (
              <TableRow key={user.user_id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        mr: 1, 
                        bgcolor: getUserAvatar(user.user_id),
                        fontSize: '0.875rem'
                      }}
                    >
                      {user.user_id.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.user_id}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(user.first_post_date)} から
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    {user.post_count}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={user.avg_score.toFixed(3)}
                    color={getRiskColor(user.avg_score)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {((user.approved_count / user.post_count) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    ({user.approved_count}/{user.post_count})
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={user.risk_score.toFixed(3)}
                    color={getRiskColor(user.risk_score)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {user.activity_days}日
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {user.posts_per_day}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.manga_count}作品
                  </Typography>
                  {user.manga_titles.length > 0 && (
                    <Typography variant="caption" color="textSecondary" display="block">
                      {user.manga_titles.slice(0, 2).join(', ')}
                      {user.manga_titles.length > 2 && '...'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => {
                      // TODO: ユーザー詳細画面への遷移
                      console.log('詳細分析:', user.user_id);
                    }}
                  >
                    詳細
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ページネーション */}
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
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

export default UserAnalytics;