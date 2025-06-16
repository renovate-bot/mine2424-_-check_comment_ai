import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  Edit as EditorialIcon,
  Assessment as StatsIcon,
  List as ListIcon,
} from '@mui/icons-material';
import { fetchModerationStats, fetchEditorialFeedbackStats } from '../services/api';
import PostsList from '../components/PostsList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['moderation-stats'],
    queryFn: fetchModerationStats,
  });

  const { data: editorialStats } = useQuery({
    queryKey: ['editorial-feedback-stats'],
    queryFn: fetchEditorialFeedbackStats,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        データの読み込みに失敗しました
      </Typography>
    );
  }

  const totalCounts = stats?.total_counts || [];
  const getCount = (status: string) => {
    const item = totalCounts.find((item: any) => item.status === status);
    return item?.count || 0;
  };

  const statCards = [
    {
      title: '承認済み投稿',
      count: getCount('approved'),
      icon: <ApprovedIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success.light',
    },
    {
      title: 'レビュー待ち',
      count: getCount('pending'),
      icon: <PendingIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning.light',
    },
    {
      title: '拒否された投稿',
      count: getCount('rejected'),
      icon: <RejectedIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      color: 'error.light',
    },
    {
      title: '編集・校正指摘',
      count: editorialStats?.total || 0,
      icon: <EditorialIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info.light',
      subtitle: `未処理: ${editorialStats?.pending || 0}件`,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI監視システム ダッシュボード
      </Typography>
      
      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4">
                      {card.count.toLocaleString()}
                    </Typography>
                    {(card as any).subtitle && (
                      <Typography variant="body2" color="textSecondary">
                        {(card as any).subtitle}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ 
                    backgroundColor: card.color, 
                    borderRadius: '50%', 
                    p: 1,
                    opacity: 0.1,
                    position: 'relative'
                  }}>
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      {card.icon}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* タブナビゲーション */}
      <Card sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab
              icon={<StatsIcon />}
              label="システム概要"
              id="dashboard-tab-0"
              aria-controls="dashboard-tabpanel-0"
            />
            <Tab
              icon={<ListIcon />}
              label="全投稿一覧"
              id="dashboard-tab-1"
              aria-controls="dashboard-tabpanel-1"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            <StatsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            システム概要
          </Typography>
          <Typography variant="body2" color="textSecondary">
            このダッシュボードでは、ユーザーの投稿コンテンツに対するAI監視システムの運用状況を確認できます。
            レビュー待ちの投稿は「レビューキュー」から確認し、承認・拒否の判断を行ってください。
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PostsList />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Dashboard;