import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage.js';
import { SetupModalHelper } from './pages/SetupModalHelper.js';
import { BACKEND_URL, TEST_USER, TEST_PASSWORD } from './test-utils.js';

test.describe.configure({ mode: 'serial' });

test.describe('Core Chat Flow - Direct Mode', () => {
  test('complete flow: setup modal → login → select model → send message → receive streaming response', async ({
    page,
  }) => {
    const chatPage = new ChatPage(page);
    const setupModal = new SetupModalHelper(page);

    await page.goto('/');
    await chatPage.waitForPageLoad();

    await setupModal.waitForModalVisible();
    await setupModal.waitForModalReady();

    await setupModal.waitForServerSetupStep();
    await setupModal.clickServerConfirmCheckbox();

    await setupModal.waitForLnaSetupStep();
    await setupModal.setUrlInput(BACKEND_URL);
    await setupModal.clickConnectButton();

    await setupModal.waitForSuccessState();
    await setupModal.clickContinueButton();
    await setupModal.waitForModalHidden();

    await chatPage.waitForUnauthenticated();

    await chatPage.clickLoginAndWaitForRedirect();
    await chatPage.fillKeycloakLogin(TEST_USER, TEST_PASSWORD);

    await chatPage.waitForAuthenticated();

    await chatPage.waitForModelsLoaded();

    const testMessage = 'Answer in max 4 words: What day comes after Monday?';
    await chatPage.sendMessage(testMessage);

    const userMessages = await page.locator('[data-testid="message-user"]').all();
    expect(userMessages.length).toBeGreaterThan(0);
    const lastUserMessage = userMessages[userMessages.length - 1];
    await expect(lastUserMessage).toContainText(testMessage);

    const response = await chatPage.waitForResponse();

    expect(response.toLowerCase()).toContain('tuesday');

    const chatArea = page.locator('[data-testid="chat-area"]');
    await expect(chatArea).not.toHaveAttribute('data-teststate', 'error');

    const messageCountBeforeRefresh = await chatPage.getMessageCount();
    expect(messageCountBeforeRefresh).toBe(2);

    await page.reload();
    await chatPage.waitForPageLoad();
    await chatPage.waitForAuthenticated();

    const messageCountAfterRefresh = await chatPage.getMessageCount();
    expect(messageCountAfterRefresh).toBe(messageCountBeforeRefresh);

    const userMessagesAfterRefresh = await page.locator('[data-testid="message-user"]').all();
    const lastUserMessageAfterRefresh =
      userMessagesAfterRefresh[userMessagesAfterRefresh.length - 1];
    await expect(lastUserMessageAfterRefresh).toContainText(testMessage);

    const assistantMessagesAfterRefresh = await page
      .locator('[data-testid="message-assistant"]')
      .all();
    const lastAssistantMessageAfterRefresh =
      assistantMessagesAfterRefresh[assistantMessagesAfterRefresh.length - 1];
    const responseAfterRefresh = (await lastAssistantMessageAfterRefresh.textContent()) || '';
    expect(responseAfterRefresh.toLowerCase()).toContain('tuesday');

    const isSidebarVisible = await chatPage.isSidebarVisible();
    expect(isSidebarVisible).toBe(true);

    const conversationCountBefore = await chatPage.getConversationCount();
    expect(conversationCountBefore).toBeGreaterThan(0);

    await chatPage.clickNewConversation();

    const messageCountAfterNew = await chatPage.getMessageCount();
    expect(messageCountAfterNew).toBe(0);

    const testMessage2 = 'Answer in 1 word: What is 2+2?';
    await chatPage.sendMessage(testMessage2);
    const response2 = await chatPage.waitForResponse();
    expect(response2).toContain('4');

    const conversationCountAfter = await chatPage.getConversationCount();
    expect(conversationCountAfter).toBe(conversationCountBefore + 1);

    await chatPage.clickConversationByIndex(1);

    await page.waitForTimeout(500);

    const messagesInFirstConv = await chatPage.getMessageCount();
    expect(messagesInFirstConv).toBe(2);

    const userMessagesInFirstConv = await page.locator('[data-testid="message-user"]').all();
    const firstUserMessageInFirstConv = userMessagesInFirstConv[0];
    await expect(firstUserMessageInFirstConv).toContainText(testMessage);

    await chatPage.clickConversationByIndex(0);

    await page.waitForTimeout(500);

    const messagesInSecondConv = await chatPage.getMessageCount();
    expect(messagesInSecondConv).toBe(2);

    const userMessagesInSecondConv = await page.locator('[data-testid="message-user"]').all();
    const firstUserMessageInSecondConv = userMessagesInSecondConv[0];
    await expect(firstUserMessageInSecondConv).toContainText(testMessage2);

    const conversationCountBeforeDelete = await chatPage.getConversationCount();
    expect(conversationCountBeforeDelete).toBe(2);

    await chatPage.deleteConversationByIndex(0);

    await page.waitForTimeout(500);

    const conversationCountAfterDelete = await chatPage.getConversationCount();
    expect(conversationCountAfterDelete).toBe(1);

    const messageCountAfterDelete = await chatPage.getMessageCount();
    expect(messageCountAfterDelete).toBe(0);

    await page.reload();
    await chatPage.waitForPageLoad();
    await chatPage.waitForAuthenticated();

    const conversationCountAfterRefresh2 = await chatPage.getConversationCount();
    expect(conversationCountAfterRefresh2).toBe(1);

    const remainingTitles = await chatPage.getConversationTitles();
    expect(remainingTitles[0]).toContain('Answer in max 4 words: What day comes after Monday?');
    expect(remainingTitles.length).toBe(1);
  });
});
