import { Page } from '@playwright/test';

export class ChatPage {
  constructor(private page: Page) {}

  selectors = {
    appTitle: '[data-testid="app-title"]',
    settingsButton: '[data-testid="btn-settings"]',
    loginButton: '[data-testid="btn-auth-login"]',
    logoutButton: '[data-testid="btn-auth-logout"]',
    authSection: '[data-testid="section-auth"]',
    authName: '[data-testid="span-auth-name"]',
    modelSelector: '[data-testid="model-selector"]',
    refreshModelsBtn: '[data-testid="btn-refresh-models"]',
    chatInput: '[data-testid="chat-input"]',
    sendButton: '[data-testid="send-button"]',
    userMessage: '[data-testid="message-user"]',
    assistantMessage: '[data-testid="message-assistant"]',
    streamingIndicator: '[data-testid="streaming-indicator"]',
    chatArea: '[data-testid="chat-area"]',
  };

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.selectors.appTitle).waitFor();
  }

  async clickSettings(): Promise<void> {
    await this.page.locator(this.selectors.settingsButton).click();
  }

  async clickLoginAndWaitForRedirect(): Promise<void> {
    await this.page.locator(this.selectors.loginButton).click();
    await this.page.waitForURL(/.*/);
  }

  async waitForAuthenticated(): Promise<void> {
    await this.page
      .locator(`${this.selectors.authSection}[data-teststate="authenticated"]`)
      .waitFor();
  }

  async waitForUnauthenticated(): Promise<void> {
    await this.page
      .locator(`${this.selectors.authSection}[data-teststate="unauthenticated"]`)
      .waitFor();
  }

  async fillKeycloakLogin(username: string, password: string): Promise<void> {
    await this.page.waitForSelector('#username');
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('#kc-login');

    await this.page.waitForURL(/.*\/chat\//);
  }

  async selectModel(modelName: string): Promise<void> {
    await this.page.locator(this.selectors.modelSelector).click();
    await this.page.getByRole('option', { name: modelName }).click();
  }

  async waitForModelsLoaded(): Promise<void> {
    await this.page.locator(this.selectors.refreshModelsBtn).waitFor({ state: 'visible' });
    await this.page.waitForFunction(() => {
      const selector = document.querySelector('[data-testid="model-selector"]');
      return selector && !selector.textContent?.includes('No models');
    });
  }

  async sendMessage(message: string): Promise<void> {
    await this.page.locator(this.selectors.chatInput).fill(message);
    await this.page.locator(this.selectors.sendButton).click();
  }

  async waitForResponse(timeout = 120000): Promise<string> {
    await this.page
      .locator(this.selectors.chatArea + '[data-teststate="idle"]')
      .waitFor({ timeout });
    const messages = await this.page.locator(this.selectors.assistantMessage).all();
    const lastMessage = messages[messages.length - 1];
    return (await lastMessage.textContent()) || '';
  }
}
