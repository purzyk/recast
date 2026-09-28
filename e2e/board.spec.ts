import { expect, test, type Page } from '@playwright/test'
import { createApplication } from './helpers'
import { SEED } from './seed'

async function openApplication(page: Page, company: string) {
  await page.goto('/')
  await page
    .getByRole('link', { name: new RegExp(company) })
    .first()
    .click()
  await expect(page.getByRole('heading', { level: 1, name: company })).toBeVisible()
}

test('the board lists seeded applications', async ({ page }) => {
  await page.goto('/')
  for (const { company } of Object.values(SEED)) {
    await expect(page.getByRole('link', { name: new RegExp(company) }).first()).toBeVisible()
  }
})

test('adding an application opens its record and puts it on the board', async ({ page }) => {
  const company = `Larkspur ${Date.now()}`
  await page.goto('/')
  await page.getByRole('link', { name: 'Add application' }).click()

  await page.getByLabel('Company').fill(company)
  await page.getByLabel('Role title').fill('Frontend Engineer')
  await page.getByLabel('Status').selectOption('applied')
  await page.getByLabel('Source link').fill('https://jobs.example/larkspur')
  await page.getByLabel('Job description').fill('Requirements:\n- React\n- TypeScript')
  await page.getByRole('button', { name: 'Save application' }).click()

  await expect(page).toHaveURL(/\/applications\/\d+$/)
  await expect(page.getByRole('heading', { level: 1, name: company })).toBeVisible()
  await expect(page.getByText('Applied · just now')).toBeVisible()
  await expect(page.getByRole('link', { name: /jobs\.example/ })).toBeVisible()

  await page.getByRole('navigation').getByRole('link', { name: 'Board' }).click()
  await expect(page.getByRole('link', { name: new RegExp(company) })).toBeVisible()
})

test('the duplicate guard offers the existing record, ignoring case', async ({ page }) => {
  await page.goto('/applications/new')
  await page.getByLabel('Company').fill(SEED.interview.company.toUpperCase())
  await page.getByLabel('Role title').fill(SEED.interview.role.toLowerCase())

  const warning = page.getByRole('status').filter({ hasText: 'Already in your pipeline' })
  await expect(warning).toContainText(SEED.interview.company)
  await expect(warning).toContainText('interview')

  await warning.getByRole('link', { name: 'Open the existing one' }).click()
  await expect(page.getByRole('heading', { level: 1, name: SEED.interview.company })).toBeVisible()
})

test('the duplicate guard can be dismissed', async ({ page }) => {
  await page.goto('/applications/new')
  await page.getByLabel('Company').fill(SEED.interview.company)
  await page.getByLabel('Role title').fill(SEED.interview.role)
  await page.getByRole('button', { name: 'Add anyway' }).click()
  await expect(page.getByText('Already in your pipeline')).toBeHidden()
})

test('moving an application records it in the history', async ({ page }) => {
  await createApplication(page, 'Moving')
  const history = page.locator('ol').filter({ hasText: 'Saved' })
  await expect(history.getByRole('listitem')).toHaveCount(1)

  await page.getByLabel('Move to another status').selectOption('applied')

  await expect(page.getByText('Applied · just now')).toBeVisible()
  await expect(history.getByRole('listitem')).toHaveCount(2)
  await expect(page.getByText('Moved to Applied today. Chase at 14 days.')).toBeVisible()
})

test('a note is added to the record', async ({ page }) => {
  await openApplication(page, SEED.interview.company)
  await expect(page.getByText('9 days in Interview. Worth chasing.')).toBeVisible()

  const note = `Second round booked, ref ${Date.now()}.`
  await page.getByLabel('Add a note').fill(note)
  await page.getByRole('button', { name: 'Add a note' }).click()

  await expect(page.getByText(note)).toBeVisible()
  await expect(page.getByText('Nothing noted yet.')).toBeHidden()
})

test('deleting an application asks first, then removes it', async ({ page }) => {
  const company = await createApplication(page, 'Delete Me')

  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('button', { name: `Delete ${company} for good` }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: new RegExp(company) })).toHaveCount(0)
})
