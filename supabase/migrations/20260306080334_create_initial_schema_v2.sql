/*
  # Smart Attachment Hunter - Initial Database Schema

  ## Overview
  This migration sets up the complete database schema for the AI video creation and social platform.

  ## New Tables

  ### 1. profiles
  - Extends auth.users with additional user information
  - `id` (uuid, references auth.users)
  - `username` (text, unique)
  - `display_name` (text)
  - `avatar_url` (text)
  - `bio` (text)
  - `preferred_dialect` (text) - Arabic dialect preference
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. videos
  - Stores generated AI videos
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `source_text` (text) - Original text input
  - `source_image_url` (text) - Original image URL
  - `video_url` (text) - Generated video URL
  - `duration` (integer) - Video duration in seconds
  - `voice_tone` (text) - Selected voice tone
  - `dialect` (text) - Selected Arabic dialect
  - `status` (text) - processing, completed, failed
  - `view_count` (integer)
  - `created_at` (timestamptz)

  ### 3. project_templates
  - Ready-made project templates
  - `id` (uuid, primary key)
  - `name` (text)
  - `category` (text) - cooking, trends, reactions, etc.
  - `description` (text)
  - `thumbnail_url` (text)
  - `template_data` (jsonb) - Template configuration
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 4. chat_messages
  - General public chat messages
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `message_text` (text)
  - `image_url` (text)
  - `created_at` (timestamptz)

  ### 5. private_messages
  - Private conversations between users
  - `id` (uuid, primary key)
  - `sender_id` (uuid, references profiles)
  - `receiver_id` (uuid, references profiles)
  - `message_text` (text)
  - `message_type` (text) - text, voice, image
  - `media_url` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ### 6. blocked_users
  - User blocking for moderation
  - `id` (uuid, primary key)
  - `blocker_id` (uuid, references profiles)
  - `blocked_id` (uuid, references profiles)
  - `reason` (text)
  - `created_at` (timestamptz)

  ### 7. user_favorites
  - Users' favorite videos
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `video_id` (uuid, references videos)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users to manage their own data
  - Policies for public read access where appropriate
  - Block enforcement in chat and messaging
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  bio text DEFAULT '',
  preferred_dialect text DEFAULT 'standard',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  source_text text NOT NULL,
  source_image_url text,
  video_url text,
  duration integer DEFAULT 15,
  voice_tone text DEFAULT 'neutral',
  dialect text DEFAULT 'standard',
  status text DEFAULT 'processing',
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view completed videos"
  ON videos FOR SELECT
  TO authenticated
  USING (status = 'completed');

CREATE POLICY "Users can create own videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create project_templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  thumbnail_url text,
  template_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON project_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create blocked_users table (created before chat_messages to avoid reference issues)
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

CREATE POLICY "Users can unblock others"
  ON blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_text text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE blocked_users.blocker_id = auth.uid()
      AND blocked_users.blocked_id = chat_messages.user_id
    )
  );

CREATE POLICY "Users can insert chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create private_messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_text text,
  message_type text DEFAULT 'text',
  media_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON private_messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send private messages"
  ON private_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE (
        (blocked_users.blocker_id = receiver_id AND blocked_users.blocked_id = sender_id)
        OR
        (blocked_users.blocker_id = sender_id AND blocked_users.blocked_id = receiver_id)
      )
    )
  );

CREATE POLICY "Users can update read status on received messages"
  ON private_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON private_messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);

-- Insert sample project templates
INSERT INTO project_templates (name, category, description, template_data) VALUES
  ('قالب الطبخ السريع', 'cooking', 'قالب لإنشاء مقاطع فيديو للوصفات والطبخات', '{"style": "cooking", "duration": 15, "layout": "recipe"}'),
  ('ترند تيك توك', 'trends', 'قالب لمتابعة أحدث الترندات', '{"style": "trend", "duration": 15, "layout": "vertical"}'),
  ('ردود الفعل', 'reactions', 'قالب لإنشاء فيديوهات ردود الفعل', '{"style": "reaction", "duration": 15, "layout": "split"}'),
  ('محتوى تعليمي', 'education', 'قالب للمحتوى التعليمي والشروحات', '{"style": "educational", "duration": 15, "layout": "presentation"}'),
  ('فكاهة وكوميديا', 'comedy', 'قالب للمحتوى الفكاهي', '{"style": "comedy", "duration": 15, "layout": "comedic"}'),
  ('أخبار ومعلومات', 'news', 'قالب للأخبار والمعلومات السريعة', '{"style": "news", "duration": 15, "layout": "news_style"}')
ON CONFLICT DO NOTHING;
