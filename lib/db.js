import pkg from 'pg';
const { Pool } = pkg;

// Vercel Postgres 환경 변수를 사용한 연결 풀 생성
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default pool;

