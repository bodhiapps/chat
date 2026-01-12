import { Page, expect } from '@playwright/test';

class GeneralTab {
  constructor(private page: Page) {}

  async selectTheme(theme: 'system' | 'light' | 'dark'): Promise<void> {
    await this.page.locator('[data-testid="settings-general-theme"]').click();
    const displayName = theme.charAt(0).toUpperCase() + theme.slice(1);
    await this.page.getByRole('option', { name: displayName, exact: true }).click();
  }

  async setSystemMessage(message: string): Promise<void> {
    await this.page.locator('[data-testid="settings-general-systemMessage"]').fill(message);
  }

  async expectTheme(expected: 'system' | 'light' | 'dark'): Promise<void> {
    const trigger = this.page.locator('[data-testid="settings-general-theme"]');
    const displayName = expected.charAt(0).toUpperCase() + expected.slice(1);
    await expect(trigger).toContainText(displayName);
  }

  async expectSystemMessage(expected: string): Promise<void> {
    await expect(this.page.locator('[data-testid="settings-general-systemMessage"]')).toHaveValue(
      expected
    );
  }
}

class SamplingTab {
  constructor(private page: Page) {}

  async setTemperature(value: number): Promise<void> {
    const slider = this.page.locator('[data-testid="settings-sampling-temperature"]');
    const boundingBox = await slider.boundingBox();

    if (boundingBox) {
      const percentage = value / 2.0;
      const x = boundingBox.x + boundingBox.width * percentage;
      const y = boundingBox.y + boundingBox.height / 2;

      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.mouse.move(x, y);
      await this.page.mouse.up();
    }
  }

  async setTopP(value: number): Promise<void> {
    const slider = this.page.locator('[data-testid="settings-sampling-top_p"]');
    const boundingBox = await slider.boundingBox();

    if (boundingBox) {
      const percentage = value / 1.0;
      const x = boundingBox.x + boundingBox.width * percentage;
      const y = boundingBox.y + boundingBox.height / 2;

      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.mouse.move(x, y);
      await this.page.mouse.up();
    }
  }

  async setTopK(value: number): Promise<void> {
    const input = this.page.locator('input#top_k');
    await input.fill(value.toString());
  }

  async setMinP(value: number): Promise<void> {
    const slider = this.page.locator('[data-testid="settings-sampling-min_p"]');
    const boundingBox = await slider.boundingBox();

    if (boundingBox) {
      const percentage = value / 1.0;
      const x = boundingBox.x + boundingBox.width * percentage;
      const y = boundingBox.y + boundingBox.height / 2;

      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.mouse.move(x, y);
      await this.page.mouse.up();
    }
  }

  async setTypP(value: number): Promise<void> {
    const slider = this.page.locator('[data-testid="settings-sampling-typ_p"]');
    const boundingBox = await slider.boundingBox();

    if (boundingBox) {
      const percentage = value / 2.0;
      const x = boundingBox.x + boundingBox.width * percentage;
      const y = boundingBox.y + boundingBox.height / 2;

      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.mouse.move(x, y);
      await this.page.mouse.up();
    }
  }

  async setMaxTokens(value: number): Promise<void> {
    const input = this.page.locator('input#max_tokens');
    await input.fill(value.toString());
  }

  async getTemperature(): Promise<number> {
    const label = this.page
      .locator('label:has-text("Temperature")')
      .locator('..')
      .locator('.text-muted-foreground');
    const text = await label.textContent();
    return parseFloat(text || '0.8');
  }

  async getTopK(): Promise<number> {
    const input = this.page.locator('input#top_k');
    const value = await input.inputValue();
    return parseInt(value) || 0;
  }

  async expectTemperature(expected: number, tolerance = 0.1): Promise<void> {
    const actual = await this.getTemperature();
    expect(Math.abs(actual - expected) < tolerance).toBe(true);
  }

  async expectTopK(expected: number): Promise<void> {
    const actual = await this.getTopK();
    expect(actual).toBe(expected);
  }
}

class PenaltiesTab {
  constructor(private page: Page) {}

