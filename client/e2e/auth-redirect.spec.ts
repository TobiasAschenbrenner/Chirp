import { expect, test } from '@playwright/test';

test('redirects an unauthenticated user from home to login', async ({ page }) => {
  await page.goto('/home');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
