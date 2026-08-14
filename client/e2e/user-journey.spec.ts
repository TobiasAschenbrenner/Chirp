import { expect, test } from '@playwright/test';

test('registers a user, logs in, and creates a visible post', async ({ page }) => {
  const user = {
    fullName: 'E2E Test User',
    email: 'e2e.user@example.com',
    password: 'e2e-test-password',
  };

  const postBody = 'Post created by the full-stack E2E test';

  await page.goto('/register');

  await page.getByPlaceholder('Full name').fill(user.fullName);
  await page.getByPlaceholder('Email').fill(user.email);
  await page.getByPlaceholder('Password', { exact: true }).fill(user.password);
  await page.getByPlaceholder('Confirm password').fill(user.password);
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/login$/);

  await page.getByPlaceholder('Email').fill(user.email);
  await page.getByPlaceholder('Password').fill(user.password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/home$/);

  await page.getByPlaceholder("What's on your mind?").fill(postBody);
  await page.getByRole('button', { name: 'Post', exact: true }).click();

  await expect(page.getByText(postBody, { exact: true })).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText(postBody, { exact: true })).toBeVisible();
});
