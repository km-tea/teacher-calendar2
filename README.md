# 교사 일정 캘린더 — 배포 순서
1. **Neon**: 프로젝트 생성 → SQL Editor에 `schema.sql` 붙여넣고 실행 → Connection string 복사
2. **VAPID 키 생성**(알림용): 터미널에서 `npx web-push generate-vapid-keys`
3. 이 폴더를 GitHub에 올리고 Netlify에서 "Import from Git"으로 연결 (함수 패키지 설치를 위해 Git 배포 필요)
4. Netlify → Site settings → Environment variables:
   - `DATABASE_URL` (Neon 연결 문자열)
   - `JWT_SECRET` (아무 긴 무작위 문자열)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (2번에서 생성)
   - `GEMINI_API_KEY` (문서 분석용), 선택: `GEMINI_MODEL`, `VAPID_EMAIL`
5. 배포 후 사이트에서 가입 → 위쪽 "🔔 알림 켜기" → 허용
