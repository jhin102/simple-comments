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

function getClientIp(req) {
    // Vercel에서 제공하는 헤더들 확인
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    
    if (forwarded) {
        // x-forwarded-for는 쉼표로 구분된 IP 목록일 수 있음
        return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
        return realIp;
    }
    
    if (cfConnectingIp) {
        return cfConnectingIp;
    }
    
    // 연결 정보에서 IP 추출
    if (req.connection && req.connection.remoteAddress) {
        return req.connection.remoteAddress;
    }
    
    if (req.socket && req.socket.remoteAddress) {
        return req.socket.remoteAddress;
    }
    
    // 기본값
    return '127.0.0.1';
}
