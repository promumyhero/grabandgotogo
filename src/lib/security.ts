import crypto from 'crypto';

/**
 * Hardened Cryptographic & Input Security Primitives (OWASP Top 10 Compliant)
 * - Password Hashing: Node native memory-hard `crypto.scrypt` + `crypto.timingSafeEqual`
 * - Timing Enumeration Defense: `verifyDummyPassword` constant-time work factor
 * - Session Integrity: HMAC-SHA256 signed payload with `crypto.timingSafeEqual`
 * - Brute-Force Protection: Sliding-window rate limiter with automatic TTL cleanup
 * - Anti-Injection Boundary Sanitization: Strict schema & control-char stripping
 */

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 32 * 1024 * 1024;

// Pre-computed dummy salt & key for constant-time non-existent user verification
const DUMMY_SALT_HEX = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const DUMMY_KEY_HEX = '0'.repeat(SCRYPT_KEYLEN * 2);

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

/**
 * Hash plaintext password using memory-hard scrypt KDF with 16-byte random salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const normalized = password.normalize('NFKC');
  const salt = crypto.randomBytes(16);
  const derivedKey = await scryptAsync(normalized, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

/**
 * Verify password against stored scrypt hash using constant-time comparison.
 */
export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined
): Promise<boolean> {
  if (!storedHash || typeof storedHash !== 'string') {
    await verifyDummyPassword(password);
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    await verifyDummyPassword(password);
    return false;
  }

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltHex = parts[4];
  const expectedKeyHex = parts[5];

  if (
    !Number.isFinite(N) ||
    !Number.isFinite(r) ||
    !Number.isFinite(p) ||
    !saltHex ||
    !expectedKeyHex
  ) {
    return false;
  }

  try {
    const normalized = password.normalize('NFKC');
    const salt = Buffer.from(saltHex, 'hex');
    const expectedKey = Buffer.from(expectedKeyHex, 'hex');
    const derivedKey = await scryptAsync(normalized, salt, expectedKey.length, {
      N,
      r,
      p,
      maxmem: SCRYPT_MAXMEM,
    });

    if (derivedKey.length !== expectedKey.length) return false;
    return crypto.timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}

/**
 * Execute constant-time dummy scrypt work when an email is not found
 * so attackers cannot enumerate registered accounts via response timing.
 */
export async function verifyDummyPassword(password: string): Promise<void> {
  try {
    const salt = Buffer.from(DUMMY_SALT_HEX, 'hex');
    const dummyExpected = Buffer.from(DUMMY_KEY_HEX, 'hex');
    const derived = await scryptAsync(password.normalize('NFKC'), salt, SCRYPT_KEYLEN, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: SCRYPT_MAXMEM,
    });
    crypto.timingSafeEqual(derived, dummyExpected);
  } catch {
    // ignore
  }
}

export interface SignedSessionPayload {
  uid: string;
  email: string;
  name: string;
  jti: string;
  iat: number;
  exp: number;
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  return 'fmp-fallback-dev-hmac-sha256-secret-key-do-not-use-in-prod';
}

/**
 * Sign a session payload using HMAC-SHA256 (tamper-proof stateless + revocable token).
 */
export function signSessionToken(payload: SignedSessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify a signed session token in constant time and check expiration.
 */
export function verifySessionToken(token: string | undefined | null): SignedSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSig] = parts;
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encodedPayload)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const json = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as SignedSessionPayload;
    if (
      !parsed ||
      typeof parsed.uid !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }

    if (Date.now() >= parsed.exp) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ==========================================
// INPUT SANITIZATION & BOUNDARY VALIDATION
// ==========================================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Strip control characters, null bytes, and HTML angle brackets to prevent XSS/Injection.
 */
export function sanitizePlainText(input: unknown, maxLength: number = 150): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function validateAndNormalizeEmail(input: unknown): {
  valid: boolean;
  email: string;
  error?: string;
} {
  if (typeof input !== 'string') {
    return { valid: false, email: '', error: 'Email wajib diisi.' };
  }
  const normalized = input.trim().toLowerCase().slice(0, 254);
  if (!normalized || !EMAIL_REGEX.test(normalized)) {
    return { valid: false, email: '', error: 'Format email tidak valid.' };
  }
  return { valid: true, email: normalized };
}

export function validatePasswordStrength(input: unknown): {
  valid: boolean;
  error?: string;
} {
  if (typeof input !== 'string') {
    return { valid: false, error: 'Password wajib diisi.' };
  }
  if (input.length < 8) {
    return { valid: false, error: 'Password minimal harus 8 karakter.' };
  }
  if (input.length > 128) {
    return { valid: false, error: 'Password maksimal 128 karakter.' };
  }
  if (!/[a-zA-Z]/.test(input) || !/[0-9]/.test(input)) {
    return {
      valid: false,
      error: 'Password harus mengandung kombinasi huruf dan angka.',
    };
  }
  return { valid: true };
}

export function clampNumber(
  val: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

// ==========================================
// SLIDING-WINDOW RATE LIMITER
// ==========================================

interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  maxAttempts: number = 8,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Periodic cleanup to prevent memory bloat
  if (rateLimitStore.size > 2000) {
    for (const [k, v] of rateLimitStore.entries()) {
      const active = v.timestamps.filter((t) => t > cutoff);
      if (active.length === 0) rateLimitStore.delete(k);
    }
  }

  const bucket = rateLimitStore.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= maxAttempts) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    rateLimitStore.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  bucket.timestamps.push(now);
  rateLimitStore.set(key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - bucket.timestamps.length),
    retryAfterSec: 0,
  };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

