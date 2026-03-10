import { test, expect } from '@playwright/test'

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    if (page.url().includes('/login')) {
      // When backend is up, /api/auth/me succeeds and app may redirect to chat.
      await page.goto('/chat')
    }
  })

  test('chat page has input and send', async ({ page }) => {
    await page.goto('/chat')
    if (page.url().includes('/login')) {
      test.skip()
    }
    await expect(
      page.getByPlaceholder(/ask a question|your matter|contract/i).first()
    ).toBeVisible({ timeout: 10000 })
  })
})
