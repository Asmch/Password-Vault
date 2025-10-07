# Database Setup Instructions

The Supabase database migration needs to be applied when the service becomes available.

## Migration SQL

Run the following SQL in your Supabase SQL Editor:

```sql
/*
  # Password Vault Database Schema

  Creates users and vault_entries tables with Row Level Security
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vault_entries table
CREATE TABLE IF NOT EXISTS vault_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  username text NOT NULL,
  encrypted_password text NOT NULL,
  url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vault_entries_user_id ON vault_entries(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id::text = current_setting('app.user_id', true))
  WITH CHECK (id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for vault_entries table
CREATE POLICY "Users can read own vault entries"
  ON vault_entries FOR SELECT
  TO authenticated
  USING (user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can insert own vault entries"
  ON vault_entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can update own vault entries"
  ON vault_entries FOR UPDATE
  TO authenticated
  USING (user_id::text = current_setting('app.user_id', true))
  WITH CHECK (user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own vault entries"
  ON vault_entries FOR DELETE
  TO authenticated
  USING (user_id::text = current_setting('app.user_id', true));
```

## How to Apply

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Paste the SQL above
4. Run the query

Once completed, the application will be fully functional!
