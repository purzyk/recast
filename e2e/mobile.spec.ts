import { expect, test } from '@playwright/test'

test('the phone menu opens, navigates and closes', async ({ page }) => {
  await page.goto('/')
  const menu = page.getByRole('button', { name: 'Menu' })
  await expect(menu).toHaveAttribute('aria-expanded', 'false')

  await menu.click()
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await page.locator('#app-menu').getByRole('link', { name: 'Experience' }).click()

  await expect(page).toHaveURL(/\/experience$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Experience library' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false')
})

test('escape closes the phone menu', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Menu' }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('#app-menu')).toBeHidden()
})

test('the add button fits the phone bar', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Add application' }).click()
  await expect(page).toHaveURL(/\/applications\/new$/)
})
