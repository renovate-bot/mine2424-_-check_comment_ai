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

// 類似投稿検索
export const fetchSimilarPosts = async (postId: number): Promise<{
  target_post: {
    id: number;
    content: string;
    manga_title: string;
  };
  similar_posts: Array<{
    id: number;
    content: string;
    manga_title: string;
    ai_score: number;
    ai_analysis: any;
    detected_risks: string[];
    status: string;
    final_decision: string;
    decision_reason: string;
    moderator_id: string;
    created_at: string;
    decision_at: string;
  }>;
  keywords_used: string[];
}> => {
  const response = await apiClient.get(`/moderation/similar-posts/${postId}`);
  return response.data;
};

// ユーザー活動詳細フィルタリング
export interface UserActivityFilter {
  user_id?: string;
  min_posts?: number;
  max_posts?: number;
  min_avg_score?: number;
  max_avg_score?: number;
  risk_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  offset?: number;
}

export interface UserActivity {
  user_id: string;
  post_count: number;
  avg_score: number;
  min_score: number;
  max_score: number;
  approved_count: number;
  pending_count: number;
  rejected_count: number;
  harassment_count: number;
  spoiler_count: number;
  inappropriate_count: number;
  brand_damage_count: number;
  spam_count: number;
  personal_info_count: number;
  editorial_feedback_count: number;
  first_post_date: string;
  last_post_date: string;
  manga_count: number;
  manga_titles: string[];
  activity_days: number;
  posts_per_day: number;
  risk_score: number;
}

export const fetchUserActivity = async (filters: UserActivityFilter = {}): Promise<{
  users: UserActivity[];
  pagination: { total: number; limit: number; offset: number };
}> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await apiClient.get(`/moderation/user-activity?${queryParams.toString()}`);
  return response.data;
};

// 特定ユーザーの詳細分析
export interface UserDetailAnalysis {
  user_id: string;
  basic_stats: {
    user_id: string;
    total_posts: number;
    avg_score: number;
    min_score: number;
    max_score: number;
    approved_count: number;
    pending_count: number;
    rejected_count: number;
    first_post_date: string;
    last_post_date: string;
    manga_count: number;
    activity_days: number;
  };
  daily_activity: Array<{
    date: string;
    post_count: number;
    avg_score: number;
    approved_count: number;
    pending_count: number;
    rejected_count: number;
  }>;
  manga_activity: Array<{
    manga_title: string;
    post_count: number;
    avg_score: number;
    approved_count: number;
    rejected_count: number;
    first_post: string;
    last_post: string;
  }>;
  risk_analysis: {
    harassment_count: number;
    spoiler_count: number;
    inappropriate_count: number;
    brand_damage_count: number;
    spam_count: number;
    personal_info_count: number;
    editorial_feedback_count: number;
  };
  recent_posts: Array<{
    id: number;
    content: string;
    manga_title: string;
    status: string;
    ai_score: number;
    detected_risks: string[];
    created_at: string;
  }>;
}

export const fetchUserDetailAnalysis = async (userId: string, days = 30): Promise<UserDetailAnalysis> => {
  const response = await apiClient.get(`/moderation/user-activity/${userId}?days=${days}`);
  return response.data;
};