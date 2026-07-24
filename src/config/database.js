import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// When running via Neon Local proxy (development), configure HTTP routing.
// The Neon Local container only supports HTTP-based communication with the
// serverless driver, not websockets. These settings route all queries through
// the local proxy's HTTP endpoint.
if (process.env.NEON_LOCAL === 'true') {
  const dbHost = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).hostname
    : 'neon-local';
  neonConfig.fetchEndpoint = `http://${dbHost}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const abc = 123;
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
