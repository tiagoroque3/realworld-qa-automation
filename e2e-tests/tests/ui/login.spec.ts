import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '../../pages/login.page';

type StoredCredentials = {
    email: string;
    password: string;
    username?: string;
};

const credentialsPath = path.resolve(__dirname, '../../.auth/test-user.json');

function loadStoredCredentials(): StoredCredentials {
    if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
        return {
            email: process.env.TEST_EMAIL,
            password: process.env.TEST_PASSWORD,
            username: process.env.TEST_USERNAME,
        } as StoredCredentials;
    }

    if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Missing test credentials file at ${credentialsPath}. Has the setup project run?`);
    }

    const data = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8')) as Partial<StoredCredentials>;
    if (!data.email || !data.password) {
        throw new Error(`Stored credentials file is invalid: ${credentialsPath}`);
    }

    return { email: data.email, password: data.password, username: data.username };
}

async function mockAuthenticatedRequests(page: Page) {
    await page.route('**/api/articles/feed*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ articles: [], articlesCount: 0 }),
        });
    });

    await page.route('**/api/articles*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ articles: [], articlesCount: 0 }),
        });
    });

    await page.route('**/api/tags*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ tags: [] }),
        });
    });
}

test.describe('Login', () => {
    let loginPage: LoginPage;
    let credentials: StoredCredentials;

    test.beforeAll(() => {
        credentials = loadStoredCredentials();
        console.log('Loaded test credentials for login flow:', {
            email: credentials.email,
            password: credentials.password ? '[password set]' : '[missing]'
        });
    });

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.route('**/api/users/login', async route => {
            const responseBody = {
                user: {
                    email: credentials.email,
                    token: 'mock-jwt-token',
                    username: credentials.username || credentials.email.split('@')[0],
                    bio: null,
                    image: null,
                },
            };

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(responseBody),
            });
        });

        await mockAuthenticatedRequests(page);

        console.log('=== Login Test Configuration ===');
        console.log('Test email:', credentials.email);
        console.log('Test password:', credentials.password ? '[password set]' : '[missing]');
        console.log('Web URL:', process.env.WEB_URL);
        console.log('API URL:', process.env.API_URL);
        console.log('Current page URL:', page.url());
        
        await loginPage.login(credentials.email, credentials.password);

        await page.waitForTimeout(1000);
        console.log('Current URL after login:', page.url());
        
        await loginPage.expectLoginSuccess();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.route('**/api/users/login', async route => {
            await route.fulfill({
                status: 422,
                contentType: 'application/json',
                body: JSON.stringify({ errors: { 'email or password': ['is invalid'] } }),
            });
        });

        await loginPage.login('invalid@example.com', 'wrongpassword');
        await loginPage.expectLoginError('email or password is invalid');
    });
});

