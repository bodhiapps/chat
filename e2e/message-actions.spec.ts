import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage.js';
import { SetupModalHelper } from './pages/SetupModalHelper.js';
import { BACKEND_URL, TEST_USER, TEST_PASSWORD } from './test-utils.js';

test.describe.configure({ mode: 'serial' });

test.describe.serial('Message Actions - Copy, Edit, Delete', () => {
  test('complete flow: copy, edit, and delete message actions', async ({ page, context }) => {
    const chatPage = new ChatPage(page);
    const setupModal = new SetupModalHelper(page);

    // Setup: navigate, configure, and login
    await page.goto('/');
    await chatPage.waitForPageLoad();
    await setupModal.completeDirectModeSetup(BACKEND_URL);
    await chatPage.loginAs(TEST_USER, TEST_PASSWORD);

    // Send initial message
    const initialMessage = 'Answer in exactly 3 words: What is the capital of France?';
    await chatPage.sendMessage(initialMessage);
    await chatPage.waitForResponse();

    const messageCountAfterFirst = await chatPage.getMessageCount();
    expect(messageCountAfterFirst).toBe(2);

    await test.step('Copy message action', async () => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      // Copy the assistant message (index 1)
      await chatPage.clickCopyMessage(1);

      // Verify checkmark feedback appears
      const hasCopySuccess = await chatPage.verifyCopySuccess(1);
      expect(hasCopySuccess).toBe(true);

      // Verify clipboard contains the message content
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText.toLowerCase()).toContain('paris');
    });

    await test.step('Edit user message - save changes', async () => {
      // Start editing the user message (index 0)
      await chatPage.startEditMessage(0);

      // Verify edit mode is active
      const isEditing = await chatPage.isInEditMode();
      expect(isEditing).toBe(true);

      // Verify textarea contains original content
      const editContent = await chatPage.getEditTextareaContent();
      expect(editContent).toContain('capital of France');

      // Modify content
      const newMessage = 'Answer in exactly 2 words: What is 2 + 2?';
      await chatPage.fillEditTextarea(newMessage);

      // Save the edit
      await chatPage.saveEdit();

      // Verify edit mode is closed
      const isStillEditing = await chatPage.isInEditMode();
      expect(isStillEditing).toBe(false);

      // Verify the user message was updated (using auto-retry matcher)
      await chatPage.expectUserMessageContains(0, '2 + 2');

      // Verify assistant response is preserved (not regenerated)
      const messageCount = await chatPage.getMessageCount();
      expect(messageCount).toBe(2);
    });

    await test.step('Edit user message - cancel discards changes', async () => {
      // Start editing
      await chatPage.startEditMessage(0);

      // Modify content
      await chatPage.fillEditTextarea('This should be discarded');

      // Cancel the edit
      await chatPage.cancelEdit();

      // Verify original content is preserved (still contains "2 + 2" from previous edit)
      await chatPage.expectUserMessageContains(0, '2 + 2');
    });

    await test.step('Edit user message - blur discards changes', async () => {
      // Start editing
      await chatPage.startEditMessage(0);

      // Modify content
      await chatPage.fillEditTextarea('This should also be discarded');

      // Click outside (blur) - click on the chat area background
      await page.locator('[data-testid="chat-area"]').click({ position: { x: 10, y: 10 } });

      // Verify edit mode is closed (using Playwright's auto-retry)
      await expect(page.locator(chatPage.selectors.editTextarea)).toBeHidden();

      // Verify original content is preserved (still contains "2 + 2")
      await chatPage.expectUserMessageContains(0, '2 + 2');
    });

    await test.step('Delete message with cascade confirmation', async () => {
      // Send a second message to test cascade delete
      const secondMessage = 'Answer in 1 word: What color is the sky?';
      await chatPage.sendMessage(secondMessage);
      await chatPage.waitForResponse();

      const countBeforeDelete = await chatPage.getMessageCount();
      expect(countBeforeDelete).toBe(4); // 2 user + 2 assistant messages

      // Delete the first user message (index 0) - should cascade to all following
      await chatPage.clickDeleteMessage(0);

      // Verify delete dialog is visible
      const isDialogVisible = await chatPage.isDeleteDialogVisible();
      expect(isDialogVisible).toBe(true);

      // Verify cascade count is shown (4 messages will be deleted)
      const cascadeCount = await chatPage.getDeleteCascadeCount();
      expect(cascadeCount).toBeGreaterThanOrEqual(2);

      // Confirm the delete
      await chatPage.confirmDelete();

      // Verify all messages are deleted
      const countAfterDelete = await chatPage.getMessageCount();
      expect(countAfterDelete).toBe(0);
    });

    await test.step('Delete message - cancel preserves messages', async () => {
      // Send a new message
      const newMessage = 'Answer in 1 word: What is the color of grass?';
      await chatPage.sendMessage(newMessage);
      await chatPage.waitForResponse();

      const countBefore = await chatPage.getMessageCount();
      expect(countBefore).toBe(2);

      // Try to delete but cancel
      await chatPage.clickDeleteMessage(0);

      // Verify dialog is open
      const isDialogVisible = await chatPage.isDeleteDialogVisible();
      expect(isDialogVisible).toBe(true);

      // Cancel the delete
      await chatPage.cancelDelete();

      // Verify messages are preserved
      const countAfter = await chatPage.getMessageCount();
      expect(countAfter).toBe(countBefore);
    });
  });
});
