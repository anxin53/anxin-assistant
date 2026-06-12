import { useMemo, useState } from 'react';
import { RotateCcw, ShieldAlert, SlidersHorizontal, Upload } from 'lucide-react';
import type { DeviceSettings } from '@/hooks/useDeviceSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function ColorPanel({ device }: { device: DeviceSettings }) {
  const { displays, settings, busy, runAction, setStatus } = device;
  const [selectedDisplayId, setSelectedDisplayId] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [previewOnlyColor, setPreviewOnlyColor] = useState(true);

  const selectedDisplay = useMemo(
    () => displays.find((display) => display.id === selectedDisplayId) || displays[0],
    [displays, selectedDisplayId]
  );
  const selectedProfile = useMemo(
    () =>
      settings?.importedProfiles.find((profile) => profile.id === selectedProfileId) ||
      settings?.importedProfiles[0],
    [settings?.importedProfiles, selectedProfileId]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          ICC 系统色彩
        </CardTitle>
        <CardDescription>导入配置，选择是否应用到系统。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>选择显示器</Label>
          <Select value={selectedDisplay?.id || ''} onValueChange={setSelectedDisplayId}>
            <SelectTrigger>
              <SelectValue placeholder="未读取到显示器" />
            </SelectTrigger>
            <SelectContent>
              {displays.map((display) => (
                <SelectItem key={display.id} value={display.id}>
                  {display.monitorName} {display.primary ? '(主)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDisplay && (
          <div className="space-y-1.5 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div>设备：{selectedDisplay.deviceName}</div>
            <div className="break-all">默认配置：{selectedDisplay.currentProfile || '系统默认或未读取到'}</div>
          </div>
        )}

        <div>
          <Button
            onClick={() =>
              runAction(async () => {
                const sourcePath = await window.lightQuality.color.pickProfile();
                if (!sourcePath) {
                  return { message: '已取消导入。' };
                }
                const imported = await window.lightQuality.color.importProfile({ sourcePath });
                setSelectedProfileId(imported.id);
                return { message: `已导入：${imported.fileName}` };
              }, 'ICC 已导入。')
            }
            disabled={busy}
          >
            <Upload />
            导入 ICC/ICM
          </Button>
        </div>

        <div className="space-y-2">
          <Label>已导入配置</Label>
          <Select
            value={selectedProfile?.id || ''}
            onValueChange={setSelectedProfileId}
            disabled={!settings?.importedProfiles.length}
          >
            <SelectTrigger>
              <SelectValue placeholder="尚未导入" />
            </SelectTrigger>
            <SelectContent>
              {settings?.importedProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="preview-only">仅预览，不应用系统 ICC</Label>
            <p className="text-xs text-muted-foreground">系统级操作会触发管理员权限。</p>
          </div>
          <Switch id="preview-only" checked={previewOnlyColor} onCheckedChange={setPreviewOnlyColor} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() =>
              selectedDisplay &&
              selectedProfile &&
              (previewOnlyColor
                ? setStatus('当前为仅预览模式，未修改系统 ICC。关闭开关后可应用到系统。')
                : runAction(
                    () => window.lightQuality.color.applyProfile({ display: selectedDisplay, profile: selectedProfile }),
                    'ICC 已应用。'
                  ))
            }
            disabled={busy || !selectedDisplay || !selectedProfile}
          >
            <ShieldAlert />
            应用到系统
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              selectedDisplay &&
              runAction(() => window.lightQuality.color.restoreProfile({ displayId: selectedDisplay.id }), 'ICC 已恢复。')
            }
            disabled={busy || !selectedDisplay || !settings?.colorBackups[selectedDisplay.id]}
          >
            <RotateCcw />
            恢复 ICC
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
