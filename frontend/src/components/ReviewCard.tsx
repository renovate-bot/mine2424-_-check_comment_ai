import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { Post, approvePost, rejectPost } from '../services/api';

interface ReviewCardProps {
  post: Post;
  onReviewComplete: () => void;
}

const REJECTION_REASONS = [
  'ネタバレを含むため',
  '誹謗中傷的な内容',
  '不適切な表現',
  'スパム・広告',
  '個人情報を含む',
  '編集・校正指摘として不適切',
  'その他',
];

const RISK_LABELS: Record<string, string> = {
  harassment: '誹謗中傷',
  spoiler: 'ネタバレ',
  inappropriate_content: '不適切コンテンツ',
  brand_damage: 'ブランド毀損',
  spam: 'スパム',
  personal_info: '個人情報',
  editorial_feedback: '編集・校正指摘',
};

const ReviewCard: React.FC<ReviewCardProps> = ({ post, onReviewComplete }) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => approvePost(post.id, 'moderator_1'),
    onSuccess: () => {
      onReviewComplete();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPost(post.id, 'moderator_1', rejectionReason),
    onSuccess: () => {
      setRejectDialogOpen(false);
      setRejectionReason('');
      onReviewComplete();
    },
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectionReason) return;
    rejectMutation.mutate();
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'error';
    if (score >= 0.5) return 'warning';
    return 'info';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" component="div">
              投稿ID: {post.id}
            </Typography>
            <Chip
              icon={<WarningIcon />}
              label={`AI スコア: ${(post.ai_score * 100).toFixed(1)}%`}
              color={getRiskColor(post.ai_score)}
              size="small"
            />
          </Box>

          <Box mb={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <PersonIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              ユーザー: {post.user_id}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <TimeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              投稿日時: {formatDate(post.created_at)}
            </Typography>
            {post.manga_title && (
              <Typography variant="body2" color="textSecondary">
                作品: {post.manga_title}
                {post.episode_number && ` 第${post.episode_number}話`}
              </Typography>
            )}
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              投稿内容:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                backgroundColor: 'grey.100',
                p: 1,
                borderRadius: 1,
                maxHeight: 100,
                overflow: 'auto',
              }}
            >
              {post.content}
            </Typography>
          </Box>

          {post.detected_risks.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                検出されたリスク:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {post.detected_risks.map((risk) => (
                  <Chip
                    key={risk}
                    label={RISK_LABELS[risk] || risk}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {post.ai_analysis && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                AI判定理由:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {post.ai_analysis.reasoning}
              </Typography>

              {post.ai_analysis.detected_issues.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" display="block" gutterBottom>
                    検出された問題:
                  </Typography>
                  {post.ai_analysis.detected_issues.map((issue, index) => (
                    <Typography key={index} variant="caption" display="block" color="textSecondary">
                      • {issue}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </CardContent>

        <Divider />

        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={handleApprove}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            承認
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => setRejectDialogOpen(true)}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            拒否
          </Button>
        </CardActions>

        {(approveMutation.isPending || rejectMutation.isPending) && (
          <LinearProgress />
        )}
      </Card>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>投稿を拒否</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            拒否理由を選択してください。この理由はユーザーに通知されます。
          </Typography>
          <TextField
            select
            fullWidth
            label="拒否理由"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            margin="normal"
          >
            {REJECTION_REASONS.map((reason) => (
              <MenuItem key={reason} value={reason}>
                {reason}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={rejectMutation.isPending}>
            キャンセル
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectionReason || rejectMutation.isPending}
          >
            拒否する
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReviewCard;