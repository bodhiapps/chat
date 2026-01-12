import { useSettingsContext } from '@/hooks/useSettingsContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { VALIDATION_RANGES } from '@/lib/settings-defaults';

export function SamplingTab() {
  const { settings, updateSetting, validationErrors } = useSettingsContext();

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="temperature">Temperature</Label>
          <span className="text-sm text-muted-foreground">
            {settings.generation.temperature.toFixed(2)}
          </span>
        </div>
        <Slider
          id="temperature"
          min={VALIDATION_RANGES.temperature.min}
          max={VALIDATION_RANGES.temperature.max}
          step={VALIDATION_RANGES.temperature.step}
          value={[settings.generation.temperature]}
          onValueChange={([value]) => updateSetting('generation', 'temperature', value)}
          data-testid="settings-sampling-temperature"
        />
        {validationErrors.temperature && (
          <p className="text-sm text-destructive">{validationErrors.temperature}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="top_p">Top P</Label>
          <span className="text-sm text-muted-foreground">
            {settings.generation.top_p.toFixed(2)}
          </span>
        </div>
        <Slider
          id="top_p"
          min={VALIDATION_RANGES.top_p.min}
          max={VALIDATION_RANGES.top_p.max}
          step={VALIDATION_RANGES.top_p.step}
          value={[settings.generation.top_p]}
          onValueChange={([value]) => updateSetting('generation', 'top_p', value)}
          data-testid="settings-sampling-top_p"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="top_k">Top K</Label>
        <Input
          id="top_k"
          type="number"
          min={VALIDATION_RANGES.top_k.min}
          max={VALIDATION_RANGES.top_k.max}
          step={VALIDATION_RANGES.top_k.step}
          value={settings.generation.top_k}
          onChange={e => updateSetting('generation', 'top_k', parseInt(e.target.value) || 0)}
          data-testid="settings-sampling-top_k"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="min_p">Min P</Label>
          <span className="text-sm text-muted-foreground">
            {settings.generation.min_p.toFixed(2)}
          </span>
        </div>
        <Slider
          id="min_p"
          min={VALIDATION_RANGES.min_p.min}
          max={VALIDATION_RANGES.min_p.max}
          step={VALIDATION_RANGES.min_p.step}
          value={[settings.generation.min_p]}
          onValueChange={([value]) => updateSetting('generation', 'min_p', value)}
          data-testid="settings-sampling-min_p"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="typ_p">Typ P</Label>
          <span className="text-sm text-muted-foreground">
            {settings.generation.typ_p.toFixed(2)}
          </span>
        </div>
        <Slider
          id="typ_p"
          min={VALIDATION_RANGES.typ_p.min}
          max={VALIDATION_RANGES.typ_p.max}
          step={VALIDATION_RANGES.typ_p.step}
          value={[settings.generation.typ_p]}
          onValueChange={([value]) => updateSetting('generation', 'typ_p', value)}
          data-testid="settings-sampling-typ_p"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_tokens">Max Tokens (-1 = unlimited)</Label>
        <Input
          id="max_tokens"
          type="number"
          min={VALIDATION_RANGES.max_tokens.min}
          max={VALIDATION_RANGES.max_tokens.max}
          step={VALIDATION_RANGES.max_tokens.step}
          value={settings.generation.max_tokens}
          onChange={e => updateSetting('generation', 'max_tokens', parseInt(e.target.value) || -1)}
          data-testid="settings-sampling-max_tokens"
        />
      </div>
    </div>
  );
}
