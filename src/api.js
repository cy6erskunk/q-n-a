import { getToken } from './auth.js';

const DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL;

export const dataApiEnabled = Boolean(DATA_API_URL);

function headers() {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// Fetch the current user's progress (RLS filters to their row automatically)
export async function fetchProgress() {
  const res = await fetch(`${DATA_API_URL}/user_progress?select=*`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to fetch progress: ${res.status}`);
  const rows = await res.json();
  return rows[0] || null;
}

// Upsert user progress (insert or update via PostgREST conflict resolution)
// user_id is auto-set from JWT via DEFAULT (auth.user_id())
export async function saveProgressToCloud(data) {
  const res = await fetch(`${DATA_API_URL}/user_progress?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      ...headers(),
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify({
      answered_correctly: data.answeredCorrectly,
      questions_per_round: data.questionsPerRound,
      exam_questions_count: data.examQuestionsCount,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Failed to save progress: ${res.status}`);
  const rows = await res.json();
  return rows[0];
}

// Delete the current user's progress (RLS ensures only their row is deleted)
export async function deleteProgressFromCloud() {
  const res = await fetch(`${DATA_API_URL}/user_progress?select=*`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to delete progress: ${res.status}`);
}
