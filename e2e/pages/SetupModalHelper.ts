import { Page } from '@playwright/test';

export class SetupModalHelper {
  constructor(private page: Page) {}

  private get iframeLocator() {
    return this.page.frameLocator('[data-testid="iframe-setup"]');
  }

  async waitForModalVisible(): Promise<void> {
    await this.page.locator('[data-testid="div-setup-overlay"]').waitFor({ state: 'visible' });
  }

  async waitForModalHidden(): Promise<void> {
    await this.page.locator('[data-testid="div-setup-overlay"]').waitFor({ state: 'hidden' });
  }

  async waitForModalReady(): Promise<void> {
    await this.iframeLocator
      .locator('[data-testid="loading-indicator"]')
      .waitFor({ state: 'hidden' });
  }

  async waitForServerSetupStep(): Promise<void> {
    await this.iframeLocator.locator('[data-testid="server-setup-step"]').waitFor();
  }

  async clickServerConfirmCheckbox(): Promise<void> {
    await this.iframeLocator.locator('[data-testid="server-confirm-checkbox"]').click();
  }

  async waitForLnaSetupStep(): Promise<void> {
    await this.iframeLocator.locator('[data-testid="lna-setup-step"]').waitFor();
  }

  async setUrlInput(url: string): Promise<void> {
    await this.iframeLocator.locator('[data-testid="lna-url-input"]').fill(url);
  }

  async clickConnectButton(): Promise<void> {
    await this.iframeLocator.locator('[data-testid="lna-connect-button"]').click();
  }

  async waitForSuccessState(): Promise<void> {
    await this.iframeLocator.locator('[data-testid="success-state-step"]').waitFor();
  }

  async clickContinueButton(): Promise<void> {
    await this.iframeLocator.locator('[data-testid="continue-button"]').click();
  }

  async completeDirectModeSetup(url: string): Promise<void> {
    await this.waitForModalVisible();
    await this.waitForModalReady();
    await this.waitForServerSetupStep();
    await this.clickServerConfirmCheckbox();
    await this.waitForLnaSetupStep();
    await this.setUrlInput(url);
    await this.clickConnectButton();
    await this.waitForSuccessState();
    await this.clickContinueButton();
    await this.waitForModalHidden();
  }
}
