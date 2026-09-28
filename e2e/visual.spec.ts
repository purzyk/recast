import { expect, test, type Page } from '@playwright/test'
import { SEED } from './seed'

// Relative times ("3d", "just now") are stable because the seed is dated
// relative to now. Absolute dates are not, so they are masked.
const DATE = /\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\b/

const screenshot = (page: Page, name: string) =>
  expect(page).toHaveScreenshot(name, { fullPage: true, mask: [page.getByText(DATE)] })

async function openApplication(page: Page, company: string) {
  await page.goto('/')
  await page
    .getByRole('link', { name: new RegExp(company) })
    .first()
    .click()
  await expect(page.getByRole('heading', { level: 1, name: company })).toBeVisible()
}

/** Generates the CV on first use and reopens it after, so every screenshot
 *  shows the same single version whatever order the tests run in. */
async function openCv(page: Page) {
  await openApplication(page, SEED.tailoring.company)
  const existing = page.getByRole('link', { name: 'CV', exact: true })
  if (await existing.count()) {
    await existing.first().click()
  } else {
    await page.getByRole('link', { name: 'Open tailoring' }).click()
    await page.getByRole('button', { name: /^Generate CV/ }).click()
  }
  await expect(page).toHaveURL(/\/documents\/\d+$/)
  await expect(page.getByText(/requirements matched/)).toBeVisible()
}

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme })

    test('board', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('link', { name: new RegExp(SEED.tailoring.company) }).first()).toBeVisible()
      await screenshot(page, `board-${colorScheme}.png`)
    })

    test('application', async ({ page }) => {
      await openApplication(page, SEED.interview.company)
      await screenshot(page, `application-${colorScheme}.png`)
    })

    test('duplicate warning', async ({ page }) => {
      await page.goto('/applications/new')
      await page.getByLabel('Company').fill(SEED.interview.company)
      await page.getByLabel('Role title').fill(SEED.interview.role)
      await expect(page.getByText('Already in your pipeline')).toBeVisible()
      await screenshot(page, `duplicate-warning-${colorScheme}.png`)
    })

    test('experience library', async ({ page }) => {
      await page.goto('/experience')
      await expect(page.getByRole('heading', { level: 1, name: 'Experience library' })).toBeVisible()
      await screenshot(page, `experience-${colorScheme}.png`)
    })

    // Nothing is ever generated for this application, so the button always reads v1.
    test('tailoring', async ({ page }) => {
      await openApplication(page, SEED.interview.company)
      await page.getByRole('link', { name: 'Open tailoring' }).click()
      await expect(
        page.getByRole('heading', { level: 1, name: `Tailoring for ${SEED.interview.company}` }),
      ).toBeVisible()
      await screenshot(page, `tailor-${colorScheme}.png`)
    })

    test('tailored CV', async ({ page }) => {
      await openCv(page)
      await screenshot(page, `cv-${colorScheme}.png`)
    })
  })
}

test('CV print preview', async ({ page }) => {
  await openCv(page)
  const [preview] = await Promise.all([page.waitForEvent('popup'), page.getByRole('link', { name: 'Preview' }).click()])
  await expect(preview.getByRole('heading', { level: 1 })).toBeVisible()
  await screenshot(preview, 'cv-print.png')
})

test.describe('phone', () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 })

  test('board with the menu open', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.locator('#app-menu')).toBeVisible()
    await expect(page).toHaveScreenshot('phone-menu.png')
  })
})
