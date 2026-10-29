
const rateLimitMap = new Map();

const checkRateLimit = (clientIp) => {
    const now = Date.now();
    const rateData = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + 60000 };

    if (now > rateData.resetTime) {
        rateData.count = 0;
        rateData.resetTime = now + 60000;
    }

    if (rateData.count >= 5) {
        return { status: 429, message: 'Too Many Requests' };
    }

    rateData.count += 1;
    rateLimitMap.set(clientIp, rateData);
    return { status: 201, message: 'Created' };
};

const ip = '192.168.1.1';
for (let i = 1; i <= 5; i++) {
    console.log(`Request ${i}:`, checkRateLimit(ip).status);
}
console.log(`Request 6 (Should fail):`, checkRateLimit(ip).status);
