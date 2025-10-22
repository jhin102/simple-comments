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
    
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        return await deleteComment(req, res);
    } catch (error) {
        console.error('댓글 삭제 API 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
}

async function deleteComment(req, res) {
    const { id: commentId } = req.query;
    const { password, ip } = req.body;
    
    if (!commentId || !password || !ip) {
        return res.status(400).json({
            success: false,
            message: '댓글 ID, 비밀번호, IP가 필요합니다'
        });
    }
    
    try {
        // 댓글 조회
        const commentResult = await sql`
            SELECT comment_id, password_hash, ip as comment_ip
            FROM comments 
            WHERE comment_id = ${commentId}
        `;
        
        if (commentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다'
            });
        }
        
        const comment = commentResult.rows[0];
        
        // IP 확인 (본인 댓글인지 체크)
        if (comment.comment_ip !== ip) {
            return res.status(403).json({
                success: false,
                message: '본인의 댓글만 삭제할 수 있습니다'
            });
        }
        
        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, comment.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '비밀번호가 일치하지 않습니다'
            });
        }
        
        // 댓글 삭제
        await sql`
            DELETE FROM comments WHERE comment_id = ${commentId}
        `;
        
        res.status(200).json({
            success: true,
            message: '댓글이 삭제되었습니다'
        });
    } catch (error) {
        console.error('댓글 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '댓글 삭제 중 오류가 발생했습니다'
        });
    }
}
