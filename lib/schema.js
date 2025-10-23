import pool from './db.js';

export function isTableNotExistsError(error) {
    return error.code === '42P01';
}

export async function createTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
            comment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            page_id VARCHAR(255) NOT NULL,
            nickname VARCHAR(20) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            ip VARCHAR(45) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_comments_page_created 
        ON comments (page_id, created_at DESC)
    `);
    
    await pool.query(`
        CREATE TABLE IF NOT EXISTS likes (
            page_id VARCHAR(255) NOT NULL,
            ip VARCHAR(45) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (page_id, ip)
        )
    `);
    
    console.log('데이터베이스 테이블 생성 완료');
}

