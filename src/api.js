import { client, neonEnabled } from './neon.js';

export const dataApiEnabled = neonEnabled;

// Fetch the current user's progress (RLS filters to their row automatically)
export async function fetchProgress() {
  const { data, error } = await client
    .from('user_progress')
    .select('*')
    .maybeSingle();
  if (error) throw new Error(`Failed to fetch progress: ${error.message}`);
  return data;
}

// Upsert user progress (insert or update via PostgREST conflict resolution)
// user_id is auto-set from JWT via DEFAULT (auth.user_id())
export async function saveProgressToCloud(progressData) {
  const { data, error } = await client
    .from('user_progress')
    .upsert({
      answered_correctly: progressData.answeredCorrectly,
      questions_per_round: progressData.questionsPerRound,
      exam_questions_count: progressData.examQuestionsCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .maybeSingle();
  if (error) throw new Error(`Failed to save progress: ${error.message}`);
  return data;
}

// Delete the current user's progress (RLS ensures only their row is deleted)
export async function deleteProgressFromCloud() {
  const { error } = await client
    .from('user_progress')
    .delete()
    .neq('user_id', '');  // PostgREST requires a filter on DELETE
  if (error) throw new Error(`Failed to delete progress: ${error.message}`);
}
