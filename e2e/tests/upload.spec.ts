import { test, expect } from '@playwright/test'

test.describe('Document upload', () => {
  test.beforeEach(async ({ page }) => {
    // Backend /api/auth/me returns dev user; frontend must be configured to use backend.
    await page.goto('/documents')
    // If redirected to login, auth is required for documents.
    if (page.url().includes('/login')) {
      test.skip()
    }
  })

  test('documents page has upload area or document list', async ({ page }) => {
    await expect(
      page.getByText(/drop legal pdfs|documents|upload/i).first()
    ).toBeVisible({ timeout: 10000 })
  })
})
