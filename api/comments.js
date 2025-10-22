import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        if (req.method === 'GET') {
            return await getComments(req, res);
        } else if (req.method === 'POST') {
            return await createComment(req, res);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('댓글 API 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
}

async function getComments(req, res) {
    const { id, page = 1, max = 10 } = req.query;
    
    if (!id) {
        return res.status(400).json({
            success: false,
            message: '페이지 ID가 필요합니다'
        });
    }
    
    const pageNum = parseInt(page);
    const maxPerPage = parseInt(max);
    const offset = (pageNum - 1) * maxPerPage;
    
    try {
        // 댓글 테이블이 없으면 생성
        await sql`
            CREATE TABLE IF NOT EXISTS comments (
                comment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                page_id VARCHAR(255) NOT NULL,
                nickname VARCHAR(20) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                ip VARCHAR(45) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // 인덱스 생성 (성능 최적화)
        await sql`
            CREATE INDEX IF NOT EXISTS idx_comments_page_created 
            ON comments (page_id, created_at DESC)
        `;
        
        // 댓글 조회 (최신순)
        const commentsResult = await sql`
            SELECT comment_id, nickname, content, ip, created_at
            FROM comments 
            WHERE page_id = ${id}
            ORDER BY created_at DESC
            LIMIT ${maxPerPage} OFFSET ${offset}
        `;
        
        // 총 댓글 수 조회
        const totalResult = await sql`
            SELECT COUNT(*) as total FROM comments WHERE page_id = ${id}
        `;
        
        const total = parseInt(totalResult.rows[0].total);
        
        // snake_case를 camelCase로 변환
        const comments = commentsResult.rows.map(row => ({
            commentId: row.comment_id,
            nickname: row.nickname,
            content: row.content,
            ip: row.ip,
            createdAt: row.created_at
        }));
        
        res.status(200).json({
            success: true,
            comments: comments,
            total: total,
            page: pageNum,
            maxPerPage: maxPerPage
        });
    } catch (error) {
        console.error('댓글 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '댓글을 불러올 수 없습니다'
        });
    }
}

async function createComment(req, res) {
    const { id, nickname, password, content, ip } = req.body;
    
    // 유효성 검사
    if (!id || !nickname || !password || !content || !ip) {
        return res.status(400).json({
            success: false,
            message: '모든 필드를 입력해주세요'
        });
    }
    
    if (nickname.length > 20) {
        return res.status(400).json({
            success: false,
            message: '닉네임은 20자 이하로 입력해주세요'
        });
    }
    
    if (password.length !== 4) {
        return res.status(400).json({
            success: false,
            message: '비밀번호는 4자리로 입력해주세요'
        });
    }
    
    if (content.length > 500) {
        return res.status(400).json({
            success: false,
            message: '댓글은 500자 이하로 입력해주세요'
        });
    }
    
    // Rate limiting 체크 (같은 IP에서 10초당 1개 댓글 제한)
    try {
        const recentComment = await sql`
            SELECT created_at FROM comments 
            WHERE ip = ${ip} 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        
        if (recentComment.rows.length > 0) {
            const lastCommentTime = new Date(recentComment.rows[0].created_at);
            const now = new Date();
            const timeDiff = (now - lastCommentTime) / 1000; // 초 단위
            
            if (timeDiff < 10) {
                return res.status(429).json({
                    success: false,
                    message: '댓글 작성은 10초에 한 번만 가능합니다'
                });
            }
        }
    } catch (error) {
        console.error('Rate limiting 체크 오류:', error);
        // Rate limiting 체크 실패해도 댓글 작성은 계속 진행
    }
    
    try {
        // 댓글 테이블이 없으면 생성
        await sql`
            CREATE TABLE IF NOT EXISTS comments (
                comment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                page_id VARCHAR(255) NOT NULL,
                nickname VARCHAR(20) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                ip VARCHAR(45) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        // 비밀번호 해싱
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // 댓글 저장
        const result = await sql`
            INSERT INTO comments (page_id, nickname, password_hash, content, ip)
            VALUES (${id}, ${nickname}, ${passwordHash}, ${content}, ${ip})
            RETURNING comment_id
        `;
        
        res.status(201).json({
            success: true,
            commentId: result.rows[0].comment_id,
            message: '댓글이 등록되었습니다'
        });
    } catch (error) {
        console.error('댓글 생성 오류:', error);
        res.status(500).json({
            success: false,
            message: '댓글 등록 중 오류가 발생했습니다'
        });
    }
}
