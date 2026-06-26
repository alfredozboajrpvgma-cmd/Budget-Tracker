import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

export function requireEnv(name: string): string {
  const value = process.env[name]
    || (name.startsWith('VITE_') ? process.env[name.replace('VITE_', '')] : undefined);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getVapidPublicKey(): string {
  return process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
}
