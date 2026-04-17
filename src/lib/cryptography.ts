import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { IV_LENGTH, DATA_ENCRYPTION_KEY } from '$env/static/private';

if (!IV_LENGTH || !DATA_ENCRYPTION_KEY) {
  throw new Error('Missing environment keys');
}

const ivLength = parseInt(IV_LENGTH);

// Convert hex string into 32 raw bytes
const encryptionKey = Buffer.from(DATA_ENCRYPTION_KEY, 'hex');

if (encryptionKey.length !== 32) {
  throw new Error('Encryption key must be 32 bytes for AES-256');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(ivLength);

  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuffer = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

  return decrypted.toString('utf8');
}

// Password hashing functions
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// OTP hashing functions (lower salt rounds for performance)
export async function hashOtp(otp: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(otp, saltRounds);
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(otp, hash);
}
