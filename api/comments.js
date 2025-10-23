import pool from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { getClientIp } from '../lib/utils.js';
import { ensureTablesExist } from '../lib/schema.js';

export default async function handler(req, res) {
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
        await ensureTablesExist();
        
        const commentsResult = await pool.query(
            `SELECT comment_id, nickname, content, ip, created_at
            FROM comments 
            WHERE page_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3`,
            [id, maxPerPage, offset]
        );
        
        const totalResult = await pool.query(
            `SELECT COUNT(*) as total FROM comments WHERE page_id = $1`,
            [id]
        );
        
        const total = parseInt(totalResult.rows[0].total);
        
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
    const { id, nickname, password, content } = req.body;
    
    const ip = getClientIp(req);
    
    if (!id || !nickname || !password || !content) {
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
    
    try {
        const recentComment = await pool.query(
            `SELECT created_at FROM comments 
            WHERE ip = $1 
            ORDER BY created_at DESC 
            LIMIT 1`,
            [ip]
        );
        
        if (recentComment.rows.length > 0) {
            const lastCommentTime = new Date(recentComment.rows[0].created_at);
            const now = new Date();
            const timeDiff = (now - lastCommentTime) / 1000;
            
            if (timeDiff < 10) {
                return res.status(429).json({
                    success: false,
                    message: '댓글 작성은 10초에 한 번만 가능합니다'
                });
            }
        }
    } catch (error) {
        console.error('Rate limiting 체크 오류:', error);
    }
    
    try {
        await ensureTablesExist();
        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const result = await pool.query(
            `INSERT INTO comments (page_id, nickname, password_hash, content, ip)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING comment_id`,
            [id, nickname, passwordHash, content, ip]
        );
        
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
