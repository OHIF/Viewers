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
  inputClassName?: string;
  /** Where the calendar icon sits inside each input. Defaults to 'right'. */
  iconPosition?: 'left' | 'right';
  /** Extra class names merged onto the calendar icon (e.g. to override color). */
  iconClassName?: string;
  /** Override the start input placeholder. Defaults to the translated "Start Date". Pass "" to hide. */
  startPlaceholder?: string;
  /** Override the end input placeholder. Defaults to the translated "End Date". Pass "" to hide. */
  endPlaceholder?: string;
};

export function DatePickerWithRange({
  className,
  id,
  startDate,
  endDate,
  onChange,
  inputClassName,
  iconPosition = 'right',
  iconClassName,
  startPlaceholder,
  endPlaceholder,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & DatePickerWithRangeProps) {
  const { t } = useTranslation('DatePicker');
  const [start, setStart] = React.useState<string>(
    startDate ? format(parse(startDate, 'yyyyMMdd', new Date()), 'yyyy-MM-dd') : ''
  );
  const [end, setEnd] = React.useState<string>(
    endDate ? format(parse(endDate, 'yyyyMMdd', new Date()), 'yyyy-MM-dd') : ''
  );
  const [openEnd, setOpenEnd] = React.useState(false);

  const handleStartSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      setStart(formattedDate);
      setOpenEnd(true);
      onChange({
        startDate: format(selectedDate, 'yyyyMMdd'),
        endDate: end.replace(/-/g, ''),
      });
    }
  };

  const handleEndSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      setEnd(formattedDate);
      setOpenEnd(false);
      onChange({
        startDate: start.replace(/-/g, ''),
        endDate: format(selectedDate, 'yyyyMMdd'),
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const value = e.target.value;
    const date = parse(value, 'yyyy-MM-dd', new Date());
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
    setStart(startDate ? format(parse(startDate, 'yyyyMMdd', new Date()), 'yyyy-MM-dd') : '');
    setEnd(endDate ? format(parse(endDate, 'yyyyMMdd', new Date()), 'yyyy-MM-dd') : '');
  }, [startDate, endDate]);

  return (
    <div
      className={cn('flex gap-2', className)}
      {...props}
    >
      <Popover.Popover>
        <Popover.PopoverTrigger asChild>
          <div className="relative w-full">
            {!start && (
              <CalendarIcon
                className={cn(
                  'text-foreground absolute top-1/2 h-4 w-4 -translate-y-1/2 transform',
                  iconPosition === 'left' ? 'left-2' : 'right-2',
                  iconClassName
                )}
              />
            )}
            <input
              id={`${id}-start`}
              type="text"
              placeholder={startPlaceholder ?? t('Start Date', 'Start date')}
              autoComplete="off"
              value={start}
              onChange={e => handleInputChange(e, 'start')}
              className={cn(
                'border-inputfield-main focus:border-inputfield-focus hover:text-foreground placeholder:text-muted-foreground h-[32px] w-full justify-start rounded border bg-background py-[6.5px] pl-[6.5px] pr-[6.5px] text-left text-base font-normal hover:bg-background',
                inputClassName
              )}
              data-cy="input-date-range-start"
            />
          </div>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={start ? parse(start, 'yyyy-MM-dd', new Date()) : new Date()}
            selected={start ? parse(start, 'yyyy-MM-dd', new Date()) : undefined}
            onSelect={handleStartSelect}
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
              <CalendarIcon
                className={cn(
                  'text-foreground absolute top-1/2 h-4 w-4 -translate-y-1/2 transform',
                  iconPosition === 'left' ? 'left-2' : 'right-2',
                  iconClassName
                )}
              />
            )}
            <input
              id={`${id}-end`}
              type="text"
              placeholder={endPlaceholder ?? t('End Date', 'End date')}
              autoComplete="off"
              value={end}
              onChange={e => handleInputChange(e, 'end')}
              className={cn(
                'border-inputfield-main focus:border-inputfield-focus hover:text-foreground placeholder:text-muted-foreground h-full w-full justify-start rounded border bg-background py-[6.5px] pl-[6.5px] pr-[6.5px] text-left text-base font-normal hover:bg-background',
                inputClassName
              )}
              data-cy="input-date-range-end"
            />
          </div>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={start ? parse(start, 'yyyy-MM-dd', new Date()) : new Date()}
            selected={end ? parse(end, 'yyyy-MM-dd', new Date()) : undefined}
            onSelect={handleEndSelect}
            numberOfMonths={1}
          />
        </Popover.PopoverContent>
      </Popover.Popover>
    </div>
  );
}
