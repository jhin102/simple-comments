# Simple Comments 배포 가이드

## 🚀 Vercel 배포 단계

### 1. Vercel 계정 설정
1. [Vercel](https://vercel.com)에 가입/로그인
2. GitHub 계정 연결

### 2. 프로젝트 배포
```bash
# Vercel CLI 설치 (이미 설치되어 있다면 생략)
npm i -g vercel

# 프로젝트 배포
vercel --prod
```

### 3. Vercel Postgres 설정
1. Vercel Dashboard에서 프로젝트 선택
2. **Storage** 탭 클릭
3. **Create Database** → **Postgres** 선택
4. 데이터베이스 이름 입력 (예: `simple-comments-db`)
5. **Create** 클릭

### 4. 환경 변수 설정
Vercel Dashboard → 프로젝트 → **Settings** → **Environment Variables**에서 다음 변수들 추가:

```
POSTGRES_URL=postgresql://username:password@host:port/database
POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://username:password@host:port/database
POSTGRES_USER=username
POSTGRES_HOST=host
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=database
```

> **참고**: Vercel Postgres 생성 시 자동으로 환경 변수가 설정됩니다.

### 5. 재배포
환경 변수 설정 후 재배포:
```bash
vercel --prod
```

## 🔧 로컬 개발

### 1. 환경 변수 설정
```bash
# .env 파일 생성
cp env.example .env

# .env 파일에 실제 데이터베이스 정보 입력
```

### 2. 개발 서버 실행
```bash
npm run dev
# 또는
vercel dev
```

### 3. 테스트
- http://localhost:3000/test.html 접속
- 각 위젯 테스트

## 📊 데이터베이스 초기화

데이터베이스는 자동으로 테이블을 생성합니다:
- `likes` 테이블: 좋아요 정보
- `comments` 테이블: 댓글 정보

## 🔍 문제 해결

### 1. 데이터베이스 연결 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Vercel Postgres가 활성화되어 있는지 확인

### 2. CORS 오류
- API 엔드포인트에서 CORS 헤더가 설정되어 있는지 확인

### 3. 빌드 오류
- Node.js 버전이 18.x 이상인지 확인
- 의존성 설치: `npm install`

## 🌐 도메인 설정

### 커스텀 도메인
1. Vercel Dashboard → 프로젝트 → **Settings** → **Domains**
2. 도메인 추가
3. DNS 설정

### 서브도메인 예시
- `comments.yourdomain.com`
- `widget.yourdomain.com`

## 📈 모니터링

### Vercel Analytics
- Vercel Dashboard에서 실시간 트래픽 모니터링
- 함수 실행 시간 및 오류 추적

### 로그 확인
```bash
vercel logs
```

## 🔒 보안 설정

### 1. CORS 제한 (선택사항)
API 파일에서 특정 도메인만 허용하도록 수정:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
```

### 2. Rate Limiting
현재 10초당 1개 댓글 제한이 적용되어 있습니다.

### 3. IP 기반 제한
필요시 특정 IP 대역만 허용하도록 추가 구현 가능

## 📱 모바일 최적화

위젯은 반응형으로 설계되어 모바일에서도 잘 작동합니다:
- 터치 친화적 버튼 크기
- 가독성 좋은 폰트 크기
- 스크롤 최적화

## 🎯 성능 최적화

### 1. 이미지 최적화
- 이모지 사용으로 이미지 로딩 없음
- CSS 인라인으로 외부 요청 최소화

### 2. 번들 크기 최적화
- Vanilla JS 사용으로 번들 크기 최소화
- 외부 라이브러리 의존성 최소화

### 3. 캐싱
- Vercel의 자동 CDN 캐싱 활용
- 정적 파일 최적화

## 📞 지원

문제가 발생하면:
1. [GitHub Issues](https://github.com/your-username/simple-comments/issues) 등록
2. Vercel Dashboard의 로그 확인
3. 브라우저 개발자 도구의 네트워크 탭 확인
