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
};

export function DatePickerWithRange({
  className,
  id,
  startDate,
  endDate,
  onChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & DatePickerWithRangeProps) {
  const { t } = useTranslation('DatePicker');
  const inputDateFormat = t('Input date format', 'yyyy-MM-dd');
  const parseInputDate = (value: string) => parse(value, inputDateFormat, new Date());
  const formatInputDate = (dicomDate: string) => {
    const parsed = parse(dicomDate, 'yyyyMMdd', new Date());
    return isValid(parsed) ? format(parsed, inputDateFormat) : '';
  };
  const toDicomDate = (value: string) => {
    const parsed = parseInputDate(value);
    return isValid(parsed) ? format(parsed, 'yyyyMMdd') : '';
  };
  const [start, setStart] = React.useState<string>(
    startDate ? formatInputDate(startDate) : ''
  );
  const [end, setEnd] = React.useState<string>(
    endDate ? formatInputDate(endDate) : ''
  );
  const [openEnd, setOpenEnd] = React.useState(false);

  const handleStartSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, inputDateFormat);
      setStart(formattedDate);
      setOpenEnd(true);
      onChange({
        startDate: format(selectedDate, 'yyyyMMdd'),
        endDate: toDicomDate(end),
      });
    }
  };

  const handleEndSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, inputDateFormat);
      setEnd(formattedDate);
      setOpenEnd(false);
      onChange({
        startDate: toDicomDate(start),
        endDate: format(selectedDate, 'yyyyMMdd'),
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const value = e.target.value;
    const date = parseInputDate(value);
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
    setStart(startDate ? formatInputDate(startDate) : '');
    setEnd(endDate ? formatInputDate(endDate) : '');
  }, [startDate, endDate, inputDateFormat]);

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover.Popover>
        <Popover.PopoverTrigger asChild>
          <div className="relative w-full">
            {!start && (
              <CalendarIcon className="text-primary absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            )}
            <input
              id={`${id}-start`}
              type="text"
              placeholder={t('Start', 'Start')}
              autoComplete="off"
              value={start}
              onChange={e => handleInputChange(e, 'start')}
              className={cn(
                'border-input focus:border-ring hover:text-foreground placeholder:text-muted-foreground h-7 w-full justify-start rounded border bg-background pl-1.5 pr-0.5 py-1 text-left text-base font-normal hover:bg-background'
              )}
              data-cy="input-date-range-start"
            />
          </div>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className="w-auto overflow-hidden p-0"
          align="start"
        >
          <Calendar
            autoFocus
            mode="single"
            captionLayout="dropdown"
            defaultMonth={start ? parseInputDate(start) : new Date()}
            selected={start ? parseInputDate(start) : undefined}
            onSelect={handleStartSelect}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 1, 11)}
            numberOfMonths={1}
          />
        </Popover.PopoverContent>
      </Popover.Popover>

      <Popover.Popover
        open={openEnd}
        onOpenChange={setOpenEnd}
      >
        <Popover.PopoverTrigger asChild>
          <div className="relative w-full">
            {!end && (
              <CalendarIcon className="text-primary absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            )}
            <input
              id={`${id}-end`}
              type="text"
              placeholder={t('End', 'End')}
              autoComplete="off"
              value={end}
              onChange={e => handleInputChange(e, 'end')}
              className={cn(
                'border-input focus:border-ring hover:text-foreground placeholder:text-muted-foreground h-7 w-full justify-start rounded border bg-background pl-1.5 pr-0.5 py-1 text-left text-base font-normal hover:bg-background'
              )}
              data-cy="input-date-range-end"
            />
          </div>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className="w-auto overflow-hidden p-0"
          align="start"
        >
          <Calendar
            autoFocus
            mode="single"
            captionLayout="dropdown"
            defaultMonth={end ? parseInputDate(end) : new Date()}
            selected={end ? parseInputDate(end) : undefined}
            onSelect={handleEndSelect}
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 1, 11)}
            numberOfMonths={1}
          />
        </Popover.PopoverContent>
      </Popover.Popover>
    </div>
  );
}
