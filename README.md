# Simple Comments

로그인 없이 어디서나 사용 가능한 임베딩형 댓글 서비스

## 🚀 기능

- **로그인 불필요**: IP 기반으로 사용자 식별
- **임베딩 가능**: iframe으로 어디든 삽입 가능
- **좋아요 기능**: IP 기반 중복 방지
- **댓글 시스템**: 닉네임 + 4자리 비밀번호로 관리
- **페이지네이션**: 대량 댓글 효율적 표시
- **반응형 디자인**: 다양한 화면 크기 지원

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
- `POST /api/likes` - 좋아요 토글

### 댓글
- `GET /api/comments?id={page_id}&page={page}&max={max}` - 댓글 목록 조회
- `POST /api/comments` - 댓글 작성
- `DELETE /api/comments/{comment_id}` - 댓글 삭제

### 기타
- `GET /api/ip` - 사용자 IP 조회

## 🎨 디자인 시스템

### 색상
- Background: `#FFFFFF`
- Primary Text: `#1C1C1C`
- Secondary Text: `#6D6D6D`
- Accent: `#007bff` (좋아요, 인터랙션)

### 레이아웃
- iframe 임베딩 최적화
- 반응형 디자인
- 모바일 친화적

## 🔒 보안 기능

- **IP 기반 중복 방지**: 1 IP = 1 좋아요
- **Rate Limiting**: 10초당 1개 댓글 제한
- **비밀번호 해싱**: bcrypt로 안전한 저장
- **CORS 설정**: 적절한 도메인 제한 가능

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
npm run dev
```

### 빌드
```bash
npm run build
```

## 📝 라이선스

MIT License

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 있거나 기능 요청이 있으시면 [Issues](https://github.com/your-username/simple-comments/issues)에 등록해주세요.
