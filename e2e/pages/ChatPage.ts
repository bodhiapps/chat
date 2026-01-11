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
    newChatButton: '[data-testid="btn-new-chat"]',
    userMessage: '[data-testid="message-user"]',
    assistantMessage: '[data-testid="message-assistant"]',
    streamingIndicator: '[data-testid="streaming-indicator"]',
    chatArea: '[data-testid="chat-area"]',
    conversationSidebar: '[data-testid="conversation-sidebar"]',
    newConversationButton: '[data-testid="btn-new-conversation"]',
    showSidebarButton: '[data-testid="btn-show-sidebar"]',
    hideSidebarButton: '[data-testid="btn-hide-sidebar"]',
    conversationItem: '[data-testid="conversation-item"]',
    deleteConversationButton: '[data-testid="btn-delete-conversation"]',
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
    const messageCountBefore = await this.getMessageCount();
    await this.page.locator(this.selectors.chatInput).fill(message);
    await this.page.locator(this.selectors.sendButton).click();
    await this.page
      .locator(`${this.selectors.userMessage}[data-test-index="${messageCountBefore}"]`)
      .waitFor({ state: 'visible' });
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async verifyLastUserMessage(expectedText: string): Promise<void> {
    await this.page
      .locator(this.selectors.chatArea + '[data-teststate="idle"]')
      .waitFor({ state: 'visible', timeout: 120000 });
    const messageCount = await this.getMessageCount();
    if (messageCount === 0) {
      throw new Error('No messages found');
    }
    const lastUserIndex = messageCount - 2;
    const lastUserMessage = this.page.locator(
      `${this.selectors.userMessage}[data-test-index="${lastUserIndex}"]`
    );
    await lastUserMessage.scrollIntoViewIfNeeded();
    await lastUserMessage.waitFor({ state: 'visible' });
    const text = await lastUserMessage.textContent();
    if (!text || !text.includes(expectedText)) {
      throw new Error(`Expected last user message to contain "${expectedText}", but got "${text}"`);
    }
  }

  async verifyLastAssistantMessage(expectedText: string): Promise<void> {
    await this.page
      .locator(this.selectors.chatArea + '[data-teststate="idle"]')
      .waitFor({ state: 'visible', timeout: 120000 });
    const messageCount = await this.getMessageCount();
    if (messageCount === 0) {
      throw new Error('No messages found');
    }
    const lastAssistantIndex = messageCount - 1;
    const lastAssistantMessage = this.page.locator(
      `${this.selectors.assistantMessage}[data-test-index="${lastAssistantIndex}"]`
    );
    await lastAssistantMessage.scrollIntoViewIfNeeded();
    await lastAssistantMessage.waitFor({ state: 'visible' });
    const text = await lastAssistantMessage.textContent();
    if (!text || !text.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(
        `Expected last assistant message to contain "${expectedText}", but got "${text}"`
      );
    }
  }

  async waitForResponse(timeout = 120000): Promise<string> {
    await this.page
      .locator(this.selectors.chatArea + '[data-teststate="idle"]')
      .waitFor({ timeout });
    const messages = await this.page.locator(this.selectors.assistantMessage).all();
    const lastMessage = messages[messages.length - 1];
    return (await lastMessage.textContent()) || '';
  }

  async clickNewChat(): Promise<void> {
    await this.page.locator(this.selectors.newChatButton).click();
  }

  async isSidebarVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.conversationSidebar).isVisible();
  }

  async clickShowSidebar(): Promise<void> {
    await this.page.locator(this.selectors.showSidebarButton).click();
  }

  async clickHideSidebar(): Promise<void> {
    await this.page.locator(this.selectors.hideSidebarButton).click();
  }

  async clickNewConversation(): Promise<void> {
    await this.page.locator(this.selectors.newConversationButton).click();
    await this.page.locator('[data-testid="chat-area"][data-test-message-count="0"]').waitFor();
  }

  async getConversationCount(): Promise<number> {
    return await this.page.locator(this.selectors.conversationItem).count();
  }

  async getConversationTitles(): Promise<string[]> {
    const items = await this.page.locator(this.selectors.conversationItem).all();
    const titles: string[] = [];
    for (const item of items) {
      const text = await item.textContent();
      titles.push(text?.trim() || '');
    }
    return titles;
  }

  async clickConversationByIndex(index: number): Promise<void> {
    const conversationItem = this.page.locator(this.selectors.conversationItem).nth(index);
    const chatId = await conversationItem.getAttribute('data-test-chat-id');
    await conversationItem.click();
    await this.waitForConversationLoaded(chatId || '');
  }

  async waitForConversationLoaded(expectedChatId?: string): Promise<void> {
    await this.page
      .locator('[data-testid="chat-container"][data-teststate="ready"]')
      .waitFor({ state: 'visible' });
    if (expectedChatId) {
      await this.page
        .locator(`[data-testid="chat-area"][data-test-chat-id="${expectedChatId}"]`)
        .waitFor({ state: 'visible' });
    } else {
      await this.page
        .locator('[data-testid="chat-area"]:not([data-test-chat-id=""])')
        .waitFor({ state: 'visible' });
    }
  }

  async deleteConversationByIndex(index: number): Promise<void> {
    const countBefore = await this.getConversationCount();
    const item = this.page.locator(this.selectors.conversationItem).nth(index);
    await item.hover();
    await item.locator(this.selectors.deleteConversationButton).click();
    await this.page
      .locator(
        `[data-testid="conversation-sidebar"][data-test-conversation-count="${countBefore - 1}"]`
      )
      .waitFor();
  }

  async getMessageCount(): Promise<number> {
    const userCount = await this.page.locator(this.selectors.userMessage).count();
    const assistantCount = await this.page.locator(this.selectors.assistantMessage).count();
    return userCount + assistantCount;
  }
}
