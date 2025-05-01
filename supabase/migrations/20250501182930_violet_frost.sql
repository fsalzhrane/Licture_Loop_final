/*
  # Create initial schema for LectureLoop

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `professor` (text, required)
      - `user_id` (uuid, foreign key to auth.users)
      - `note_count` (integer)
      - `created_at` (timestamp)
    - `notes`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `file_url` (text, required)
      - `file_path` (text, required)
      - `file_type` (text, required)
      - `file_name` (text, required)
      - `course_id` (uuid, foreign key to courses)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Create function to increment note count for courses
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  professor text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_name text NOT NULL,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Users can create their own courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for notes
CREATE POLICY "Users can create notes for their own courses"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = notes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view notes for their own courses"
  ON notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = notes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes for their own courses"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = notes.course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = notes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes for their own courses"
  ON notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = notes.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create function to increment note count
CREATE OR REPLACE FUNCTION increment_note_count(course_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE courses
  SET note_count = note_count + 1
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql;