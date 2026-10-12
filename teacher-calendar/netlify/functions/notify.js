// 5분마다 자동 실행: 알림 시각이 된 일정을 찾아 브라우저 푸시(팝업)로 보냄
import webpush from 'web-push';
import { sql } from '../lib/common.js';

export default async () => {
  webpush.setVapidDetails('mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
    process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const due = await sql`select id,user_id,title,place,start_at from events
    where not notified and remind_at <= now() and start_at > now() - interval '1 day'`;
  for (const e of due) {
    const subs = await sql`select endpoint,sub from push_subs where user_id=${e.user_id}`;
    const when = new Date(e.start_at).toLocaleString('ko-KR',
      { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const payload = JSON.stringify({ title: '📅 ' + e.title, body: when + (e.place ? ' · ' + e.place : ''), tag: 'ev' + e.id });
    for (const s of subs) {
      try { await webpush.sendNotification(s.sub, payload); }
      catch (err) { if ([404, 410].includes(err.statusCode)) await sql`delete from push_subs where endpoint=${s.endpoint}`; }
    }
    await sql`update events set notified=true where id=${e.id}`;
  }
};
export const config = { schedule: '*/5 * * * *' };
