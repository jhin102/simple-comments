export function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    if (realIp) {
        return realIp;
    }
    
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    if (req.connection && req.connection.remoteAddress) {
        return req.connection.remoteAddress;
    }
    
    if (req.socket && req.socket.remoteAddress) {
        return req.socket.remoteAddress;
    }
    
    return '127.0.0.1';
}

