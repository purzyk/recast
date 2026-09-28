import { expect, test } from '@playwright/test'

test('an entry is added, edited and deleted', async ({ page }) => {
  const title = `Skill row ${Date.now()}`
  await page.goto('/experience')
  await page.getByRole('link', { name: 'Add entry' }).click()

  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Type').selectOption('skill')
  await page.getByLabel('Body').fill('GraphQL, Apollo')
  await page.getByRole('button', { name: 'Add entry' }).click()

  await expect(page).toHaveURL(/\/experience$/)
  await page.getByRole('link', { name: title }).click()
  await expect(page.getByLabel('Body')).toHaveValue('GraphQL, Apollo')

  await page.getByLabel('Body').fill('GraphQL, Apollo, Relay')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.getByRole('link', { name: title }).click()
  await expect(page.getByLabel('Body')).toHaveValue('GraphQL, Apollo, Relay')

  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('button', { name: `Delete “${title}” for good` }).click()
  await expect(page).toHaveURL(/\/experience$/)
  await expect(page.getByRole('link', { name: title })).toHaveCount(0)
})

test('the kind filter narrows the library', async ({ page }) => {
  await page.goto('/experience')
  await page.getByRole('navigation', { name: 'Filter by kind' }).getByRole('link', { name: /Skills/ }).click()

  await expect(page.getByRole('link', { name: 'Testing' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Frontend Engineer — Harbour Digital' })).toHaveCount(0)
})

test('a pasted CV is previewed, then added to the library', async ({ page }) => {
  const employer = `Stub Imports ${Date.now()}`
  await page.goto('/experience/import')
  await page.getByText('Paste text', { exact: true }).click()
  await page.getByLabel('CV as text').fill(`${employer}\nDeveloper, 2019 – 2023`)
  await page.getByRole('button', { name: 'Read the CV' }).click()

  await expect(page.getByRole('cell', { name: `Developer — ${employer}` })).toBeVisible()
  await page.getByRole('button', { name: 'Save 2 entries' }).click()

  await expect(page).toHaveURL(/\/experience$/)
  await expect(page.getByRole('link', { name: `Developer — ${employer}` })).toBeVisible()
})
