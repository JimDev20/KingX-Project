import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'https://king-x-project-13kl.vercel.app/',
    headless: false,
    channel: 'chrome',
    launchOptions: {
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    },
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'retain-on-failure',
  },
}

export default config