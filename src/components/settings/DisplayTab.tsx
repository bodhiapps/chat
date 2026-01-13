import { useSettingsContext } from '@/hooks/useSettingsContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function DisplayTab() {
  const { settings, updateSetting } = useSettingsContext();

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="disableAutoScroll" className="flex-1">
          Disable Auto-Scroll
        </Label>
        <Switch
          id="disableAutoScroll"
          checked={settings.display.disableAutoScroll}
          onCheckedChange={checked => updateSetting('display', 'disableAutoScroll', checked)}
          data-testid="settings-display-disableAutoScroll"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="alwaysShowSidebarOnDesktop" className="flex-1">
          Always Show Sidebar on Desktop
        </Label>
        <Switch
          id="alwaysShowSidebarOnDesktop"
          checked={settings.display.alwaysShowSidebarOnDesktop}
          onCheckedChange={checked =>
            updateSetting('display', 'alwaysShowSidebarOnDesktop', checked)
          }
          data-testid="settings-display-alwaysShowSidebarOnDesktop"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="autoShowSidebarOnNewChat" className="flex-1">
          Auto Show Sidebar on New Chat
        </Label>
        <Switch
          id="autoShowSidebarOnNewChat"
          checked={settings.display.autoShowSidebarOnNewChat}
          onCheckedChange={checked => updateSetting('display', 'autoShowSidebarOnNewChat', checked)}
          data-testid="settings-display-autoShowSidebarOnNewChat"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="showThoughtInProgress" className="flex-1">
          Show Thought in Progress
        </Label>
        <Switch
          id="showThoughtInProgress"
          checked={settings.display.showThoughtInProgress}
          onCheckedChange={checked => updateSetting('display', 'showThoughtInProgress', checked)}
          data-testid="settings-display-showThoughtInProgress"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="renderUserContentAsMarkdown" className="flex-1">
          Render User Content as Markdown
        </Label>
        <Switch
          id="renderUserContentAsMarkdown"
          checked={settings.display.renderUserContentAsMarkdown}
          onCheckedChange={checked =>
            updateSetting('display', 'renderUserContentAsMarkdown', checked)
          }
          data-testid="settings-display-renderUserContentAsMarkdown"
        />
      </div>
    </div>
  );
}
