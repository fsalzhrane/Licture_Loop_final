-- Create a simple test table
CREATE TABLE IF NOT EXISTS test_table (
  id serial PRIMARY KEY,
  name text
);

-- Optional: Add a policy if you want to interact with it via the client library
-- ALTER TABLE test_table ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON test_table FOR SELECT USING (true);