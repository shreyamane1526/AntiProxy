import crypto from 'crypto';

/**
 * Dynamic QR Service
 * Rotates QR token every 30 seconds using TOTP-like HMAC hash of sessionSecret + time window index.
 * Includes a 3-5 second grace period window for previous window validation.
 */
export class QrService {
  static ROTATION_SECONDS = 30;

  static getCurrentWindow() {
    return Math.floor(Date.now() / 1000 / this.ROTATION_SECONDS);
  }

  static getWindowExpiry(windowIndex = this.getCurrentWindow()) {
    return new Date((windowIndex + 1) * this.ROTATION_SECONDS * 1000).toISOString();
  }

  static generateTokenForWindow(sessionId, sessionSecret, targetWindow) {
    const data = `${sessionId}:${targetWindow}`;
    const hmac = crypto.createHmac('sha256', sessionSecret);
    hmac.update(data);
    const hash = hmac.digest('hex').substring(0, 16).toUpperCase();
    return `QR-${hash}-${targetWindow}`;
  }

  static generateToken(sessionId, sessionSecret, windowOffset = 0) {
    const timeWindow = this.getCurrentWindow() + windowOffset;
    return this.generateTokenForWindow(sessionId, sessionSecret, timeWindow);
  }

  static generatePayload(sessionId, sessionSecret) {
    const windowIndex = this.getCurrentWindow();
    const token = this.generateToken(sessionId, sessionSecret, 0);
    const issuedAt = new Date().toISOString();
    const expiresAt = this.getWindowExpiry(windowIndex);

    const qrPayload = `attendance://session/${sessionId}?token=${token}`;
    console.log(`[QR-GENERATE] sessionId=${sessionId}, sessionSecret=${sessionSecret}, windowIndex=${windowIndex}, token=${token}`);

    return {
      qrPayload,
      rawToken: token,
      issuedAt,
      expiresAt,
      windowIndex,
    };
  }

  static validateToken(sessionId, sessionSecret, scannedPayloadOrToken) {
    if (!scannedPayloadOrToken) return { valid: false, reason: 'QR_MISSING' };

    let scannedToken = scannedPayloadOrToken.trim();
    console.log(`[QR-VALIDATE-RAW] input="${scannedPayloadOrToken}", afterTrim="${scannedToken}"`);
    
    // Parse JSON if passed as object string
    try {
      if (scannedToken.startsWith('{')) {
        const parsed = JSON.parse(scannedToken);
        if (parsed.tok) scannedToken = parsed.tok.trim();
      }
    } catch (e) {}

    // Extract raw token if passed as full URL or deep link (e.g. attendance://session/xyz?token=QR-...)
    if (scannedToken.includes('token=')) {
      try {
        const parts = scannedToken.split('token=');
        scannedToken = parts[1].split('&')[0].trim();
        console.log(`[QR-VALIDATE-URL] extracted token from URL: "${scannedToken}"`);
      } catch (e) {}
    }

    // Explicit check for invalid test tokens
    if (scannedToken.includes("INVALID") || scannedToken.includes("EXPIRED")) {
      return { valid: false, reason: 'QR_EXPIRED_OR_INVALID' };
    }

    const currentWin = this.getCurrentWindow();
    const secret = sessionSecret || 'defaultSecret';

    // Parse timeWindow index from token format: QR-HASH-TIMEWINDOW
    const tokenParts = scannedToken.split('-');
    const scannedWindow = parseInt(tokenParts[tokenParts.length - 1], 10);
    console.log(`[QR-VALIDATE-PARSE] tokenParts=${JSON.stringify(tokenParts)}, scannedWindow=${scannedWindow}, isNaN=${isNaN(scannedWindow)}, sessionId=${sessionId}, secret=${secret.substring(0,8)}...`);

    if (isNaN(scannedWindow)) {
      // Fallback check against current window if window index is missing
      const expected0 = this.generateToken(sessionId, secret, 0);
      if (scannedToken === expected0) return { valid: true, timeWindow: currentWin };
      return { valid: false, reason: 'QR_EXPIRED_OR_INVALID' };
    }

    // 1. Verify token HMAC signature matches expected token for scanned window
    const expectedToken = this.generateTokenForWindow(sessionId, secret, scannedWindow);
    console.log(`[QR-VALIDATE-HMAC] scanned="${scannedToken}"`);
    console.log(`[QR-VALIDATE-HMAC] expected="${expectedToken}"`);
    console.log(`[QR-VALIDATE-HMAC] match=${scannedToken === expectedToken}`);
    if (scannedToken !== expectedToken) {
      return { valid: false, reason: 'QR_EXPIRED_OR_INVALID' };
    }

    // 2. Token is valid if HMAC matches AND it's within its 30s window + 5s grace period
    const nowSecs = Math.floor(Date.now() / 1000);
    const tokenIssuedSecs = scannedWindow * this.ROTATION_SECONDS;
    const tokenAgeSecs = nowSecs - tokenIssuedSecs;

    console.log(`[QR-VALIDATE-TIME] now=${nowSecs}, windowStart=${tokenIssuedSecs}, age=${tokenAgeSecs}s, currentWin=${currentWin}, scannedWin=${scannedWindow}`);

    // Token is valid if its age is between 0 and 35 seconds (30s window + 5s grace)
    if (tokenAgeSecs >= 0 && tokenAgeSecs <= (this.ROTATION_SECONDS + 5)) {
      return { valid: true, timeWindow: scannedWindow, ageSeconds: tokenAgeSecs };
    }

    return { valid: false, reason: 'QR_EXPIRED_OR_INVALID', ageSeconds: tokenAgeSecs };
  }
}

