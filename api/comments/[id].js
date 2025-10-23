import pool from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { getClientIp } from '../../lib/utils.js';

export default async function handler(req, res) {
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
    const { password } = req.body;
    
    const ip = getClientIp(req);
    
    if (!commentId || !password) {
        return res.status(400).json({
            success: false,
            message: '댓글 ID와 비밀번호가 필요합니다'
        });
    }
    
    try {
        const commentResult = await pool.query(
            `SELECT comment_id, password_hash, ip as comment_ip
            FROM comments 
            WHERE comment_id = $1`,
            [commentId]
        );
        
        if (commentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '댓글을 찾을 수 없습니다'
            });
        }
        
        const comment = commentResult.rows[0];
        
        if (comment.comment_ip !== ip) {
            return res.status(403).json({
                success: false,
                message: '본인의 댓글만 삭제할 수 있습니다'
            });
        }
        
        const isPasswordValid = await bcrypt.compare(password, comment.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '비밀번호가 일치하지 않습니다'
            });
        }
        
        await pool.query(
            `DELETE FROM comments WHERE comment_id = $1`,
            [commentId]
        );
        
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
