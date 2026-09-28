import { expect, test, type Page } from '@playwright/test'
import { createApplication } from './helpers'
import { SEED } from './seed'

async function openTailoring(page: Page, company: string) {
  await page.goto('/')
  await page
    .getByRole('link', { name: new RegExp(company) })
    .first()
    .click()
  await page.getByRole('link', { name: 'Open tailoring' }).click()
  await expect(page).toHaveURL(/\/tailor$/)
}

test('generating a CV shows progress, then the document with its sources', async ({ page }) => {
  await openTailoring(page, SEED.tailoring.company)
  await page.getByRole('button', { name: /^Generate CV v\d+$/ }).click()

  await expect(page.getByRole('status').getByText(`Tailoring for ${SEED.tailoring.company}`)).toBeVisible()

  await expect(page).toHaveURL(/\/documents\/\d+$/)
  await expect(page.getByRole('heading', { level: 1, name: `CV for ${SEED.tailoring.company}` })).toBeVisible()

  // The stub matches React and TypeScript to skill entries; Kubernetes has no evidence.
  await expect(page.getByText('2 of 3 requirements matched to an experience entry.')).toBeVisible()
  await expect(page.getByText('1 unmatched: Kubernetes')).toBeVisible()

  await expect(page.getByText('Rebuilt the booking flow in React and TypeScript')).toBeVisible()
  await expect(page.getByText('Stub summary of Tide Tracker.')).toBeVisible()
  await expect(page.getByText(/by claude-stub · 1,200 tokens in, 345 out/)).toBeVisible()
})

test('a CV is copied as plain text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await openTailoring(page, SEED.tailoring.company)
  await page.getByRole('button', { name: /^Generate CV/ }).click()
  await expect(page).toHaveURL(/\/documents\/\d+$/)

  await page.getByRole('button', { name: 'Copy as text' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()

  // Windows puts CRLF on the clipboard.
  const text = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')
  expect(text).toContain('Summary\n\nFrontend engineer who ships React interfaces.')
  expect(text).not.toContain('**')
})

test('the print preview renders the CV from the profile and entries', async ({ page }) => {
  await openTailoring(page, SEED.tailoring.company)
  await page.getByRole('button', { name: /^Generate CV/ }).click()
  await expect(page).toHaveURL(/\/documents\/\d+$/)

  const [preview] = await Promise.all([page.waitForEvent('popup'), page.getByRole('link', { name: 'Preview' }).click()])
  await expect(preview).toHaveTitle('Alex-Tester-CV-Northwind-Labs')
  await expect(preview.getByRole('heading', { level: 1, name: 'ALEX TESTER' })).toBeVisible()
  await expect(preview.getByRole('link', { name: 'Harbour Digital' })).toHaveAttribute(
    'href',
    'https://harbour.example',
  )
  await expect(preview.getByText('Harbour Portal')).toBeVisible()
})

test('generating a cover letter', async ({ page }) => {
  await openTailoring(page, SEED.tailoring.company)
  await page.getByText('Cover letter', { exact: true }).click()
  await page.getByRole('button', { name: /^Generate Cover letter v\d+$/ }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: `Cover letter for ${SEED.tailoring.company}` }),
  ).toBeVisible()
  await expect(page.getByText('Stub evidence paragraph.')).toBeVisible()
})

test('a new generation adds a version instead of replacing one', async ({ page }) => {
  await createApplication(page, 'Versions', 'Requirements:\n- React')
  await page.getByRole('link', { name: 'Open tailoring' }).click()
  await page.getByRole('button', { name: 'Generate CV v1' }).click()
  await expect(page).toHaveURL(/\/documents\/\d+$/)

  await page.getByRole('link', { name: 'Generate another version' }).click()
  await page.getByRole('button', { name: 'Generate CV v2' }).click()
  await expect(page.getByText('CV v2', { exact: false }).first()).toBeVisible()

  const versions = page.getByRole('navigation', { name: 'CV versions' })
  await expect(versions.getByRole('link', { name: 'v1' })).toBeVisible()
  await expect(versions.getByText('v2')).toHaveAttribute('aria-current', 'page')
})

test('a refusal is reported and nothing is saved', async ({ page }) => {
  await openTailoring(page, SEED.refusal.company)
  await page.getByRole('button', { name: /^Generate CV/ }).click()

  await expect(page.getByRole('alert').filter({ hasText: 'Nothing was saved' })).toHaveText(
    'The model declined this request. Nothing was saved.',
  )
  await expect(page).toHaveURL(/\/tailor$/)
  await page.getByRole('link', { name: SEED.refusal.company }).first().click()
  await expect(page.getByText('Nothing tailored for this application yet.')).toBeVisible()
})

test('tailoring waits for a job description', async ({ page }) => {
  await createApplication(page, 'No posting')
  await page.getByRole('link', { name: 'Open tailoring' }).click()
  await expect(page.getByRole('button', { name: /^Generate CV/ })).toBeDisabled()

  await page.getByLabel('Job description').fill('Requirements:\n- React')
  await page.getByRole('button', { name: 'Save the posting' }).click()

  await expect(page.getByRole('button', { name: /^Generate CV/ })).toBeEnabled()
})
