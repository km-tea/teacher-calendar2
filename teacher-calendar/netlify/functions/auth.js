import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql, json } from '../lib/common.js';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const { mode, email = '', password = '', name = '' } = await req.json();
  const mail = email.trim().toLowerCase();
  if (!mail || password.length < 6) return json({ error: '이메일과 6자 이상의 비밀번호를 입력하세요' }, 400);
  let user;
  if (mode === 'signup') {
    if ((await sql`select 1 from users where email=${mail}`).length)
      return json({ error: '이미 가입된 이메일입니다' }, 409);
    const hash = await bcrypt.hash(password, 10);
    [user] = await sql`insert into users(email,name,password_hash) values(${mail},${name},${hash}) returning id,email,name`;
  } else {
    [user] = await sql`select id,email,name,password_hash from users where email=${mail}`;
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' }, 401);
  }
  const token = jwt.sign({ uid: user.id }, process.env.JWT_SECRET, { expiresIn: '90d' });
  return json({ token, user: { id: user.id, email: user.email, name: user.name } });
};
export const config = { path: '/api/auth' };
