import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');

const keys = webpush.generateVAPIDKeys();

const envPath = path.join(root, '.env.local');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

function upsertEnv(key: string, value: string) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  envContent = regex.test(envContent)
    ? envContent.replace(regex, line)
    : `${envContent.trim()}\n${line}\n`;
}

upsertEnv('VITE_VAPID_PUBLIC_KEY', keys.publicKey);
upsertEnv('VAPID_PUBLIC_KEY', keys.publicKey);
upsertEnv('VAPID_PRIVATE_KEY', keys.privateKey);

fs.writeFileSync(envPath, envContent.trim() + '\n');

console.log('VAPID keys written to .env.local');
console.log('Public key:', keys.publicKey);
