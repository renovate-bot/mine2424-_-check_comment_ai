import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { fetchPendingPosts } from '../services/api';
import ReviewList from '../components/ReviewList';

const ReviewQueue: React.FC = () => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['pending-posts'],
    queryFn: () => fetchPendingPosts(50, 0),
    refetchInterval: 30000, // 30秒ごとに自動更新
  });

  const handleReviewComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
    queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
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
      <Box>
        <Typography variant="h4" gutterBottom>
          レビューキュー
        </Typography>
        <Alert severity="error">
          データの読み込みに失敗しました。しばらく待ってから再試行してください。
        </Alert>
      </Box>
    );
  }

  const posts = data?.posts || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        レビューキュー
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        AI判定でレビューが必要とされた投稿の一覧です。各投稿を確認し、承認または拒否してください。
      </Typography>

      {posts.length === 0 ? (
        <Alert severity="info">
          現在レビュー待ちの投稿はありません。
        </Alert>
      ) : (
        <ReviewList posts={posts} onReviewComplete={handleReviewComplete} />
      )}
    </Box>
  );
};

export default ReviewQueue;