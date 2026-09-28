import { expect, type Page } from '@playwright/test'

/** A fresh application per test, for tests that change what they open, so a
 *  retry never finds the state an earlier attempt left behind. */
export async function createApplication(page: Page, prefix: string, jobDescription = '') {
  const company = `${prefix} ${Date.now()}`
  await page.goto('/applications/new')
  await page.getByLabel('Company').fill(company)
  await page.getByLabel('Role title').fill('Frontend Engineer')
  if (jobDescription) await page.getByLabel('Job description').fill(jobDescription)
  await page.getByRole('button', { name: 'Save application' }).click()
  await expect(page.getByRole('heading', { level: 1, name: company })).toBeVisible()
  return company
}
