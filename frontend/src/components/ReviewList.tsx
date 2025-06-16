import React from 'react';
import { Grid } from '@mui/material';
import { Post } from '../services/api';
import ReviewCard from './ReviewCard';

interface ReviewListProps {
  posts: Post[];
  onReviewComplete: () => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ posts, onReviewComplete }) => {
  return (
    <Grid container spacing={3}>
      {posts.map((post) => (
        <Grid item xs={12} md={6} lg={4} key={post.id}>
          <ReviewCard post={post} onReviewComplete={onReviewComplete} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ReviewList;