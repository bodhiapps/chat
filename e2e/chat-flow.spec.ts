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
  });
});
