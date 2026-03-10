import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('unauthenticated user is redirected to login from /chat', async ({ page }) => {
    await page.goto('/chat')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page shows sign-in content', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in to legalmind/i })).toBeVisible()
  })
})
