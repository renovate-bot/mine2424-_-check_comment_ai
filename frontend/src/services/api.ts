import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface Post {
  id: number;
  user_id: string;
  content: string;
  content_type: string;
  image_url?: string;
  manga_title?: string;
  episode_number?: number;
  status: 'pending' | 'approved' | 'rejected';
  ai_score: number;
  ai_analysis: {
    overall_score: number;
    risks: Record<string, number>;
    reasoning: string;
    detected_issues: string[];
    detected_risks: string[];
  } | null;
  detected_risks: string[];
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface ModerationStats {
  daily_stats: Array<{
    status: string;
    count: number;
    date: string;
  }>;
  total_counts: Array<{
    status: string;
    count: number;
  }>;
}

export const fetchPosts = async (status?: string, limit = 50, offset = 0): Promise<{ posts: Post[]; pagination: { limit: number; offset: number; total: number } }> => {
  let url = `/posts?limit=${limit}&offset=${offset}`;
  if (status) {
    url += `&status=${status}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

export const fetchPendingPosts = async (limit = 20, offset = 0): Promise<{ posts: Post[] }> => {
  const response = await apiClient.get(`/moderation/pending?limit=${limit}&offset=${offset}`);
  return response.data;
};

export const fetchModerationStats = async (): Promise<ModerationStats> => {
  const response = await apiClient.get('/moderation/stats');
  return response.data;
};

export const approvePost = async (postId: number, moderatorId: string, reason?: string) => {
  const response = await apiClient.post(`/moderation/${postId}/approve`, {
    moderator_id: moderatorId,
    reason: reason || '承認',
  });
  return response.data;
};

export const rejectPost = async (postId: number, moderatorId: string, reason: string) => {
  const response = await apiClient.post(`/moderation/${postId}/reject`, {
    moderator_id: moderatorId,
    reason,
  });
  return response.data;
};

export const fetchPost = async (postId: number): Promise<{ post: Post }> => {
  const response = await apiClient.get(`/posts/${postId}`);
  return response.data;
};

export const createPost = async (postData: {
  user_id: string;
  content: string;
  content_type?: string;
  manga_title?: string;
  episode_number?: number;
}) => {
  const response = await apiClient.post('/posts', postData);
  return response.data;
};

export const createQuickAnalysis = async (postData: {
  content: string;
  manga_title?: string;
  episode_number?: number;
}): Promise<{
  post_id: number;
  status: string;
  ai_score: number;
  ai_analysis: {
    overall_score: number;
    risks: Record<string, number>;
    reasoning: string;
    detected_issues: string[];
    detected_risks: string[];
  };
}> => {
  // 投稿作成
  const createResponse = await apiClient.post('/posts', {
    user_id: 'quick_analysis_user',
    content: postData.content,
    content_type: 'text',
    manga_title: postData.manga_title,
    episode_number: postData.episode_number,
  });
  
  // 少し待ってからAI分析結果を取得
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 投稿詳細を取得してAI分析結果を含める
  const detailResponse = await apiClient.get(`/posts/${createResponse.data.post_id}`);
  
  return {
    post_id: detailResponse.data.post.id,
    status: detailResponse.data.post.status,
    ai_score: detailResponse.data.post.ai_score,
    ai_analysis: detailResponse.data.post.ai_analysis,
  };
};

// 編集・校正指摘専用API
export const fetchEditorialFeedback = async (
  status?: string, 
  limit = 20, 
  offset = 0, 
  sort_by = 'created_at', 
  sort_order = 'DESC'
): Promise<{ posts: Post[]; pagination: { limit: number; offset: number; total: number } }> => {
  let url = `/moderation/editorial-feedback?limit=${limit}&offset=${offset}&sort_by=${sort_by}&sort_order=${sort_order}`;
  if (status && status !== 'all') {
    url += `&status=${status}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

export const approveEditorialFeedback = async (postId: number, moderatorId: string, reason?: string) => {
  const response = await apiClient.post(`/moderation/${postId}/approve-editorial`, {
    moderator_id: moderatorId,
    reason: reason || '編集・校正指摘として有効'
  });
  return response.data;
};

export const rejectEditorialFeedback = async (postId: number, moderatorId: string, reason?: string) => {
  const response = await apiClient.post(`/moderation/${postId}/reject-editorial`, {
    moderator_id: moderatorId,
    reason: reason || '編集・校正指摘として不適切'
  });
  return response.data;
};

// 編集・校正指摘の統計取得
export const fetchEditorialFeedbackStats = async (): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> => {
  const [totalRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
    fetchEditorialFeedback('all', 1, 0),
    fetchEditorialFeedback('pending', 1, 0),
    fetchEditorialFeedback('approved', 1, 0),
    fetchEditorialFeedback('rejected', 1, 0),
  ]);
  
  return {
    total: totalRes.pagination.total,
    pending: pendingRes.pagination.total,
    approved: approvedRes.pagination.total,
    rejected: rejectedRes.pagination.total,
  };
};