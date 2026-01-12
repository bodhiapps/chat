import { useSettingsContext } from '@/hooks/useSettingsContext';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function GeneralTab() {
  const { settings, updateSetting } = useSettingsContext();

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Select
          value={settings.general.theme}
          onValueChange={value => updateSetting('general', 'theme', value)}
        >
          <SelectTrigger id="theme" data-testid="settings-general-theme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="systemMessage">System Message</Label>
        <Textarea
          id="systemMessage"
          placeholder="Enter custom system message for all conversations..."
          value={settings.general.systemMessage}
          onChange={e => updateSetting('general', 'systemMessage', e.target.value)}
          rows={4}
          data-testid="settings-general-systemMessage"
        />
      </div>
    </div>
  );
}
