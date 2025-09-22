import { expect, Page } from '@playwright/test';

const LOGIN_PATH = process.env.LOGIN_PATH || '/login';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(LOGIN_PATH);
  }

  async login(email: string, password: string) {
    console.log('Starting login process...');
    
    // Se houver um link "Sign in" no header, usa-o (por vezes o goto cai na home)
    const signIn = this.page.getByRole('link', { name: /^sign in$/i });
    if (await signIn.isVisible().catch(() => false)) {
      console.log('Clicking Sign In link...');
      await signIn.click();
    }

    console.log('Filling login form...');
    await this.page.getByPlaceholder(/email/i).fill(email);
    await this.page.getByPlaceholder(/password/i).fill(password);

    // Set up network request listener before clicking
    console.log('Setting up network listener...');
    
    // Track all API requests for debugging
    this.page.on('request', request => {
      if (request.url().includes('api')) {
        console.log('API Request:', {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    this.page.on('response', async response => {
      if (response.url().includes('api')) {
        const responseBody = await response.text().catch(() => 'Failed to get response text');
        console.log('API Response:', {
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: responseBody
        });
      }
    });

    const responsePromise = this.page.waitForResponse(
      (r) => {
        const isLoginEndpoint = r.url().includes('api.realworld.io/api/users/login') || 
                               r.url().includes('/api/users/login');
        if (isLoginEndpoint) {
          console.log('Login response found:', r.url());
        }
        return isLoginEndpoint && (r.status() >= 200 && r.status() < 500);
      },
      { timeout: 20000 } // Increased timeout to 20s
    );

    // Click sign in and wait for response
    console.log('Clicking Sign In button...');
    const signInButton = this.page.getByRole('button', { name: /^sign in$/i });
    await signInButton.click();

    try {
      const response = await responsePromise;
      console.log('Login response received:', {
        status: response.status(),
        body: await response.json().catch(() => 'Failed to parse response body')
      });
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Login request failed:', errorMessage);
      throw error;
    }

    // Response logging is now handled in the try/catch block
  }

  async expectLoginSuccess() {
    console.log('Checking for successful login...');
    console.log('Current URL:', await this.page.url());
    
    // Wait for authentication to complete
    await this.page.waitForLoadState('networkidle');
    
    // First, let's check what links are actually present
    const links = await this.page.getByRole('link').all();
    console.log('Available links:', await Promise.all(links.map(async link => {
      const name = await link.getAttribute('href');
      const text = await link.textContent();
      return `${text} (${name})`;
    })));
    
    // Check for multiple authenticated-only elements with different approaches
    const newArticle = this.page.getByRole('link', { name: /new article/i });
    const settings = this.page.getByRole('link', { name: /settings/i });
    const feed = this.page.getByRole('link', { name: /your feed/i });
    
    // Try locating elements by text as backup
    const altNewArticle = this.page.getByText(/new article/i);
    const altSettings = this.page.getByText(/settings/i);
    const altFeed = this.page.getByText(/your feed/i);

    // Log presence of each element
    console.log('Element visibility:', {
      'New Article (role)': await newArticle.isVisible().catch(() => false),
      'Settings (role)': await settings.isVisible().catch(() => false),
      'Feed (role)': await feed.isVisible().catch(() => false),
      'New Article (text)': await altNewArticle.isVisible().catch(() => false),
      'Settings (text)': await altSettings.isVisible().catch(() => false),
      'Feed (text)': await altFeed.isVisible().catch(() => false)
    });
    
    const authenticatedNav = this.page.locator('a.nav-link', { hasText: /(new article|settings|your feed)/i });

    await expect.poll(async () => authenticatedNav.count(), {
      timeout: 15000,
      message: 'Authenticated navigation links did not appear after login',
    }).toBeGreaterThan(0);

    await authenticatedNav.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async expectLoginError(msg: string) {
    console.log('Checking for login error message...');
    console.log('Current URL:', await this.page.url());
    
    // Wait for any error messages to appear
    await this.page.waitForLoadState('networkidle');
    
    // Get all text content for debugging
    const bodyText = await this.page.textContent('body');
    console.log('Page text content:', bodyText);
    
    // Look for error messages in multiple ways
    const errList = this.page.locator('.error-messages li');
    const roleAlert = this.page.getByRole('alert');
    const textExact = this.page.getByText(new RegExp(msg, 'i'));
    const generic = this.page.getByText(/invalid|error|password/i);
    
    // Log what we find
    const elements = {
      'Error list items': await errList.count(),
      'Alert role present': await roleAlert.count() > 0,
      'Exact message match': await textExact.count() > 0,
      'Generic error text': await generic.count() > 0
    };
    console.log('Error elements found:', elements);
    
    // Try to find any error indicators
    await expect(
      textExact
        .or(errList)
        .or(roleAlert)
        .or(generic)
    ).toBeVisible({ timeout: 15000 }); // Increased timeout to match success case
  }
}




