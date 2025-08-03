CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  provider TEXT,
  provider_id TEXT,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
);
