# Simple Comments

로그인 없이 어디서나 사용 가능한 임베딩형 댓글 서비스

## 🚀 기능

- **로그인 불필요**: 서버에서 IP 자동 추출 및 식별
- **임베딩 최적화**: iframe으로 어디든 삽입 가능, 스타일 충돌 방지 (`sc-` prefix)
- **좋아요 기능**: SVG 스프라이트 아이콘, IP 기반 중복 방지
- **댓글 시스템**: 닉네임 + 4자리 비밀번호로 관리
- **인라인 삭제**: alert/prompt 없는 깔끔한 UX (댓글 아래 인라인 폼)
- **페이지네이션**: 대량 댓글 효율적 표시
- **완전 반응형**: 브라우저 크기에 자동 맞춤
- **커스텀 폰트**: NanumSquareNeo, MonoplexKRNerd 적용

## 🛠 기술 스택

- **Frontend**: Vanilla HTML/CSS/JavaScript (반응형 디자인)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: PostgreSQL (node-postgres)
- **Hosting**: Vercel

## 📦 설치 및 배포

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/simple-comments.git
cd simple-comments
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Vercel Postgres 설정
1. [Vercel Dashboard](https://vercel.com/dashboard)에서 새 프로젝트 생성
2. Storage 탭에서 Postgres 데이터베이스 생성
3. 환경 변수 설정:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

### 4. 배포
```bash
vercel --prod
```

## 🎯 사용법

### 기본 사용 (반응형 - 권장)
```html
<iframe 
  src="https://your-domain.vercel.app/?id=my-page-1&max=20"
  style="width: 100%; height: 800px; border: none;">
</iframe>
```

### 고정 너비 사용
```html
<iframe 
  src="https://your-domain.vercel.app/?id=my-page-1&max=20"
  style="width: 600px; height: 800px; border: none;">
</iframe>
```

### URL 파라미터
- `id`: 댓글 스레드 식별자 (필수)
- `max`: 페이지당 댓글 수 (기본값: 10)

### 예시
```html
<!-- 블로그 포스트 댓글 (반응형) -->
<iframe 
  src="https://simple-comments.vercel.app/?id=blog-post-123&max=15"
  style="width: 100%; height: 700px; border: none;">
</iframe>

<!-- 상품 리뷰 (고정 너비) -->
<iframe 
  src="https://simple-comments.vercel.app/?id=product-review-456&max=5"
  style="width: 500px; height: 600px; border: none;">
</iframe>
```

## 🔧 API 엔드포인트

### 좋아요
- `GET /api/likes?id={page_id}&ip={user_ip}` - 좋아요 상태 조회
- `POST /api/likes` - 좋아요 토글 (body: `{id, ip}`)

### 댓글
- `GET /api/comments?id={page_id}&page={page}&max={max}` - 댓글 목록 조회
- `POST /api/comments` - 댓글 작성 (body: `{id, nickname, password, content}`)
  - IP는 서버에서 자동 추출
- `DELETE /api/comments/{comment_id}` - 댓글 삭제 (body: `{password}`)
  - IP는 서버에서 자동 추출하여 본인 확인

### 기타
- `GET /api/ip` - 사용자 IP 조회 (클라이언트용)

## 🎨 디자인 시스템

### 색상
- Background: `#FFFFFF`
- Primary Text: `#1C1C1C` (헤더)
- Secondary Text: `#6D6D6D` (댓글, 본문, UI 요소)
- Border: `#D3D1CB` (테두리, 버튼)
- Hover: `#ff4757` (삭제), `#D3D1CB` (일반)

### 폰트
- 일반: `NanumSquareNeo-Variable` (본문, UI)
- 강조: `MonoplexKRNerd-Bold` (헤더)
- CDN으로 로드

### 레이아웃
- 완전 반응형 (가로폭 자동 조정)
- 미니멀 디자인 (투명 배경, 구분선)
- 네임스페이스 격리 (`sc-` prefix)
- 모바일 친화적 (480px 이하 최적화)

## 🔒 보안 기능

- **서버 IP 추출**: 클라이언트에서 IP 전송 불가, 서버에서 자동 추출
- **IP 기반 중복 방지**: 1 IP = 1 좋아요
- **Rate Limiting**: 같은 IP에서 10초당 1개 댓글 제한
- **비밀번호 해싱**: bcrypt (saltRounds: 10)로 안전한 저장
- **본인 확인**: 댓글 삭제 시 IP + 비밀번호 이중 확인
- **CORS 설정**: 모든 도메인 허용 (`Access-Control-Allow-Origin: *`)

## 📊 데이터베이스 스키마

### Likes 테이블
```sql
CREATE TABLE likes (
  page_id VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (page_id, ip)
);
```

### Comments 테이블
```sql
CREATE TABLE comments (
  comment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id VARCHAR(255) NOT NULL,
  nickname VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_page_created ON comments (page_id, created_at DESC);
```

## 🚀 개발

### 로컬 개발
```bash
# Vercel Dev 서버로 로컬 테스트 (API 포함)
vercel dev

# 또는 정적 파일만 테스트
npm run dev
```

### UI 미리보기
```bash
# public/dummy.html - 더미 데이터로 UI 확인
# 브라우저에서 직접 열기
```

### 테스트
```bash
# public/test.html - 실제 API 연동 테스트
# Vercel 배포 후 사용
```

## 📁 프로젝트 구조

```
simple-comments/
├── api/                    # Serverless Functions
│   ├── comments.js        # 댓글 목록, 작성
│   ├── comments/[id].js   # 댓글 삭제
│   ├── likes.js           # 좋아요
│   └── ip.js              # IP 조회
├── lib/                    # 공통 라이브러리
│   ├── db.js              # PostgreSQL 연결
│   └── utils.js           # IP 추출 등
├── public/                 # 정적 파일
│   ├── index.html         # 메인 위젯
│   ├── script.js          # 클라이언트 로직
│   ├── styles.css         # 스타일시트
│   ├── heart.svg          # 좋아요 아이콘 스프라이트
│   ├── dummy.html         # UI 미리보기
│   └── test.html          # API 테스트
├── package.json
└── vercel.json            # Vercel 설정
```

## 📝 라이선스

MIT License

## ✨ 주요 특징

### 임베딩 최적화
- 모든 CSS 클래스/ID에 `sc-` prefix로 네임스페이스 격리
- 호스트 페이지 스타일과 충돌 방지
- `alert`/`prompt` 없는 인라인 UI

### 사용자 경험
- 댓글 삭제: 인라인 비밀번호 입력 폼
- 로딩 실패 시: 재시도 없이 심플한 에러 표시
- 반응형: 브라우저 크기에 자동 맞춤
- 닉네임 표시: `홍길동 (192.168.0.1)` 형식

### 개발자 경험
- ES Modules (`"type": "module"`)
- 표준 PostgreSQL 클라이언트 (`pg`)
- 서버 IP 자동 추출로 보안 강화
- 더미 HTML로 빠른 UI 확인

## 📞 지원

문제가 있거나 기능 요청이 있으시면 [Issues](https://github.com/your-username/simple-comments/issues)에 등록해주세요.
