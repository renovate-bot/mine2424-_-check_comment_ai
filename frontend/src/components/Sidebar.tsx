import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  RateReview as ReviewIcon,
  Analytics as AnalyticsIcon,
  Assessment as QuickAnalysisIcon,
  PostAdd as CreatePostIcon,
  Edit as EditorialIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  { text: 'ダッシュボード', icon: <DashboardIcon />, path: '/' },
  { text: 'レビューキュー', icon: <ReviewIcon />, path: '/review' },
  { text: '編集・校正指摘', icon: <EditorialIcon />, path: '/editorial-feedback' },
  { text: 'クイックAI分析', icon: <QuickAnalysisIcon />, path: '/quick-analysis' },
  { text: '新規投稿作成', icon: <CreatePostIcon />, path: '/create-post' },
  { text: '分析', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'ユーザー活動分析', icon: <PeopleIcon />, path: '/user-analytics' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" noWrap component="div">
            Monitor Comment AI
          </Typography>
        </Box>
      </Toolbar>
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;