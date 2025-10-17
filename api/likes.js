import { sql } from '@vercel/postgres';

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
            error: '서버 오류가 발생했습니다'
        });
    }
}

async function getLikes(req, res) {
    const { id, ip } = req.query;
    
    if (!id || !ip) {
        return res.status(400).json({
            success: false,
            error: '페이지 ID와 IP가 필요합니다'
        });
    }
    
    try {
        // 좋아요 테이블이 없으면 생성
        await sql`
            CREATE TABLE IF NOT EXISTS likes (
                page_id VARCHAR(255) NOT NULL,
                ip VARCHAR(45) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (page_id, ip)
            )
        `;
        
        // 총 좋아요 수 조회
        const totalResult = await sql`
            SELECT COUNT(*) as total FROM likes WHERE page_id = ${id}
        `;
        
        // 현재 IP의 좋아요 여부 조회
        const userLikeResult = await sql`
            SELECT 1 FROM likes WHERE page_id = ${id} AND ip = ${ip}
        `;
        
        const total = parseInt(totalResult.rows[0].total);
        const liked = userLikeResult.rows.length > 0;
        
        res.status(200).json({
            success: true,
            total: total,
            liked: liked
        });
    } catch (error) {
        console.error('좋아요 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '좋아요 정보를 가져올 수 없습니다'
        });
    }
}

async function toggleLike(req, res) {
    const { id, ip } = req.body;
    
    if (!id || !ip) {
        return res.status(400).json({
            success: false,
            error: '페이지 ID와 IP가 필요합니다'
        });
    }
    
    try {
        // 좋아요 테이블이 없으면 생성
        await sql`
            CREATE TABLE IF NOT EXISTS likes (
                page_id VARCHAR(255) NOT NULL,
                ip VARCHAR(45) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (page_id, ip)
            )
        `;
        
        // 현재 좋아요 상태 확인
        const existingLike = await sql`
            SELECT 1 FROM likes WHERE page_id = ${id} AND ip = ${ip}
        `;
        
        let liked;
        
        if (existingLike.rows.length > 0) {
            // 좋아요 취소
            await sql`
                DELETE FROM likes WHERE page_id = ${id} AND ip = ${ip}
            `;
            liked = false;
        } else {
            // 좋아요 추가
            await sql`
                INSERT INTO likes (page_id, ip) VALUES (${id}, ${ip})
            `;
            liked = true;
        }
        
        // 총 좋아요 수 조회
        const totalResult = await sql`
            SELECT COUNT(*) as total FROM likes WHERE page_id = ${id}
        `;
        
        const total = parseInt(totalResult.rows[0].total);
        
        res.status(200).json({
            success: true,
            total: total,
            liked: liked
        });
    } catch (error) {
        console.error('좋아요 토글 오류:', error);
        res.status(500).json({
            success: false,
            error: '좋아요 처리 중 오류가 발생했습니다'
        });
    }
}
