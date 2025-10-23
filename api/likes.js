import pool from '../lib/db.js';
import { isTableNotExistsError, createTables } from '../lib/schema.js';

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
            return await getLikes(req, res);
        } else if (req.method === 'POST') {
            return await toggleLike(req, res);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('좋아요 API 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
}

async function getLikes(req, res) {
    const { id, ip } = req.query;
    
    if (!id || !ip) {
        return res.status(400).json({
            success: false,
            message: '페이지 ID와 IP가 필요합니다'
        });
    }
    
    try {
        const totalResult = await pool.query(
            `SELECT COUNT(*) as total FROM likes WHERE page_id = $1`,
            [id]
        );
        
        const userLikeResult = await pool.query(
            `SELECT 1 FROM likes WHERE page_id = $1 AND ip = $2`,
            [id, ip]
        );
        
        const total = parseInt(totalResult.rows[0].total);
        const liked = userLikeResult.rows.length > 0;
        
        res.status(200).json({
            success: true,
            total: total,
            liked: liked
        });
    } catch (error) {
        if (isTableNotExistsError(error)) {
            try {
                await createTables();
                return await getLikes(req, res);
            } catch (retryError) {
                console.error('테이블 생성 후 재시도 오류:', retryError);
            }
        }
        console.error('좋아요 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '좋아요 정보를 가져올 수 없습니다'
        });
    }
}

async function toggleLike(req, res) {
    const { id, ip } = req.body;
    
    if (!id || !ip) {
        return res.status(400).json({
            success: false,
            message: '페이지 ID와 IP가 필요합니다'
        });
    }
    
    try {
        const existingLike = await pool.query(
            `SELECT 1 FROM likes WHERE page_id = $1 AND ip = $2`,
            [id, ip]
        );
        
        let liked;
        
        if (existingLike.rows.length > 0) {
            await pool.query(
                `DELETE FROM likes WHERE page_id = $1 AND ip = $2`,
                [id, ip]
            );
            liked = false;
        } else {
            await pool.query(
                `INSERT INTO likes (page_id, ip) VALUES ($1, $2)`,
                [id, ip]
            );
            liked = true;
        }
        
        const totalResult = await pool.query(
            `SELECT COUNT(*) as total FROM likes WHERE page_id = $1`,
            [id]
        );
        
        const total = parseInt(totalResult.rows[0].total);
        
        res.status(200).json({
            success: true,
            total: total,
            liked: liked
        });
    } catch (error) {
        if (isTableNotExistsError(error)) {
            try {
                await createTables();
                return await toggleLike(req, res);
            } catch (retryError) {
                console.error('테이블 생성 후 재시도 오류:', retryError);
            }
        }
        console.error('좋아요 토글 오류:', error);
        res.status(500).json({
            success: false,
            message: '좋아요 처리 중 오류가 발생했습니다'
        });
    }
}
