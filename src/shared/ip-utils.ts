import { Request } from 'express'

/**
 * Extracts the real client IP address from an Express request
 * Handles various proxy headers to get the actual client IP
 * @param req - Express request object
 * @returns The real client IP address
 */
export function getRealClientIP(req: Request): string {
    // Check common proxy headers in order of preference
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'x-client-ip',
        'cf-connecting-ip', // Cloudflare
        'x-cluster-client-ip',
        'x-forwarded',
        'forwarded-for',
        'forwarded'
    ];

    for (const header of headers) {
        const value = req.headers[header] as string;
        if (value) {
            // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
            // The first IP is usually the real client IP
            const ip = value.split(',')[0].trim();
            
            // Validate the IP format and skip localhost IPs from proxies
            if (isValidIP(ip) && !isLocalhost(ip)) {
                return ip;
            }
        }
    }

    // Get the IP from various Express sources
    let clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    
    // Convert IPv6 localhost to IPv4 for consistency
    if (clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
        clientIP = '127.0.0.1';
    }
    
    // If it's still localhost and we're in development, try to get a more meaningful IP
    if (isLocalhost(clientIP) && process.env.NODE_ENV === 'development') {
        // In development, return localhost with a note
        return '127.0.0.1 (localhost)';
    }
    
    return clientIP;
}

/**
 * Basic IP validation (supports both IPv4 and IPv6)
 * @param ip - IP address string to validate
 * @returns true if valid IP format
 */
function isValidIP(ip: string): boolean {
    // Remove any port numbers
    const cleanIP = ip.split(':')[0];
    
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(cleanIP) || ipv6Regex.test(ip) || cleanIP === 'localhost' || cleanIP === '127.0.0.1';
}

/**
 * Checks if an IP address is localhost/loopback
 * @param ip - IP address string to check
 * @returns true if it's a localhost IP
 */
function isLocalhost(ip: string): boolean {
    const localhostIPs = [
        '127.0.0.1',
        '::1',
        '::ffff:127.0.0.1',
        'localhost',
        '0.0.0.0',
        '::'
    ];
    
    return localhostIPs.includes(ip) || ip.startsWith('127.') || ip.startsWith('::ffff:127.');
} 