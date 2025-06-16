import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  Paper,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  Button,
  Slider,
  FormControlLabel,
  Switch,
  Autocomplete,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  Movie as MangaIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { fetchPosts, Post } from '../services/api';

interface ExpandableRowProps {
  post: Post;
}

const ExpandableRow: React.FC<ExpandableRowProps> = ({ post }) => {
  const [open, setOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <ApprovedIcon fontSize="small" />;
      case 'pending': return <PendingIcon fontSize="small" />;
      case 'rejected': return <RejectedIcon fontSize="small" />;
      default: return null;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'error';
    if (score >= 0.5) return 'warning';
    if (score >= 0.3) return 'info';
    return 'success';
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
            icon={getStatusIcon(post.status) || undefined}
            label={getStatusLabel(post.status)}
            color={getStatusColor(post.status) as any}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Chip
            label={`${(post.ai_score * 100).toFixed(1)}%`}
            color={getRiskColor(post.ai_score)}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>
          {formatDate(post.created_at)}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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
                    <Typography variant="body2" color="text.secondary">
                      投稿日時: {formatDate(post.created_at)}
                    </Typography>
                    {post.updated_at !== post.created_at && (
                      <Typography variant="body2" color="text.secondary">
                        更新日時: {formatDate(post.updated_at)}
                      </Typography>
                    )}
                  </Box>

                  {(post.manga_title || post.episode_number) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        <MangaIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        作品情報
                      </Typography>
                      {post.manga_title && (
                        <Typography variant="body2" color="text.secondary">
                          作品: {post.manga_title}
                        </Typography>
                      )}
                      {post.episode_number && (
                        <Typography variant="body2" color="text.secondary">
                          話数: 第{post.episode_number}話
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      投稿内容
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
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
                      総合リスクスコア
                    </Typography>
                    <Chip
                      label={`${(post.ai_score * 100).toFixed(1)}%`}
                      color={getRiskColor(post.ai_score)}
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  {post.detected_risks.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        検出されたリスク
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {post.detected_risks.map((risk, index) => (
                          <Chip
                            key={index}
                            label={risk}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {post.ai_analysis && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        AI判定理由
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.ai_analysis.reasoning}
                      </Typography>
                      
                      {post.ai_analysis.detected_issues.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" display="block" gutterBottom>
                            検出された問題:
                          </Typography>
                          {post.ai_analysis.detected_issues.map((issue, index) => (
                            <Typography key={index} variant="caption" display="block" color="text.secondary">
                              • {issue}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  {(post.reviewed_by || post.reviewed_at) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        <TimeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        レビュー情報
                      </Typography>
                      {post.reviewed_by && (
                        <Typography variant="body2" color="text.secondary">
                          レビュー担当者: {post.reviewed_by}
                        </Typography>
                      )}
                      {post.reviewed_at && (
                        <Typography variant="body2" color="text.secondary">
                          レビュー日時: {formatDate(post.reviewed_at)}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const PostsList: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [mangaFilter, setMangaFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [scoreRange, setScoreRange] = useState<number[]>([0, 100]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // クエリパラメータの構築
  const buildQueryParams = () => {
    const params: Record<string, any> = {
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      sort_by: sortBy,
      sort_order: sortOrder
    };

    if (statusFilter !== 'all') params.status = statusFilter;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (userFilter.trim()) params.user_id = userFilter.trim();
    if (mangaFilter.trim()) params.manga_title = mangaFilter.trim();
    if (riskFilter !== 'all') params.risk_type = riskFilter;
    if (scoreRange[0] > 0) params.ai_score_min = scoreRange[0] / 100;
    if (scoreRange[1] < 100) params.ai_score_max = scoreRange[1] / 100;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    return params;
  };

  const queryParams = buildQueryParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['posts', queryParams],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      
      return fetch(`http://localhost:5001/api/posts?${searchParams.toString()}`)
        .then(res => res.json());
    },
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

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
    setUserFilter('');
    setMangaFilter('');
    setRiskFilter('all');
    setScoreRange([0, 100]);
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('DESC');
    setPage(0);
  };

  const riskOptions = [
    { value: 'all', label: '全て' },
    { value: 'harassment', label: '誹謗中傷' },
    { value: 'spoiler', label: 'ネタバレ' },
    { value: 'inappropriate_content', label: '不適切コンテンツ' },
    { value: 'brand_damage', label: 'ブランド毀損' },
    { value: 'spam', label: 'スパム' },
    { value: 'personal_info', label: '個人情報' },
    { value: 'editorial_feedback', label: '編集・校正指摘' },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        投稿データの読み込みに失敗しました
      </Alert>
    );
  }

  const posts = data?.posts || [];
  const totalCount = data?.pagination?.total || 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        全投稿一覧 ({totalCount}件)
      </Typography>

      {/* 検索とフィルター */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SearchIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              検索・フィルター
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showAdvancedFilters}
                  onChange={(e) => setShowAdvancedFilters(e.target.checked)}
                />
              }
              label="詳細フィルター"
            />
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ ml: 1 }}
            >
              クリア
            </Button>
          </Box>

          <Grid container spacing={2}>
            {/* 基本検索 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="投稿内容で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="キーワードを入力..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={statusFilter}
                  label="ステータス"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">全て</MenuItem>
                  <MenuItem value="approved">承認済み</MenuItem>
                  <MenuItem value="pending">レビュー待ち</MenuItem>
                  <MenuItem value="rejected">拒否済み</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>並び順</InputLabel>
                <Select
                  value={`${sortBy}_${sortOrder}`}
                  label="並び順"
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('_');
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                >
                  <MenuItem value="created_at_DESC">作成日時（新しい順）</MenuItem>
                  <MenuItem value="created_at_ASC">作成日時（古い順）</MenuItem>
                  <MenuItem value="ai_score_DESC">AIスコア（高い順）</MenuItem>
                  <MenuItem value="ai_score_ASC">AIスコア（低い順）</MenuItem>
                  <MenuItem value="user_id_ASC">ユーザーID（昇順）</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 詳細フィルター */}
            {showAdvancedFilters && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="ユーザーID"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    placeholder="ユーザーIDで絞り込み..."
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="漫画タイトル"
                    value={mangaFilter}
                    onChange={(e) => setMangaFilter(e.target.value)}
                    placeholder="漫画タイトルで絞り込み..."
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>リスクタイプ</InputLabel>
                    <Select
                      value={riskFilter}
                      label="リスクタイプ"
                      onChange={(e) => setRiskFilter(e.target.value as string)}
                    >
                      {riskOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    AIスコア範囲: {scoreRange[0]}% - {scoreRange[1]}%
                  </Typography>
                  <Slider
                    value={scoreRange}
                    onChange={(_, newValue) => setScoreRange(newValue as number[])}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                    min={0}
                    max={100}
                    step={5}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="開始日"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="終了日"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* テーブル */}
      <TableContainer component={Paper}>
        <Table aria-label="posts table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>ID</TableCell>
              <TableCell>ユーザー</TableCell>
              <TableCell>投稿内容</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>AIスコア</TableCell>
              <TableCell>投稿日時</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    条件に一致する投稿が見つかりませんでした
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <ExpandableRow key={post.id} post={post} />
              ))
            )}
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
        labelRowsPerPage="表示件数:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} / ${count !== -1 ? count : `${to}以上`}`
        }
      />
    </Box>
  );
};

export default PostsList;