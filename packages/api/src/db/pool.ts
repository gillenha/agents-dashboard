import { Pool } from 'pg';

export const pool = new Pool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  user:     process.env.DB_USER     ?? 'devpigh_admin',
  password: process.env.DB_PASSWORD ?? 'fatmanpiggy',
  database: process.env.DB_NAME     ?? 'devpigh',
});
