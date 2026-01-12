import { useSettingsContext } from '@/hooks/useSettingsContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { VALIDATION_RANGES } from '@/lib/settings-defaults';

export function PenaltiesTab() {
  const { settings, updateSetting } = useSettingsContext();

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="repeat_last_n">Repeat Last N</Label>
        <Input
          id="repeat_last_n"
          type="number"
          min={VALIDATION_RANGES.repeat_last_n.min}
          max={VALIDATION_RANGES.repeat_last_n.max}
          step={VALIDATION_RANGES.repeat_last_n.step}
          value={settings.generation.repeat_last_n}
          onChange={e =>
            updateSetting('generation', 'repeat_last_n', parseInt(e.target.value) || 0)
          }
          data-testid="settings-penalties-repeat_last_n"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="repeat_penalty">Repeat Penalty</Label>
          <span className="text-sm text-muted-foreground">
            {settings.generation.repeat_penalty.toFixed(2)}
          </span>
        </div>
        <Slider
          id="repeat_penalty"
          min={VALIDATION_RANGES.repeat_penalty.min}
          max={VALIDATION_RANGES.repeat_penalty.max}
          step={VALIDATION_RANGES.repeat_penalty.step}
          value={[settings.generation.repeat_penalty]}
          onValueChange={([value]) => updateSetting('generation', 'repeat_penalty', value)}
          data-testid="settings-penalties-repeat_penalty"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="presence_penalty">Presence Penalty</Label>
          <span className="text-sm text-muted-foreground">
            {settings.generation.presence_penalty.toFixed(2)}
          </span>
        </div>
        <Slider
          id="presence_penalty"
          min={VALIDATION_RANGES.presence_penalty.min}
          max={VALIDATION_RANGES.presence_penalty.max}
          step={VALIDATION_RANGES.presence_penalty.step}
          value={[settings.generation.presence_penalty]}
          onValueChange={([value]) => updateSetting('generation', 'presence_penalty', value)}
          data-testid="settings-penalties-presence_penalty"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="frequency_penalty">Frequency Penalty</Label>
          <span className="text-sm text-muted-foreground">
            {settings.generation.frequency_penalty.toFixed(2)}
          </span>
        </div>
        <Slider
          id="frequency_penalty"
          min={VALIDATION_RANGES.frequency_penalty.min}
          max={VALIDATION_RANGES.frequency_penalty.max}
          step={VALIDATION_RANGES.frequency_penalty.step}
          value={[settings.generation.frequency_penalty]}
          onValueChange={([value]) => updateSetting('generation', 'frequency_penalty', value)}
          data-testid="settings-penalties-frequency_penalty"
        />
      </div>
    </div>
  );
}
