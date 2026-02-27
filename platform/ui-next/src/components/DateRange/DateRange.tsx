import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Calendar } from '../Calendar';
import * as Popover from '../Popover';

export type DatePickerWithRangeProps = {
  id: string;
  /** YYYYMMDD (19921022) */
  startDate: string;
  /** YYYYMMDD (19921022) */
  endDate: string;
  /** Callback that received { startDate: string(YYYYMMDD), endDate: string(YYYYMMDD)} */
  onChange: (value: { startDate: string; endDate: string }) => void;
  /** 'light' = fond blanc pour les inputs (design clair) */
  variant?: 'dark' | 'light';
};

/** Format français : jour/mois/année (JJ/MM/AAAA) */
const DISPLAY_FORMAT = 'dd/MM/yyyy';
const STORAGE_FORMAT = 'yyyyMMdd';

const inputBaseClasses =
  'border-inputfield-main focus:border-inputfield-focus h-[32px] w-full justify-start rounded border py-[6.5px] pl-[6.5px] pr-[6.5px] text-left text-base font-normal';
const inputDarkClasses =
  'bg-black hover:bg-black hover:text-white text-white';
const inputLightClasses =
  'bg-white border-[#e5e7eb] text-[#374151] placeholder:text-[#9ca3af] hover:bg-white focus:border-[#3b82f6]';

export function DatePickerWithRange({
  className,
  id,
  startDate,
  endDate,
  onChange,
  variant = 'dark',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & DatePickerWithRangeProps) {
  const isLight = variant === 'light';
  const inputClasses = cn(
    inputBaseClasses,
    isLight ? inputLightClasses : inputDarkClasses
  );
  const iconClasses = isLight ? 'text-[#9ca3af]' : 'text-white';
  const { t } = useTranslation('DatePicker');
  const [start, setStart] = React.useState<string>(
    startDate ? format(parse(startDate, STORAGE_FORMAT, new Date()), DISPLAY_FORMAT) : ''
  );
  const [end, setEnd] = React.useState<string>(
    endDate ? format(parse(endDate, STORAGE_FORMAT, new Date()), DISPLAY_FORMAT) : ''
  );
  const [openEnd, setOpenEnd] = React.useState(false);

  const handleStartSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, DISPLAY_FORMAT);
      setStart(formattedDate);
      setOpenEnd(true);
      const endParsed = end ? parse(end, DISPLAY_FORMAT, new Date()) : null;
      onChange({
        startDate: format(selectedDate, STORAGE_FORMAT),
        endDate: endParsed && isValid(endParsed) ? format(endParsed, STORAGE_FORMAT) : '',
      });
    }
  };

  const handleEndSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, DISPLAY_FORMAT);
      setEnd(formattedDate);
      setOpenEnd(false);
      const startParsed = start ? parse(start, DISPLAY_FORMAT, new Date()) : null;
      onChange({
        startDate: startParsed && isValid(startParsed) ? format(startParsed, STORAGE_FORMAT) : '',
        endDate: format(selectedDate, STORAGE_FORMAT),
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const value = e.target.value;
    const date = parse(value, DISPLAY_FORMAT, new Date());
    if (type === 'start') {
      setStart(value);
      if (isValid(date)) {
        handleStartSelect(date);
      }
    } else {
      setEnd(value);
      if (isValid(date)) {
        handleEndSelect(date);
      }
    }
  };

  React.useEffect(() => {
    setStart(startDate ? format(parse(startDate, STORAGE_FORMAT, new Date()), DISPLAY_FORMAT) : '');
    setEnd(endDate ? format(parse(endDate, STORAGE_FORMAT, new Date()), DISPLAY_FORMAT) : '');
  }, [startDate, endDate]);

  /** Thème clair : numéros de jour en noir (pas en bleu) */
  const calendarLightClassNames = isLight
    ? {
        day: 'text-black hover:bg-[#f3f4f6] hover:text-black',
        day_selected:
          'bg-[#e5e7eb] text-black hover:bg-[#d1d5db] hover:text-black focus:bg-[#d1d5db] focus:text-black',
        day_today: 'bg-[#f3f4f6] text-black',
        day_outside: 'text-[#9ca3af] opacity-50',
      }
    : undefined;

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover.Popover>
        <Popover.PopoverTrigger asChild>
          <div className="relative w-full">
            <CalendarIcon className={cn('absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform', iconClasses)} />
            <input
              id={`${id}-start`}
              type="text"
              placeholder={t('Start Date', 'Start date')}
              autoComplete="off"
              value={start}
              onChange={e => handleInputChange(e, 'start')}
              className={cn(inputClasses, !start && (isLight ? 'text-[#9ca3af]' : 'text-muted-foreground'))}
              data-cy="input-date-range-start"
            />
          </div>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className={cn('w-auto p-0', isLight && 'bg-white')}
          align="start"
        >
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={start ? parse(start, DISPLAY_FORMAT, new Date()) : new Date()}
            selected={start ? parse(start, DISPLAY_FORMAT, new Date()) : undefined}
            onSelect={handleStartSelect}
            numberOfMonths={1}
            classNames={calendarLightClassNames}
          />
        </Popover.PopoverContent>
      </Popover.Popover>

      <Popover.Popover
        open={openEnd}
        onOpenChange={setOpenEnd}
      >
        <Popover.PopoverTrigger asChild>
          <div className="relative w-full">
            <CalendarIcon className={cn('absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform', iconClasses)} />
            <input
              id={`${id}-end`}
              type="text"
              placeholder={t('End Date', 'End date')}
              autoComplete="off"
              value={end}
              onChange={e => handleInputChange(e, 'end')}
              className={cn(inputClasses, !end && (isLight ? 'text-[#9ca3af]' : 'text-muted-foreground'))}
              data-cy="input-date-range-end"
            />
          </div>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className={cn('w-auto p-0', isLight && 'bg-white')}
          align="start"
        >
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={start ? parse(start, DISPLAY_FORMAT, new Date()) : new Date()}
            selected={end ? parse(end, DISPLAY_FORMAT, new Date()) : undefined}
            onSelect={handleEndSelect}
            numberOfMonths={1}
            classNames={calendarLightClassNames}
          />
        </Popover.PopoverContent>
      </Popover.Popover>
    </div>
  );
}
