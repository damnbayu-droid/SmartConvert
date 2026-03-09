'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface ToolSettingsProps {
  onSettingsChange?: (settings: ConversionSettings) => void;
}

export interface ConversionSettings {
  quality: number;
  effort: number;
  nearLossless: boolean;
}

export function ToolSettings({ onSettingsChange }: ToolSettingsProps) {
  const t = useTranslations();
  const [settings, setSettings] = useState<ConversionSettings>({
    quality: 82,
    effort: 4,
    nearLossless: true,
  });

  const updateSetting = <K extends keyof ConversionSettings>(
    key: K,
    value: ConversionSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Settings
          <Badge variant="secondary" className="font-normal">
            Recommended
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="quality">Quality</Label>
            <span className="text-sm font-medium">{settings.quality}%</span>
          </div>
          <Slider
            id="quality"
            min={50}
            max={100}
            step={1}
            value={[settings.quality]}
            onValueChange={([value]) => updateSetting('quality', value)}
          />
          <p className="text-xs text-muted-foreground">
            Higher quality = larger file size
          </p>
        </div>

        {/* Effort */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="effort">Compression Effort</Label>
            <span className="text-sm font-medium">{settings.effort}</span>
          </div>
          <Slider
            id="effort"
            min={0}
            max={6}
            step={1}
            value={[settings.effort]}
            onValueChange={([value]) => updateSetting('effort', value)}
          />
          <p className="text-xs text-muted-foreground">
            Higher effort = slower but better compression
          </p>
        </div>

        {/* Near Lossless */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="near-lossless">Near Lossless</Label>
            <p className="text-xs text-muted-foreground">
              Preserve more detail at slight size cost
            </p>
          </div>
          <Switch
            id="near-lossless"
            checked={settings.nearLossless}
            onCheckedChange={(checked) => updateSetting('nearLossless', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
