export function getClientIp(req) {
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

