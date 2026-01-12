import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/ChatPage';
import { SetupModalHelper } from './pages/SetupModalHelper';
import { TEST_USER, TEST_PASSWORD, BACKEND_URL } from './test-utils';

test.describe.configure({ mode: 'serial' });

test.describe('Settings Dialog', () => {
  test('complete settings flow: open/close → temperature → reset → theme → validation', async ({
    page,
  }) => {
    const chatPage = new ChatPage(page);
    const setupModal = new SetupModalHelper(page);

    await page.goto('/');
    await chatPage.waitForPageLoad();

    await setupModal.completeDirectModeSetup(BACKEND_URL);
    await chatPage.loginAs(TEST_USER, TEST_PASSWORD);

    await test.step('Opens and closes settings dialog', async () => {
      await chatPage.openSettings();
      await chatPage.settingsSection.expectOpen();
      await chatPage.settingsSection.close();
      await chatPage.settingsSection.expectClosed();
    });

    await test.step('Persists temperature setting', async () => {
      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('sampling');
      await chatPage.settingsSection.sampling.setTemperature(1.2);
      await chatPage.settingsSection.sampling.expectTemperature(1.2);
      await chatPage.settingsSection.close();

      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('sampling');
      await chatPage.settingsSection.sampling.expectTemperature(1.2);
      await chatPage.settingsSection.close();
    });

    await test.step('Resets all settings to defaults', async () => {
      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('sampling');
      await chatPage.settingsSection.sampling.setTemperature(1.5);
      await chatPage.settingsSection.resetAllSettings();
      await chatPage.settingsSection.sampling.expectTemperature(0.8);
      await chatPage.settingsSection.close();
    });

    await test.step('Toggles theme to dark mode', async () => {
      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('general');
      await chatPage.settingsSection.general.selectTheme('dark');
      await chatPage.settingsSection.close();

      const isDark = await chatPage.isDarkMode();
      expect(isDark).toBe(true);

      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('general');
      await chatPage.settingsSection.general.selectTheme('light');
      await chatPage.settingsSection.close();

      const isLight = !(await chatPage.isDarkMode());
      expect(isLight).toBe(true);
    });

    await test.step('Validates top_k bounds', async () => {
      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('sampling');

      const initial = await chatPage.settingsSection.sampling.getTopK();
      await chatPage.settingsSection.sampling.setTopK(200);
      await chatPage.settingsSection.sampling.expectTopK(initial);

      await chatPage.settingsSection.close();
    });

    await test.step('Max tokens setting limits response length', async () => {
      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('sampling');
      await chatPage.settingsSection.sampling.setMaxTokens(10);
      await chatPage.settingsSection.close();

      await chatPage.clickNewConversation();
      await chatPage.sendMessage('write an essay on festivals of india');
      const shortResponse = await chatPage.waitForResponse();
      const shortWordCount = chatPage.countWords(shortResponse);

      console.log(`Short response (max_tokens=10): ${shortWordCount} words`);
      expect(shortWordCount).toBeLessThan(10);

      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('sampling');
      await chatPage.settingsSection.resetAllSettings();
      await chatPage.settingsSection.close();

      await chatPage.clickNewConversation();
      await chatPage.sendMessage('write an essay on festivals of india in max 100 words');
      const longResponse = await chatPage.waitForResponse(180000);
      const longWordCount = chatPage.countWords(longResponse);

      console.log(`Long response (default max_tokens): ${longWordCount} words`);
      expect(longWordCount).toBeGreaterThan(30);
    });

    await test.step('System prompt applies to chat', async () => {
      await chatPage.clickNewConversation();
      await chatPage.sendMessage('What day comes after Monday?');
      const responseWithoutSystemPrompt = await chatPage.waitForResponse();

      const hasTuesday = chatPage.containsAnyWord(responseWithoutSystemPrompt, ['tuesday']);
      const hasLondon = chatPage.containsAnyWord(responseWithoutSystemPrompt, ['london']);
      expect(hasTuesday).toBe(true);
      expect(hasLondon).toBe(false);

      await chatPage.openSettings();
      await chatPage.settingsSection.selectTab('general');
      await chatPage.settingsSection.general.setSystemMessage(
        'always start your reply with Hello London,'
      );
      await chatPage.settingsSection.close();

      await chatPage.clickNewConversation();
      await chatPage.sendMessage('What day comes after Monday?');
      const responseWithSystemPrompt = await chatPage.waitForResponse();

      const hasTuesdayAfter = chatPage.containsAnyWord(responseWithSystemPrompt, ['tuesday']);
      const hasLondonAfter = chatPage.containsAnyWord(responseWithSystemPrompt, ['london']);
      expect(hasTuesdayAfter).toBe(true);
      expect(hasLondonAfter).toBe(true);
    });
  });
});
