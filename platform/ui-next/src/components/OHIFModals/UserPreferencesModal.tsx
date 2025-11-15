import * as React from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Label } from '../Label';
import { Input } from '../Input';
import { cn } from '../../lib/utils';

const HOTKEY_TOKEN_TRANSLATIONS: Record<
  string,
  {
    i18nKey: string;
    defaultValue: string;
  }
> = {
  ctrl: { i18nKey: 'HotkeyKeys.ctrl', defaultValue: 'Ctrl' },
  control: { i18nKey: 'HotkeyKeys.ctrl', defaultValue: 'Ctrl' },
  shift: { i18nKey: 'HotkeyKeys.shift', defaultValue: 'Shift' },
  alt: { i18nKey: 'HotkeyKeys.alt', defaultValue: 'Alt' },
  option: { i18nKey: 'HotkeyKeys.option', defaultValue: 'Option' },
  meta: { i18nKey: 'HotkeyKeys.meta', defaultValue: 'Cmd' },
  command: { i18nKey: 'HotkeyKeys.meta', defaultValue: 'Cmd' },
  cmd: { i18nKey: 'HotkeyKeys.meta', defaultValue: 'Cmd' },
  enter: { i18nKey: 'HotkeyKeys.enter', defaultValue: 'Enter' },
  return: { i18nKey: 'HotkeyKeys.enter', defaultValue: 'Enter' },
  esc: { i18nKey: 'HotkeyKeys.esc', defaultValue: 'Esc' },
  escape: { i18nKey: 'HotkeyKeys.esc', defaultValue: 'Esc' },
  space: { i18nKey: 'HotkeyKeys.space', defaultValue: 'Space' },
  spacebar: { i18nKey: 'HotkeyKeys.space', defaultValue: 'Space' },
  tab: { i18nKey: 'HotkeyKeys.tab', defaultValue: 'Tab' },
  backspace: { i18nKey: 'HotkeyKeys.backspace', defaultValue: 'Backspace' },
  delete: { i18nKey: 'HotkeyKeys.delete', defaultValue: 'Delete' },
  del: { i18nKey: 'HotkeyKeys.delete', defaultValue: 'Delete' },
  insert: { i18nKey: 'HotkeyKeys.insert', defaultValue: 'Insert' },
  ins: { i18nKey: 'HotkeyKeys.insert', defaultValue: 'Insert' },
  home: { i18nKey: 'HotkeyKeys.home', defaultValue: 'Home' },
  end: { i18nKey: 'HotkeyKeys.end', defaultValue: 'End' },
  pageup: { i18nKey: 'HotkeyKeys.pageup', defaultValue: 'Page Up' },
  pagedown: { i18nKey: 'HotkeyKeys.pagedown', defaultValue: 'Page Down' },
  up: { i18nKey: 'HotkeyKeys.up', defaultValue: 'Up Arrow' },
  down: { i18nKey: 'HotkeyKeys.down', defaultValue: 'Down Arrow' },
  left: { i18nKey: 'HotkeyKeys.left', defaultValue: 'Left Arrow' },
  right: { i18nKey: 'HotkeyKeys.right', defaultValue: 'Right Arrow' },
  capslock: { i18nKey: 'HotkeyKeys.capslock', defaultValue: 'Caps Lock' },
  plus: { i18nKey: 'HotkeyKeys.plus', defaultValue: 'Plus' },
  minus: { i18nKey: 'HotkeyKeys.minus', defaultValue: 'Minus' },
  comma: { i18nKey: 'HotkeyKeys.comma', defaultValue: 'Comma' },
  period: { i18nKey: 'HotkeyKeys.period', defaultValue: 'Period' },
  slash: { i18nKey: 'HotkeyKeys.slash', defaultValue: 'Slash' },
  backslash: { i18nKey: 'HotkeyKeys.backslash', defaultValue: 'Backslash' },
  semicolon: { i18nKey: 'HotkeyKeys.semicolon', defaultValue: 'Semicolon' },
  quote: { i18nKey: 'HotkeyKeys.quote', defaultValue: 'Quote' },
  apostrophe: { i18nKey: 'HotkeyKeys.quote', defaultValue: 'Quote' },
  backquote: { i18nKey: 'HotkeyKeys.backquote', defaultValue: 'Backtick' },
  tilde: { i18nKey: 'HotkeyKeys.backquote', defaultValue: 'Backtick' },
  bracketleft: { i18nKey: 'HotkeyKeys.bracketleft', defaultValue: 'Left Bracket' },
  bracketright: { i18nKey: 'HotkeyKeys.bracketright', defaultValue: 'Right Bracket' },
};

