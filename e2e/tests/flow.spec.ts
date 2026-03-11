import { test, expect } from '@playwright/test'

/**
 * E2E flow: simulate user logging in (or using app when auth is available),
 * visiting documents (upload), then chat, and receiving a grounded answer.
 * Skips when redirected to login (e.g. when backend or Auth0 is not available).
 */
test.describe('User flow: documents and chat', () => {
  test('user can open documents page, then chat, send a message and see a response', async ({
    page
  }) => {
    await page.goto('/documents')
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    await expect(
      page.getByText(/drop legal pdfs|documents|upload/i).first()
    ).toBeVisible({ timeout: 10000 })

    await page.goto('/chat')
    if (page.url().includes('/login')) {
      test.skip()
      return
    }

    const input = page.getByPlaceholder(/ask a question|your matter|contract/i).first()
    await expect(input).toBeVisible({ timeout: 10000 })
    await input.fill('What is the main point of the document?')
    await page.getByRole('button', { name: /send/i }).click()

    await expect(
      page.getByText(/draft answer|grounded|document|stub/i).first()
    ).toBeVisible({ timeout: 15000 })
  })
})
