import { test as setup } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

const AUTH_DIR = path.resolve(__dirname, '../../.auth');
const CREDENTIALS_PATH = path.join(AUTH_DIR, 'test-user.json');

setup('prepare test credentials', async () => {
  const email = process.env.TEST_EMAIL || 'testuser@example.com';
  const password = process.env.TEST_PASSWORD || 'Test123!';
  const username = process.env.TEST_USERNAME || email.split('@')[0];

  const credentials = {
    email,
    password,
    username,
  };

  await fs.mkdir(AUTH_DIR, { recursive: true });
  await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2), 'utf-8');

  process.env.TEST_EMAIL = email;
  process.env.TEST_PASSWORD = password;

  console.log('Prepared test credentials:', {
    email,
    username,
    password: password ? '[set]' : '[missing]',
  });
});
