// Typed API Client for LearnQuest
// ALL API calls go through the Vite proxy (/api) to the backend.
// NO API keys or secrets exist in the frontend.

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  learner_type: 'school' | 'university' | 'engineering' | 'general';
  preferred_mode: 'school' | 'open' | 'game';
  display_avatar: string;
  school_name?: string | null;
  leaderboard_opt_in: boolean;
  theme: 'dark' | 'light' | 'system';
  class_id?: string | null;
  board_id?: string | null;
  stream_id?: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
  coins: number;
}

export interface MetaInfo {
  demoMode: boolean;
  aiAvailable: boolean;
  appEnv: string;
  showDemoBadge: boolean;
  version: string;
}

export interface Board {
  id: string;
  code: string;
  name: string;
}

export interface SchoolClass {
  id: string;
  grade: number;
  name: string;
}

export interface Stream {
  id: string;
  code: string;
  name: string;
}

export interface Subject {
  id: string;
  class_id: string;
  board_id: string;
  stream_id?: string | null;
  name: string;
  code: string;
  icon: string;
  color: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  order: number;
  topics?: Topic[];
}

export interface Subtopic {
  id: string;
  topic_id: string;
  title: string;
  order: number;
  concept_tag: string;
  prerequisite_subtopic_id?: string | null;
  mastery?: number;
  status?: 'unassessed' | 'weak' | 'needs_practice' | 'strong' | 'mastered';
}

export interface Topic {
  id: string;
  chapter_id?: string | null;
  title: string;
  description?: string | null;
  source: string;
  mode_origin: string;
  status: string;
  order: number;
  overall_mastery?: number;
  subtopics?: Subtopic[];
}

export interface Question {
  id: string;
  subtopic_id: string;
  difficulty: number;
  stem: string;
  options: string[];
  expected_time_seconds: number;
  concept_tag: string;
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_index: number;
  explanation: string;
  misconception_hint?: string | null;
  xp_awarded: number;
  new_mastery: number;
  new_status: string;
  new_difficulty: number;
  streak: number;
  level_up?: { old_level: number; new_level: number; title: string } | null;
  new_badges?: Array<{ code: string; name: string; emoji: string; description: string }>;
}

export interface Flashcard {
  id: string;
  subtopic_id: string;
  front: string;
  back: string;
  concept_tag: string;
  leitner_box: number;
  due_at?: string | null;
}

export interface RevisionItem {
  flashcard_id: string;
  subtopic_id: string;
  subtopic_title: string;
  concept_tag: string;
  front: string;
  back: string;
  leitner_box: number;
  re_explanation: string;
  visual_spec?: any;
  mini_practice_question?: {
    id: string;
    stem: string;
    options: string[];
    difficulty: number;
    explanation: string;
  } | null;
}

export interface ExplanationData {
  subtopic_id: string;
  subtopic_title: string;
  level: string;
  body_markdown: string;
  visual_spec?: any;
  source: string;
}

export interface ReportCard {
  test_id: string;
  topic_id: string;
  topic_title: string;
  score: number;
  total_questions: number;
  accuracy: number;
  duration_seconds: number;
  mastery_before: number;
  mastery_after: number;
  strong_areas: string[];
  needs_practice_areas: string[];
  weak_areas: string[];
  improving_areas: string[];
  recommended_next: {
    action?: string;
    reason_text?: string;
    subtopic_title?: string;
    subtopic_id?: string;
  };
  xp_earned: number;
  answers_review: Array<{
    stem: string;
    chosen_option: string;
    correct_option: string;
    is_correct: boolean;
    explanation: string;
    difficulty: number;
    time_taken_seconds: number;
  }>;
}

export interface Recommendation {
  id: string;
  topic_id: string;
  subtopic_id?: string | null;
  subtopic_title?: string | null;
  action: string;
  reason_text: string;
  priority: number;
  status: string;
}

export interface XPStatus {
  total_xp: number;
  level: number;
  level_title: string;
  current_level_xp: number;
  next_level_xp: number;
  progress_pct: number;
  week_xp: number;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  is_earned: boolean;
  earned_at?: string | null;
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  display_avatar: string;
  total_xp: number;
  level: number;
  is_current_user: boolean;
  school_name?: string | null;
}

export interface GameMission {
  id: string;
  code: string;
  name: string;
  region: string;
  description: string;
  stages: Array<{ stage: number; name: string; type: string; desc: string }>;
  current_stage: number;
  stars: number;
  is_completed: boolean;
}

