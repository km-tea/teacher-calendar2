import { sql, json, authed } from '../lib/common.js';

export default async (req) => {
  if (req.method === 'GET') return json({ key: process.env.VAPID_PUBLIC_KEY });
  const uid = authed(req);
  if (!uid) return json({ error: '로그인이 필요합니다' }, 401);
  const sub = await req.json();
  await sql`insert into push_subs(endpoint,user_id,sub) values(${sub.endpoint},${uid},${JSON.stringify(sub)}::jsonb)
    on conflict(endpoint) do update set user_id=${uid}, sub=excluded.sub`;
  return json({ ok: true });
};
export const config = { path: '/api/push' };
