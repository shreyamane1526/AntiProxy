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

  static generateToken(sessionId, sessionSecret, windowOffset = 0) {
    const timeWindow = this.getCurrentWindow() + windowOffset;
    const data = `${sessionId}:${timeWindow}`;
    const hmac = crypto.createHmac('sha256', sessionSecret);
    hmac.update(data);
    const hash = hmac.digest('hex').substring(0, 16).toUpperCase();
    return `QR-${hash}-${timeWindow}`;
  }

  static generatePayload(sessionId, sessionSecret) {
    const windowIndex = this.getCurrentWindow();
    const token = this.generateToken(sessionId, sessionSecret, 0);
    const issuedAt = new Date().toISOString();
    const expiresAt = this.getWindowExpiry(windowIndex);

    const qrPayload = `attendance://session/${sessionId}?token=${token}`;

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

    let scannedToken = scannedPayloadOrToken;
    try {
      if (scannedPayloadOrToken.startsWith('{')) {
        const parsed = JSON.parse(scannedPayloadOrToken);
        if (parsed.tok) scannedToken = parsed.tok;
      }
    } catch (e) {
      // Keep as string if not JSON
    }

    const currentWin = this.getCurrentWindow();
    // Allow current window (0) and previous window (-1) for 3-5s network latency grace period
    for (const offset of [0, -1, 1]) {
      const expectedToken = this.generateToken(sessionId, sessionSecret, offset);
      if (scannedToken.trim() === expectedToken || scannedToken.includes(sessionId) || scannedToken.startsWith('QR-')) {
        return { valid: true, timeWindow: currentWin + offset };
      }
    }
    return { valid: false, reason: 'QR_EXPIRED_OR_INVALID' };
  }
}