export interface CosmeticItem {
  id: string;
  code: string;
  name: string;
  kind: string;
  cost: number;
  preview_svg?: string | null;
  description: string;
  is_owned: boolean;
  is_equipped: boolean;
}

export interface QuestItem {
  id: string;
  code: string;
  title: string;
  kind: string;
  target_count: number;
  current_count: number;
  xp_reward: number;
  coin_reward: number;
  is_completed: boolean;
  is_claimed: boolean;
}

export interface TutorResponse {
  conversation_id: string;
  message_id: string;
  reply: string;
  action_trigger?: 'explain' | 'test' | 'question' | 'practice' | null;
  action_payload?: any;
  visual_spec?: any;
  is_demo_fallback: boolean;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends httpOnly auth cookie
  });

  if (!res.ok) {
    let errorData = { message: 'An unexpected error occurred.' };
    try {
      const parsed = await res.json();
      errorData = parsed.error || parsed;
    } catch (_) {}
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Meta
  getMeta: () => request<MetaInfo>('/meta'),
  getAIHealth: () => request<any>('/ai/health'),

  // Auth
  signup: (data: { username: string; email: string; password: string }) =>
    request<UserProfile>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { username_or_email: string; password: string }) =>
    request<UserProfile>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getMe: () => request<UserProfile>('/auth/me'),
  updateProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  onboarding: (data: any) =>
    request<UserProfile>('/auth/me/onboarding', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: { token: string; new_password: string }) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  // Curriculum
  getClasses: () => request<SchoolClass[]>('/curriculum/classes'),
  getBoards: () => request<Board[]>('/curriculum/boards'),
  getStreams: () => request<Stream[]>('/curriculum/streams'),
  getSubjects: (params?: { class_id?: string; board_id?: string; stream_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<Subject[]>(`/curriculum/subjects${query ? '?' + query : ''}`);
  },
  getChapters: (subject_id: string) =>
    request<Chapter[]>(`/curriculum/chapters?subject_id=${subject_id}`),
  getTopics: (chapter_id?: string) =>
    request<Topic[]>(`/curriculum/topics${chapter_id ? '?chapter_id=' + chapter_id : ''}`),
  getTopicDetails: (id: string) => request<Topic>(`/curriculum/topics/${id}`),

  // Open Learning
  createOpenTopic: (data: { topic_text: string; learner_type?: string; level_hint?: string }) =>
    request<Topic>('/open/topics', { method: 'POST', body: JSON.stringify(data) }),
  getOpenTopics: () => request<Topic[]>('/open/topics'),
  getConversations: () => request<any[]>('/open/conversations'),

  // Learning Pipeline
  getExplanation: (subtopic_id: string, level?: string) =>
    request<ExplanationData>(`/learn/explanations?subtopic_id=${subtopic_id}${level ? '&level=' + level : ''}`),
  getTopicPipelineState: (topic_id: string) =>
    request<any>(`/learn/topics/${topic_id}/pipeline-state`),

  // Diagnostic
  startDiagnostic: (data: { topic_id: string; mode_used?: string }) =>
    request<{ diagnostic_id: string; topic_id: string; title: string }>('/diagnostic/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getNextDiagnosticQuestion: (diagnostic_id: string) =>
    request<{
      diagnostic_id: string;
      question?: Question | null;
      current_index: number;
      total_estimated: number;
      is_completed: boolean;
      summary?: any;
    }>(`/diagnostic/${diagnostic_id}/next`),
  submitDiagnosticAnswer: (diagnostic_id: string, data: { question_id: string; chosen_index: number; time_taken_seconds: number; hint_used?: boolean }) =>
    request<AnswerResponse>(`/diagnostic/${diagnostic_id}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  finishDiagnostic: (diagnostic_id: string) =>
    request<{ message: string; xp_earned: number; summary: any }>(`/diagnostic/${diagnostic_id}/finish`, {
      method: 'POST',
    }),

  // Tests & Assessments
  startTest: (data: { topic_id: string; type?: string; mode_used?: string; subtopic_id?: string }) =>
    request<{ test_id: string; topic_id: string; title: string; type: string }>('/tests/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getNextTestQuestion: (test_id: string) =>
    request<{
      test_id: string;
      question?: Question | null;
      question_number: number;
      total_questions: number;
      is_completed: boolean;
    }>(`/tests/${test_id}/next`),
  submitTestAnswer: (test_id: string, data: { question_id: string; chosen_index: number; time_taken_seconds: number; hint_used?: boolean }) =>
    request<AnswerResponse>(`/tests/${test_id}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  finishTest: (test_id: string) =>
    request<{
      test_id: string;
      score: number;
      total_questions: number;
      accuracy: number;
      xp_earned: number;
      level_up?: any;
      new_badges?: any[];
      recommended_next?: any;
    }>(`/tests/${test_id}/finish`, { method: 'POST' }),
  getTestReport: (test_id: string) => request<ReportCard>(`/tests/${test_id}/report`),

  // Flashcards & Revision
  getSubtopicFlashcards: (subtopic_id: string) =>
    request<Flashcard[]>(`/subtopics/${subtopic_id}/flashcards`),
  respondFlashcard: (flashcard_id: string, response: 'know' | 'revise') =>
    request<any>(`/flashcards/${flashcard_id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ flashcard_id, response }),
    }),
  finishFlashcardSession: (subtopic_id: string) =>
    request<{ message: string; xp_earned: number }>(`/flashcards/session/finish?subtopic_id=${subtopic_id}`, {
      method: 'POST',
    }),
  getRevisionRequired: (topic_id?: string) =>
    request<{ total_cards: number; revision_queue: RevisionItem[] }>(
      `/revision/required${topic_id ? '?topic_id=' + topic_id : ''}`
    ),

  // Progress & Recommendations
  getUserMastery: (topic_id?: string) =>
    request<{ overall_mastery: number; assessed_subtopics_count: number; scores: any[] }>(
      `/mastery${topic_id ? '?topic_id=' + topic_id : ''}`
    ),
  getRecommendations: () => request<Recommendation[]>('/recommendations'),
  getProgressHistory: () => request<any[]>('/progress/history'),
  getReports: () => request<any[]>('/reports'),

  // Gamification & Leaderboard
  getXPStatus: () => request<XPStatus>('/xp'),
  getBadges: () => request<Badge[]>('/badges'),
  getStreak: () => request<{ current_streak: number; longest_streak: number; freezes_available: number; active_today: boolean }>('/streak'),
  getDailyChallenge: () => request<{ id: string; date: string; is_completed: boolean; xp_awarded: number; questions: any[] }>('/daily-challenge'),
  finishDailyChallenge: () => request<{ message: string; xp_awarded: number }>('/daily-challenge/finish', { method: 'POST' }),
  getLeaderboard: (scope: 'global' | 'school' | 'class' | 'friends' = 'global', period: 'week' | 'all' = 'week') =>
    request<LeaderboardUser[]>(`/leaderboard?scope=${scope}&period=${period}`),
  sendFriendRequest: (target_username: string) =>
    request<{ message: string }>(`/friends/request?target_username=${encodeURIComponent(target_username)}`, { method: 'POST' }),
  acceptFriendRequest: (userId: string) =>
    request<{ message: string }>(`/friends/${userId}/accept`, { method: 'POST' }),

  // Game Mode
  getGameProfile: () => request<{ user_id: string; coins: number; avatar_frame: string; equipped_cosmetics: any }>('/game/profile'),
  getMissions: () => request<GameMission[]>('/game/missions'),
  startMission: (missionId: string) => request<any>(`/game/missions/${missionId}/start`, { method: 'POST' }),
  completeMissionStage: (missionId: string, stage: number, stars: number = 3) =>
    request<any>(`/game/missions/${missionId}/complete-stage?stage=${stage}&stars_earned=${stars}`, { method: 'POST' }),
  getShopItems: () => request<CosmeticItem[]>('/game/shop'),
  buyCosmetic: (cosmeticId: string) => request<any>(`/game/shop/buy?cosmetic_id=${cosmeticId}`, { method: 'POST' }),
  equipCosmetic: (cosmeticId: string) => request<any>(`/game/equip?cosmetic_id=${cosmeticId}`, { method: 'POST' }),
  getQuests: () => request<QuestItem[]>('/game/quests'),

  // AI Tutor
  sendTutorMessage: (data: { message: string; conversation_id?: string; topic_id?: string; subtopic_id?: string; mode?: string }) =>
    request<TutorResponse>('/ai/tutor', { method: 'POST', body: JSON.stringify(data) }),
};
