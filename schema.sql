-- Neon Data API + RLS schema for user progress
-- Run this in the Neon Console SQL Editor after enabling the Data API and Neon Auth.

-- User progress table: one row per user
CREATE TABLE user_progress (
  user_id            text DEFAULT (auth.user_id()) NOT NULL PRIMARY KEY,
  answered_correctly jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions_per_round integer NOT NULL DEFAULT 5,
  exam_questions_count integer NOT NULL DEFAULT 30,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Enable Row-Level Security (CRITICAL: without this, all authenticated users see all rows)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only read, insert, update, and delete their own row
CREATE POLICY "users manage own progress"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (auth.user_id() = user_id)
  WITH CHECK (auth.user_id() = user_id);
