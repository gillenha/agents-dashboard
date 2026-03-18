import fs from 'fs';
import path from 'path';
import { pool } from './pool';

async function main() {
  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const seedSQL   = fs.readFileSync(path.join(__dirname, 'seed.sql'),   'utf-8');

  console.log('[db:init] Connecting to postgres…');

  await pool.query(schemaSQL);
  console.log('[db:init] Schema applied');

  await pool.query(seedSQL);
  console.log('[db:init] Seed data loaded');

  await pool.end();
  console.log('[db:init] Done');
}

main().catch((err) => {
  console.error('[db:init] Failed:', err);
  process.exit(1);
});
