# 야구장 관람 안내

분당우리교회 고등부 야구장 관람을 위한 React + Supabase 웹앱입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 점검

```bash
npm run lint
npm run build
```

## Supabase 설정

1. Supabase 대시보드에서 SQL Editor를 엽니다.
2. `supabase_setup.sql`의 `CHANGE_THIS_TO_A_LONG_PASSWORD`를 8자 이상의 강한 관리자 비밀번호로 바꿉니다.
3. 수정한 SQL 전체를 실행합니다.
4. 실제 비밀번호가 들어간 SQL은 저장하거나 Git에 커밋하지 않습니다.

공개 사용자는 예측 조회·등록만 할 수 있습니다. 점수 변경, 예측 마감, 예측 삭제는 서버에서 관리자 비밀번호를 검증한 뒤 실행됩니다.

## 배포

`main` 브랜치에 푸시하면 연결된 Vercel 프로젝트가 자동 배포됩니다.

## 개인정보 주의

좌석 배정 이름은 `src/data.js`에 포함되어 공개 빌드에 노출됩니다. 링크를 제한된 구성원에게만 공유하고, 공개 운영이 필요하면 이름을 별칭이나 이니셜로 교체하세요.
