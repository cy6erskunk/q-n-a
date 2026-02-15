import { createClient } from '@neondatabase/neon-js';

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;
const DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL;

export const neonEnabled = Boolean(AUTH_URL) && Boolean(DATA_API_URL);

export const client = neonEnabled
  ? createClient({
      auth: { url: AUTH_URL },
      dataApi: { url: DATA_API_URL },
    })
  : null;
