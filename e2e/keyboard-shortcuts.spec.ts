import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage.js';
import { SetupModalHelper } from './pages/SetupModalHelper.js';
import { BACKEND_URL, TEST_USER, TEST_PASSWORD } from './test-utils.js';

test.describe.configure({ mode: 'serial' });

test.describe('Keyboard Shortcuts', () => {
  test('complete flow: global keyboard shortcuts for navigation', async ({ page }) => {
    const chatPage = new ChatPage(page);
    const setupModal = new SetupModalHelper(page);

    // Setup: navigate, configure, and login
    await page.goto('/');
    await chatPage.waitForPageLoad();
    await setupModal.completeDirectModeSetup(BACKEND_URL);
    await chatPage.loginAs(TEST_USER, TEST_PASSWORD);

    await test.step('Ctrl+K opens search modal', async () => {
      // Verify search modal is initially closed
      const isInitiallyOpen = await chatPage.isSearchModalVisible();
      expect(isInitiallyOpen).toBe(false);

      // Press Ctrl/Cmd+K
      await chatPage.pressSearchShortcut();

      // Verify search modal opens
      const isOpen = await chatPage.isSearchModalVisible();
      expect(isOpen).toBe(true);

      // Verify search input is focused
      const searchInput = page.locator(chatPage.selectors.searchInput);
      await expect(searchInput).toBeFocused();
    });

    await test.step('Escape closes search modal', async () => {
      // Search modal should be open from previous step
      const isOpenBefore = await chatPage.isSearchModalVisible();
      expect(isOpenBefore).toBe(true);

      // Press Escape and wait for modal to close
      await page.keyboard.press('Escape');
      await page.locator(chatPage.selectors.searchModal).waitFor({ state: 'hidden' });

      // Verify modal closes
      const isOpenAfter = await chatPage.isSearchModalVisible();
      expect(isOpenAfter).toBe(false);
    });

    await test.step('Ctrl+Shift+O creates new conversation', async () => {
      // First, send a message to create a conversation
      const testMessage = 'Answer in 1 word: What is 1+1?';
      await chatPage.sendMessage(testMessage);
      await chatPage.waitForResponse();

      const messageCountBefore = await chatPage.getMessageCount();
      expect(messageCountBefore).toBe(2);

      const conversationCountBefore = await chatPage.getConversationCount();
      expect(conversationCountBefore).toBeGreaterThan(0);

      // Press Ctrl/Cmd+Shift+O
      await chatPage.pressNewChatShortcut();

      // Wait for new conversation to be created
      await page.locator('[data-testid="chat-area"][data-test-message-count="0"]').waitFor();

      // Verify message count is 0 (new conversation)
      const messageCountAfter = await chatPage.getMessageCount();
      expect(messageCountAfter).toBe(0);
    });

    await test.step('Shortcuts work when chat input is focused', async () => {
      // Focus the chat input
      const chatInput = page.locator(chatPage.selectors.chatInput);
      await chatInput.focus();
      await expect(chatInput).toBeFocused();

      // Press Ctrl/Cmd+K while input is focused
      await chatPage.pressSearchShortcut();

      // Verify search modal opens even when input was focused
      const isSearchOpen = await chatPage.isSearchModalVisible();
      expect(isSearchOpen).toBe(true);

      // Close the modal and wait for it to close
      await page.keyboard.press('Escape');
      await page.locator(chatPage.selectors.searchModal).waitFor({ state: 'hidden' });
      const isSearchClosed = await chatPage.isSearchModalVisible();
      expect(isSearchClosed).toBe(false);

      // Send a message to have content
      await chatPage.sendMessage('Quick test message');
      await chatPage.waitForResponse();

      const countBefore = await chatPage.getMessageCount();

      // Focus input again and press Ctrl+Shift+O
      await chatInput.focus();
      await chatPage.pressNewChatShortcut();

      // Wait for new conversation
      await page.locator('[data-testid="chat-area"][data-test-message-count="0"]').waitFor();

      // Verify new conversation was created
      const countAfter = await chatPage.getMessageCount();
      expect(countAfter).toBe(0);
      expect(countBefore).toBeGreaterThan(0);
    });

    await test.step('Ctrl+K shortcut hint is shown in search placeholder', async () => {
      // Open search modal
      await chatPage.pressSearchShortcut();

      // Check the placeholder contains the shortcut hint
      const searchInput = page.locator(chatPage.selectors.searchInput);
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(placeholder).toMatch(/\+K/i); // Should contain +K (Ctrl+K or ⌘+K)

      // Close modal and wait for it to close
      await page.keyboard.press('Escape');
      await page.locator(chatPage.selectors.searchModal).waitFor({ state: 'hidden' });
    });

    await test.step('? opens keyboard shortcuts guide', async () => {
      // Verify shortcuts guide is initially closed
      const shortcutGuide = page.locator('[data-testid="shortcut-guide-modal"]');
      await expect(shortcutGuide).toBeHidden();

      // Press ? to open shortcuts guide
      await page.keyboard.press('?');

      // Verify shortcuts guide opens
      await expect(shortcutGuide).toBeVisible();

      // Verify guide contains multiple shortcuts
      const shortcutItems = page.locator('[data-testid="shortcut-item"]');
      const count = await shortcutItems.count();
      expect(count).toBeGreaterThan(5); // Should have at least 5+ shortcuts listed

      // Verify guide shows platform modifier key
      const guideText = await shortcutGuide.textContent();
      expect(guideText).toMatch(/⌘|Ctrl/); // Should contain either ⌘ or Ctrl
    });

    await test.step('Escape closes keyboard shortcuts guide', async () => {
      // Shortcuts guide should be open from previous step
      const shortcutGuide = page.locator('[data-testid="shortcut-guide-modal"]');
      await expect(shortcutGuide).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Verify guide closes
      await expect(shortcutGuide).toBeHidden();
    });

    await test.step('? does not open guide when typing in input', async () => {
      // Focus the chat input
      const chatInput = page.locator(chatPage.selectors.chatInput);
      await chatInput.focus();

      // Type ? in the input
      await chatInput.type('?');

      // Verify shortcuts guide does NOT open
      const shortcutGuide = page.locator('[data-testid="shortcut-guide-modal"]');
      await expect(shortcutGuide).toBeHidden();

      // Verify ? was typed into the input
      const inputValue = await chatInput.inputValue();
      expect(inputValue).toContain('?');

      // Clear the input for cleanup
      await chatInput.clear();
    });
  });
});
