import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
    test('login page should not have any critical accessibility violations', async ({ page }) => {
        await page.goto('/login');
        
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        const criticalViolations = accessibilityScanResults.violations.filter(
            violation => violation.impact === 'critical'
        );

        expect(criticalViolations).toEqual([]);

        // Log all violations for reporting
        if (accessibilityScanResults.violations.length > 0) {
            console.log('Accessibility violations found:');
            console.log(JSON.stringify(accessibilityScanResults.violations, null, 2));
        }
    });

    test('home page should not have any critical accessibility violations', async ({ page }) => {
        await page.goto('/');
        
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        const criticalViolations = accessibilityScanResults.violations.filter(
            violation => violation.impact === 'critical'
        );

        expect(criticalViolations).toEqual([]);

        // Log all violations for reporting
        if (accessibilityScanResults.violations.length > 0) {
            console.log('Accessibility violations found:');
            console.log(JSON.stringify(accessibilityScanResults.violations, null, 2));
        }
    });
});