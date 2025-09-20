import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;
    readonly errorMessages: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByPlaceholder('Email');
        this.passwordInput = page.getByPlaceholder('Password');
        this.signInButton = page.getByRole('button', { name: 'Sign in' });
        this.errorMessages = page.locator('.error-messages li');
    }

    async goto() {
        await this.page.goto('/login');
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
    }

    async expectLoginSuccess() {
        await expect(this.page).toHaveURL('/');
        await expect(this.page.getByRole('link', { name: 'Your Feed' })).toBeVisible();
    }

    async expectLoginError(message: string) {
        await expect(this.errorMessages).toContainText(message);
    }
}