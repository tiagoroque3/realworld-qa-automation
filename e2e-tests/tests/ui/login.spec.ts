import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

test.describe('Login', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
    });

    test('should login successfully with valid credentials', async () => {
        await loginPage.login(
            process.env.TEST_EMAIL || '',
            process.env.TEST_PASSWORD || ''
        );
        await loginPage.expectLoginSuccess();
    });

    test('should show error with invalid credentials', async () => {
        await loginPage.login('invalid@example.com', 'wrongpassword');
        await loginPage.expectLoginError('email or password is invalid');
    });
});