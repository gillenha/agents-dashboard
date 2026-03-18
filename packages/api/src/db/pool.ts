import { Pool, PoolConfig } from 'pg';

const dbHost = process.env.DB_HOST;
const isUnixSocket = dbHost?.startsWith('/');

const config: PoolConfig = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

if (isUnixSocket) {
  // Cloud SQL Unix socket (Cloud Run): host is a socket path, no port
  config.host = dbHost;
} else {
  config.host = dbHost ?? 'localhost';
  config.port = parseInt(process.env.DB_PORT ?? '5432', 10);
}

export const pool = new Pool(config);