const formatFallbackToken = (token: string) => {
  if (!token) {
    return '';
  }

  if (/^f\d{1,2}$/i.test(token)) {
    return token.toUpperCase();
  }

  if (token.length === 1) {
    return token.toUpperCase();
  }

  return token.charAt(0).toUpperCase() + token.slice(1);
};

const normalizeHotkeyValue = (value?: string | string[]) => {
  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join('+');
  }

  return value;
};

const translateHotkeyValue = (value: string | string[] | undefined, t: TFunction) => {
  const normalizedValue = normalizeHotkeyValue(value);
  if (!normalizedValue) {
    return '';
  }

  return normalizedValue
    .split('+')
    .map(rawToken => {
      const trimmed = rawToken.trim();
      if (!trimmed) {
        return '';
      }

      const lower = trimmed.toLowerCase();
      const config = HOTKEY_TOKEN_TRANSLATIONS[lower];
      if (config) {
        return t(config.i18nKey, { defaultValue: config.defaultValue });
      }

      return formatFallbackToken(trimmed);
    })
    .join('+');
};

interface UserPreferencesModalProps {
  children: React.ReactNode;
  className?: string;
}

export function UserPreferencesModal({ children, className }: UserPreferencesModalProps) {
  return (
    <div className={cn('flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden', className)}>
      {children}
    </div>
  );
}

/** Body
 *  Automatically wraps content in a scrollable area.
 */
interface BodyProps {
  children: React.ReactNode;
  className?: string;
}
function Body({ children, className }: BodyProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      <div className={cn('mt-1 mb-4 flex flex-col space-y-4', className)}>{children}</div>
    </div>
  );
}

/** Subheading
 *  Section labels
 */
interface SubHeadingProps {
  children: React.ReactNode;
  className?: string;
}
function SubHeading({ children, className }: SubHeadingProps) {
  return <span className={cn('text-muted-foreground text-lg', className)}>{children}</span>;
}

/** Responsive 3-column grid for hotkeys, etc. */
interface HotkeysGridProps {
  children: React.ReactNode;
  className?: string;
}
function HotkeysGrid({ children, className }: HotkeysGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 gap-x-16 md:grid-cols-2 lg:grid-cols-3', className)}>
      {children}
    </div>
  );
}

/** A single hotkey row: label + input */
interface HotkeyProps {
  label: string;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  hotkeys?: {
    record: (callback: (sequence: string[]) => void) => void;
    pause: () => void;
    unpause: () => void;
    startRecording: () => void;
  };
}

function Hotkey({ label, placeholder, className, value, onChange, hotkeys }: HotkeyProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const { t } = useTranslation('UserPreferencesModal');
  const translatedValue = React.useMemo(() => translateHotkeyValue(value, t), [value, t]);
  const translatedPlaceholder = React.useMemo(
    () => translateHotkeyValue(placeholder, t),
    [placeholder, t]
  );

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    event.preventDefault();
    hotkeys?.record((sequence: string[]) => {
      const keys = sequence.join('+');
      hotkeys?.unpause();
      setIsRecording(false);
      onChange?.(keys);
    });
  };

  const onFocus = () => {
    setIsRecording(true);
    hotkeys?.pause();
    hotkeys?.startRecording();
  };

  const onBlur = () => {
    setIsRecording(false);
    hotkeys?.unpause();
  };

  return (
    <div className={cn('flex items-start justify-between gap-2', className)}>
      <Label className="flex-1 whitespace-normal break-words text-sm">{label}</Label>
      <Input
        className={cn(
          'w-16 text-center transition-colors',
          isRecording && 'bg-accent text-accent-foreground caret-accent-foreground'
        )}
        placeholder={isRecording ? t('Press keys') : translatedPlaceholder || ''}
        value={isRecording ? normalizeHotkeyValue(value) : translatedValue}
        onKeyDown={onInputKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        readOnly={!isRecording}
      />
    </div>
  );
}

/** Attach subcomponents as static properties for a nicer API */
UserPreferencesModal.Body = Body;
UserPreferencesModal.HotkeysGrid = HotkeysGrid;
UserPreferencesModal.Hotkey = Hotkey;
UserPreferencesModal.SubHeading = SubHeading;
