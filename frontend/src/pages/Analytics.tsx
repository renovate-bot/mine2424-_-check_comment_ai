import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Movie as MovieIcon,
} from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface AnalyticsData {
  period_days: number;
  daily_stats: Array<{ status: string; count: number; date: string }>;
  total_counts: Array<{ status: string; count: number }>;
  score_distribution: Array<{ score_range: string; count: number }>;
  risk_distribution: Record<string, number>;
  hourly_stats: Array<{ hour: string; count: number; avg_score: number }>;
  user_stats: Array<{
    user_id: string;
    post_count: number;
    avg_score: number;
    approved_count: number;
    pending_count: number;
    rejected_count: number;
  }>;
  manga_stats: Array<{
    manga_title: string;
    post_count: number;
    avg_score: number;
    approved_count: number;
    pending_count: number;
    rejected_count: number;
  }>;
  summary: {
    total_posts: number;
    posts_last_period: number;
    avg_daily_posts: number;
    risk_posts: number;
  };
}

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => 
      fetch(`http://localhost:5001/api/moderation/stats?days=${period}`)
        .then(res => res.json()) as Promise<AnalyticsData>,
    refetchInterval: 60000, // 1分間隔で自動更新
  });

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
        統計データの読み込みに失敗しました
      </Alert>
    );
  }

  if (!data) return null;

  // 日別投稿数のグラフ用データ準備
  const dailyChartData = data.daily_stats.reduce((acc, item) => {
    const existingDay = acc.find(day => day.date === item.date);
    if (existingDay) {
      existingDay[item.status] = item.count;
    } else {
      acc.push({
        date: item.date,
        [item.status]: item.count,
        approved: 0,
        pending: 0,
        rejected: 0,
        ...{ [item.status]: item.count }
      });
    }
    return acc;
  }, [] as Array<any>).reverse();

  // ステータス分布データ
  const statusPieData = data.total_counts.map(item => ({
    name: item.status === 'approved' ? '承認済み' : 
          item.status === 'pending' ? 'レビュー待ち' : '拒否済み',
    value: item.count,
    color: item.status === 'approved' ? '#4CAF50' :
           item.status === 'pending' ? '#FF9800' : '#F44336'
  }));

  // リスク分布データ
  const riskChartData = Object.entries(data.risk_distribution).map(([risk, count]) => ({
    name: risk === 'harassment' ? '誹謗中傷' :
          risk === 'spoiler' ? 'ネタバレ' :
          risk === 'inappropriate_content' ? '不適切コンテンツ' :
          risk === 'brand_damage' ? 'ブランド毀損' :
          risk === 'spam' ? 'スパム' :
          risk === 'personal_info' ? '個人情報' :
          risk === 'editorial_feedback' ? '編集・校正指摘' : risk,
    count: count
  }));

  // 時間別投稿数データ
  const hourlyChartData = data.hourly_stats.map(item => ({
    hour: `${item.hour}:00`,
    count: item.count,
    avg_score: parseFloat(item.avg_score?.toFixed(2) || '0')
  }));

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'success';
    if (score < 0.8) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AnalyticsIcon sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          統計分析
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>期間</InputLabel>
          <Select
            value={period}
            label="期間"
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            <MenuItem value={7}>過去7日間</MenuItem>
            <MenuItem value={30}>過去30日間</MenuItem>
            <MenuItem value={90}>過去90日間</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* サマリーカード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総投稿数
              </Typography>
              <Typography variant="h4">
                {data.summary.total_posts.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                期間内投稿数
              </Typography>
              <Typography variant="h4">
                {data.summary.posts_last_period.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                1日平均投稿数
              </Typography>
              <Typography variant="h4">
                {data.summary.avg_daily_posts.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                リスク検出投稿数
              </Typography>
              <Typography variant="h4" color="warning.main">
                {data.summary.risk_posts.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 日別投稿数推移 */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                投稿数推移（過去{period}日間）
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    stackId="1"
                    stroke="#4CAF50" 
                    fill="#4CAF50"
                    name="承認済み"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pending" 
                    stackId="1"
                    stroke="#FF9800" 
                    fill="#FF9800"
                    name="レビュー待ち"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rejected" 
                    stackId="1"
                    stroke="#F44336" 
                    fill="#F44336"
                    name="拒否済み"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ステータス分布 */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PieChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ステータス分布
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AIスコア分布 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AIスコア分布
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.score_distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score_range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* リスクタイプ分布 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                検出されたリスクタイプ
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 時間別投稿パターン */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                時間別投稿パターン
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="投稿数" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="avg_score" 
                    stroke="#ff7300" 
                    name="平均AIスコア"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ユーザー統計 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ユーザー活動トップ10
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ユーザーID</TableCell>
                      <TableCell align="right">投稿数</TableCell>
                      <TableCell align="right">平均スコア</TableCell>
                      <TableCell align="center">承認/待機/拒否</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.user_stats.slice(0, 10).map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.user_id}</TableCell>
                        <TableCell align="right">{user.post_count}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={user.avg_score.toFixed(2)}
                            color={getRiskColor(user.avg_score)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Chip label={user.approved_count} color="success" size="small" />
                            <Chip label={user.pending_count} color="warning" size="small" />
                            <Chip label={user.rejected_count} color="error" size="small" />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 漫画別統計 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MovieIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                漫画別投稿トップ10
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>作品名</TableCell>
                      <TableCell align="right">投稿数</TableCell>
                      <TableCell align="right">平均スコア</TableCell>
                      <TableCell align="center">承認/待機/拒否</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.manga_stats.slice(0, 10).map((manga) => (
                      <TableRow key={manga.manga_title}>
                        <TableCell>{manga.manga_title}</TableCell>
                        <TableCell align="right">{manga.post_count}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={manga.avg_score.toFixed(2)}
                            color={getRiskColor(manga.avg_score)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Chip label={manga.approved_count} color="success" size="small" />
                            <Chip label={manga.pending_count} color="warning" size="small" />
                            <Chip label={manga.rejected_count} color="error" size="small" />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;