import { getClientIp } from '../lib/utils.js';

export default function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // IP 주소 추출
        const ip = getClientIp(req);
        
        res.status(200).json({
            success: true,
            ip: ip
        });
    } catch (error) {
        console.error('IP 가져오기 오류:', error);
        res.status(500).json({
            success: false,
            error: 'IP를 가져올 수 없습니다'
        });
    }
}
