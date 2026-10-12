// 업로드한 PDF/HWPX를 AI로 읽어 일정 후보를 돌려줌 (저장은 사용자가 확인한 뒤)
import JSZip from 'jszip';
import { json, authed } from '../lib/common.js';
const MODELS = [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-flash-latest'].filter(Boolean);

export default async (req) => {
  if (!authed(req)) return json({ error: '로그인이 필요합니다' }, 401);
  const { name = '', data, text: given } = await req.json();
  const ext = name.split('.').pop().toLowerCase();
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const prompt = `오늘은 ${today}입니다. 아래 문서에서 교사가 달력에 등록해야 할 일정(제출 기한, 행사일, 회의, 연수 등 날짜가 있는 항목)만 찾아 JSON 배열로만 답하세요. 각 항목: {"title":"해야 할 일을 짧게(예: 연구계획서 제출)","date":"YYYY-MM-DD","time":"HH:MM 또는 null","place":"장소 또는 빈 문자열"}. 연도가 없으면 오늘 이후 가장 가까운 날짜로 추정하세요. 날짜가 없는 항목은 제외하세요.`;
  let parts;
  if (given) {
    parts = [{ text: prompt + '\n\n[문서]\n' + given.slice(0, 100000) }];
  } else if (ext === 'pdf') {
    parts = [{ inline_data: { mime_type: 'application/pdf', data } }, { text: prompt }];
  } else if (ext === 'hwpx') {
    const zip = await JSZip.loadAsync(Buffer.from(data, 'base64'));
    let text = '';
    for (const n of Object.keys(zip.files).filter((n) => /Contents\/section\d+\.xml$/.test(n)).sort())
      text += (await zip.file(n).async('string')).replace(/<\/hp:p>/g, '\n').replace(/<[^>]+>/g, '') + '\n';
    parts = [{ text: prompt + '\n\n[문서]\n' + text.slice(0, 60000) }];
  } else {
    return json({ error: '.hwp 파일은 한글에서 "다른 이름으로 저장 → PDF 또는 .hwpx"로 저장해 올려 주세요' }, 400);
  }
  if (!process.env.GEMINI_API_KEY) return json({ error: '서버에 GEMINI_API_KEY가 설정되지 않았습니다' }, 500);
  let r, why = '';
  for (const m of MODELS) {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json' } }),
    });
    if (r.ok) break;
    why = `[${m}] ${r.status} ${(await r.text()).replace(/\s+/g, ' ').slice(0, 200)}`;
  }
  if (!r.ok) return json({ error: 'AI 분석 실패: ' + why }, 502);
  let list = [];
  try { list = JSON.parse((await r.json()).candidates[0].content.parts[0].text); } catch {}
  const events = (Array.isArray(list) ? list : [])
    .filter((e) => e.title && /^\d{4}-\d{2}-\d{2}$/.test(e.date || ''))
    .map((e) => ({ title: e.title, date: e.date, time: /^\d{2}:\d{2}$/.test(e.time || '') ? e.time : '09:00', place: e.place || '' }));
  return json({ events });
};
export const config = { path: '/api/analyze' };
