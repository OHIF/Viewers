import React from 'react';
import {
  AppearanceModal,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
  useActiveTheme,
  themePresets,
  injectCustomTheme,
  clearCustomTheme,
} from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY_CSS = 'ohif:custom-theme-css';
const STORAGE_KEY_OPEN = 'ohif:custom-theme-open';

function AppearanceModalDefault() {
  const { activeTheme, setActiveTheme } = useActiveTheme();
  const { t } = useTranslation('AppearanceModal');

  const [isCustomOpen, setIsCustomOpen] = React.useState(
    () => localStorage.getItem(STORAGE_KEY_OPEN) === 'true'
  );
  const [customCss, setCustomCss] = React.useState(
    () => localStorage.getItem(STORAGE_KEY_CSS) || ''
  );

  const handleToggleCustom = () => {
    const next = !isCustomOpen;
    setIsCustomOpen(next);
    localStorage.setItem(STORAGE_KEY_OPEN, String(next));
    if (next) {
      setActiveTheme('custom');
    }
  };

  const handleSave = () => {
    injectCustomTheme(customCss);
    setActiveTheme('custom');
  };

  const handleClear = () => {
    clearCustomTheme();
    setCustomCss('');
    setIsCustomOpen(false);
    setActiveTheme('default');
  };

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      injectCustomTheme(customCss);
      setIsCustomOpen(true);
      localStorage.setItem(STORAGE_KEY_OPEN, 'true');
    } else {
      setIsCustomOpen(false);
      localStorage.setItem(STORAGE_KEY_OPEN, 'false');
    }
    setActiveTheme(value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCustomCss(value);
    localStorage.setItem(STORAGE_KEY_CSS, value);
  };

  return (
    <AppearanceModal>
      <AppearanceModal.Body>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-4">
          <AppearanceModal.SectionLabel>{t('Theme')}</AppearanceModal.SectionLabel>
          <div>
            <Select
              value={activeTheme}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{t('Default Theme')}</SelectItem>
                {themePresets.map(preset => (
                  <SelectItem
                    key={preset.name}
                    value={preset.name}
                  >
                    {preset.label}
                  </SelectItem>
                ))}
                {customCss && <SelectItem value="custom">{t('Custom')}</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="col-start-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleCustom}
            >
              {isCustomOpen ? t('Hide') : t('Custom Theme')}
            </Button>
          </div>
        </div>

        {isCustomOpen && (
          <div className="mt-4 flex flex-col space-y-2">
            <textarea
              value={customCss}
              onChange={handleTextChange}
              placeholder={t('Paste your custom theme color tokens here')}
              rows={8}
              className="bg-muted text-foreground border-input placeholder:text-muted-foreground rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring"
            />
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
              >
                {t('Apply')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
              >
                {t('Clear')}
              </Button>
            </div>
          </div>
        )}
      </AppearanceModal.Body>
    </AppearanceModal>
  );
}

export default {
  'ohif.appearanceModal': AppearanceModalDefault,
};
