import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
export const sql = neon(process.env.DATABASE_URL);
export const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
export const authed = (req) => {
  try {
    const t = (req.headers.get('authorization') || '').slice(7);
    return jwt.verify(t, process.env.JWT_SECRET).uid;
  } catch { return null; }
};
