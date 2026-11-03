import { test, expect } from '@playwright/test'

test('observe KingX home page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/KingX Uptime Monitor/i)

  // Capture a full-page screenshot of the dashboard
  await page.screenshot({ path: 'tests/e2e/screenshots/kingx-home.png', fullPage: true })

  // Observe page heading
  const heading = page.locator('h1, h2').first()
  await expect(heading).toBeVisible()

  // Wait for dashboard content to load
  await page.waitForTimeout(2000)
})

test('observe public status page', async ({ page }) => {
  await page.goto('/status/slug')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'tests/e2e/screenshots/kingx-status.png', fullPage: true })
})