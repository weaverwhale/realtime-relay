import * as fs from 'fs';
import { config } from 'dotenv';
config();

export const isLocal = process.env.IS_LOCAL === 'true';

let secrets: any;
export const secretsPath = '/etc/secrets/store';

function loadSecrets() {
  if (process.env.TW_SECRETS) {
    try {
      return JSON.parse(process.env.TW_SECRETS);
    } catch {}
  }

  if (fs.existsSync(secretsPath)) {
    const data = fs.readFileSync(secretsPath).toString();
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse secrets', e, data);
      throw e;
    }
  }

  return process.env;
}

export function getSecret(key: string): any {
  secrets = secrets || loadSecrets();
  if (isLocal) {
    return process.env[key] || secrets[key];
  }
  return secrets[key] || process.env[key];
}
