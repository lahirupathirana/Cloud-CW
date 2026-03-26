CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS salary;
CREATE SCHEMA IF NOT EXISTS community;
CREATE SCHEMA IF NOT EXISTS public;

-- Example: Tables inside the identity schema
CREATE TABLE IF NOT EXISTS identity.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example: Tables inside the salary schema
CREATE TABLE IF NOT EXISTS salary.submissions (
  id SERIAL PRIMARY KEY,
  job_title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255), -- Optional to preserve anonymity
  years_of_experience INT NOT NULL,
  base_salary NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example: Tables inside the community schema
CREATE TABLE IF NOT EXISTS community.votes (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL,
  user_id INT NOT NULL,
  vote_type VARCHAR(10) NOT NULL, -- UP or DOWN
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id, user_id)
);
