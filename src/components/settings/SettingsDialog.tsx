import { useSettingsContext } from '@/hooks/useSettingsContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralTab } from './GeneralTab';
import { SamplingTab } from './SamplingTab';
import { PenaltiesTab } from './PenaltiesTab';
import { DisplayTab } from './DisplayTab';

export function SettingsDialog() {
  const { isSettingsDialogOpen, closeSettingsDialog, resetAllToDefaults } = useSettingsContext();

  return (
    <Dialog open={isSettingsDialogOpen} onOpenChange={open => !open && closeSettingsDialog()}>
      <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="settings-dialog">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure chat behavior and appearance</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden" data-testid="settings-tabs">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" data-testid="tab-general">
              General
            </TabsTrigger>
            <TabsTrigger value="sampling" data-testid="tab-sampling">
              Sampling
            </TabsTrigger>
            <TabsTrigger value="penalties" data-testid="tab-penalties">
              Penalties
            </TabsTrigger>
            <TabsTrigger value="display" data-testid="tab-display">
              Display
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="overflow-y-auto max-h-[50vh]">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="sampling" className="overflow-y-auto max-h-[50vh]">
            <SamplingTab />
          </TabsContent>
          <TabsContent value="penalties" className="overflow-y-auto max-h-[50vh]">
            <PenaltiesTab />
          </TabsContent>
          <TabsContent value="display" className="overflow-y-auto max-h-[50vh]">
            <DisplayTab />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={resetAllToDefaults}
            data-testid="btn-reset-all-settings"
          >
            Reset All to Defaults
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
