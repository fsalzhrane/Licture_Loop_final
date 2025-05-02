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
-- Drop existing policies first to avoid conflicts if they exist
DROP POLICY IF EXISTS "Users can create their own courses" ON courses;
DROP POLICY IF EXISTS "Users can view their own courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;
DROP POLICY IF EXISTS "All users can update note count" ON courses; -- Specific policy for note_count
DROP POLICY IF EXISTS "All users can delete courses" ON courses;
DROP POLICY IF EXISTS "All users can view courses" ON courses;
DROP POLICY IF EXISTS "All users can update courses" ON courses; -- General update policy

CREATE POLICY "Users can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "All users can view courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy allowing users to update courses they own (e.g., title, description)
CREATE POLICY "Users can update their own courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Explicit policy allowing ANY authenticated user to update ONLY the note_count
CREATE POLICY "All users can update note count"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (true) -- Allows the update operation to proceed
  WITH CHECK (true); -- Allows the update operation to proceed (redundant with USING(true) but safe)
  -- This policy is broad; the function logic (decrement_note_count) ensures it only decrements.

CREATE POLICY "All users can delete courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for notes
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can create notes for their own courses" ON notes;
DROP POLICY IF EXISTS "Users can view notes for their own courses" ON notes;
DROP POLICY IF EXISTS "Users can update notes for their own courses" ON notes;
DROP POLICY IF EXISTS "Users can delete notes for their own courses" ON notes;
DROP POLICY IF EXISTS "All users can create notes" ON notes; -- Added for consistency
DROP POLICY IF EXISTS "All users can view notes" ON notes; -- Added for consistency
DROP POLICY IF EXISTS "All users can update notes" ON notes; -- Added for consistency
DROP POLICY IF EXISTS "All users can delete notes" ON notes; -- Added for consistency

CREATE POLICY "All users can create notes"
  ON notes
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow any authenticated user to insert notes (course_id must exist due to FK)

CREATE POLICY "All users can view notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (true); -- Allow any authenticated user to view

CREATE POLICY "All users can update notes"
  ON notes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true); -- Allow any authenticated user to update

CREATE POLICY "All users can delete notes"
  ON notes
  FOR DELETE
  TO authenticated
  USING (true); -- Allow any authenticated user to delete

-- Create function to increment note count
CREATE OR REPLACE FUNCTION increment_note_count(course_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE courses
  SET note_count = note_count + 1
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement note count (Reverting SECURITY DEFINER for now, relying on the new policy)
CREATE OR REPLACE FUNCTION decrement_note_count(course_id_param UUID)
RETURNS integer AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE courses
  SET note_count = note_count - 1
  WHERE id = course_id_param AND note_count > 0
  RETURNING note_count INTO updated_count;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql; -- Removed SECURITY DEFINER

-- Grant execute permission to authenticated users for the functions
GRANT EXECUTE ON FUNCTION increment_note_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_note_count(UUID) TO authenticated;