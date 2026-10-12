import { sql, json, authed } from '../lib/common.js';

export default async (req) => {
  const uid = authed(req);
  if (!uid) return json({ error: '로그인이 필요합니다' }, 401);
  const id = new URL(req.url).searchParams.get('id');

  if (req.method === 'GET')
    return json(await sql`select id,title,place,start_at,remind_minutes,source from events where user_id=${uid} order by start_at`);

  if (req.method === 'DELETE') {
    await sql`delete from events where id=${id} and user_id=${uid}`;
    return json({ ok: true });
  }

  const body = await req.json();
  if (req.method === 'POST') {
    for (const e of Array.isArray(body) ? body : [body]) {
      const rm = e.remind_minutes ?? null;
      await sql`insert into events(user_id,title,place,start_at,remind_minutes,remind_at,source)
        values(${uid},${e.title},${e.place || ''},${e.start_at}::timestamptz,${rm}::int,
        ${e.start_at}::timestamptz - make_interval(mins => ${rm}::int),${e.source || 'manual'})`;
    }
    return json({ ok: true });
  }

  if (req.method === 'PUT') {
    const rm = body.remind_minutes ?? null;
    await sql`update events set title=${body.title}, place=${body.place || ''},
      start_at=${body.start_at}::timestamptz, remind_minutes=${rm}::int,
      remind_at=${body.start_at}::timestamptz - make_interval(mins => ${rm}::int), notified=false
      where id=${id} and user_id=${uid}`;
    return json({ ok: true });
  }
  return json({ error: 'unsupported' }, 405);
};
export const config = { path: '/api/events' };