  async setRepeatLastN(value: number): Promise<void> {
    const input = this.page.locator('input#repeat_last_n');
    await input.fill(value.toString());
  }

  async setRepeatPenalty(value: number): Promise<void> {
    const slider = this.page.locator('[data-testid="settings-penalties-repeat_penalty"]');
    const boundingBox = await slider.boundingBox();

    if (boundingBox) {
      const percentage = value / 2.0;
      const x = boundingBox.x + boundingBox.width * percentage;
      const y = boundingBox.y + boundingBox.height / 2;

      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.mouse.move(x, y);
      await this.page.mouse.up();
    }
  }

  async setPresencePenalty(value: number): Promise<void> {
    const slider = this.page.locator('[data-testid="settings-penalties-presence_penalty"]');
    const boundingBox = await slider.boundingBox();

    if (boundingBox) {
      const percentage = (value + 2) / 4.0;
      const x = boundingBox.x + boundingBox.width * percentage;
      const y = boundingBox.y + boundingBox.height / 2;

      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.mouse.move(x, y);
      await this.page.mouse.up();
    }
  }

  async setFrequencyPenalty(value: number): Promise<void> {
    const slider = this.page.locator('[data-testid="settings-penalties-frequency_penalty"]');
    const boundingBox = await slider.boundingBox();

    if (boundingBox) {
      const percentage = (value + 2) / 4.0;
      const x = boundingBox.x + boundingBox.width * percentage;
      const y = boundingBox.y + boundingBox.height / 2;

      await this.page.mouse.move(x, y);
      await this.page.mouse.down();
      await this.page.mouse.move(x, y);
      await this.page.mouse.up();
    }
  }
}

class DisplayTab {
  constructor(private page: Page) {}

  async setDisableAutoScroll(value: boolean): Promise<void> {
    const toggle = this.page.locator('[data-testid="settings-display-disableAutoScroll"]');
    const isChecked = await toggle.isChecked();
    if (isChecked !== value) {
      await toggle.click();
    }
  }

  async setAlwaysShowSidebarOnDesktop(value: boolean): Promise<void> {
    const toggle = this.page.locator('[data-testid="settings-display-alwaysShowSidebarOnDesktop"]');
    const isChecked = await toggle.isChecked();
    if (isChecked !== value) {
      await toggle.click();
    }
  }

  async setAutoShowSidebarOnNewChat(value: boolean): Promise<void> {
    const toggle = this.page.locator('[data-testid="settings-display-autoShowSidebarOnNewChat"]');
    const isChecked = await toggle.isChecked();
    if (isChecked !== value) {
      await toggle.click();
    }
  }
}

export class SettingsSection {
  readonly general: GeneralTab;
  readonly sampling: SamplingTab;
  readonly penalties: PenaltiesTab;
  readonly display: DisplayTab;

  private selectors = {
    dialog: '[data-testid="settings-dialog"]',
    resetButton: '[data-testid="btn-reset-all-settings"]',
    tabGeneral: '[data-testid="tab-general"]',
    tabSampling: '[data-testid="tab-sampling"]',
    tabPenalties: '[data-testid="tab-penalties"]',
    tabDisplay: '[data-testid="tab-display"]',
  };

  constructor(private page: Page) {
    this.general = new GeneralTab(page);
    this.sampling = new SamplingTab(page);
    this.penalties = new PenaltiesTab(page);
    this.display = new DisplayTab(page);
  }

  async selectTab(tab: 'general' | 'sampling' | 'penalties' | 'display'): Promise<void> {
    const selectorKey =
      `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}` as keyof typeof this.selectors;
    const tabSelector = this.selectors[selectorKey] as string;
    await this.page.locator(tabSelector).click();
  }

  async resetAllSettings(): Promise<void> {
    await this.page.locator(this.selectors.resetButton).click();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.locator(this.selectors.dialog).waitFor({ state: 'hidden' });
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.locator(this.selectors.dialog)).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.page.locator(this.selectors.dialog)).not.toBeVisible();
  }
}
