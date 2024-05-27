import * as React from 'react';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import Calendar from '../Calendar';
import Popover from '../Popover';

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
  const [start, setStart] = React.useState<Date | undefined>(
    startDate ? parse(startDate, 'yyyyMMdd', new Date()) : undefined
  );
  const [end, setEnd] = React.useState<Date | undefined>(
    endDate ? parse(endDate, 'yyyyMMdd', new Date()) : undefined
  );
  const [openEnd, setOpenEnd] = React.useState(false);

  const handleStartSelect = (selectedDate: Date | undefined) => {
    setStart(selectedDate);
    setOpenEnd(true);
    onChange({
      startDate: selectedDate ? format(selectedDate, 'yyyyMMdd') : '',
      endDate: end ? format(end, 'yyyyMMdd') : '',
    });
  };

  const handleEndSelect = (selectedDate: Date | undefined) => {
    setEnd(selectedDate);
    setOpenEnd(false);
    onChange({
      startDate: start ? format(start, 'yyyyMMdd') : '',
      endDate: selectedDate ? format(selectedDate, 'yyyyMMdd') : '',
    });
  };

  React.useEffect(() => {
    setStart(startDate ? parse(startDate, 'yyyyMMdd', new Date()) : undefined);
    setEnd(endDate ? parse(endDate, 'yyyyMMdd', new Date()) : undefined);
  }, [startDate, endDate]);

  return (
    <div className={cn('flex gap-2', className)}>
      <Popover.Popover>
        <Popover.PopoverTrigger asChild>
          <Button
            id={`${id}-start`}
            variant={'outline'}
            className={cn(
              'border-inputfield-main focus:border-inputfield-focus [&[data-state=open]]:border-inputfield-focus h-full w-full justify-start rounded bg-black py-[6.5px] pl-[6.5px] pr-[6.5px] text-left font-normal hover:bg-black hover:text-white',
              !start && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {start ? format(start, 'LLL dd, y') : <span>Start date</span>}
          </Button>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={start}
            selected={start}
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
          <Button
            id={`${id}-end`}
            variant={'outline'}
            className={cn(
              'border-inputfield-main focus:border-inputfield-focus [&[data-state=open]]:border-inputfield-focus h-full w-full justify-start rounded bg-black py-[6.5px] pl-[6.5px] pr-[6.5px] text-left font-normal hover:bg-black hover:text-white',
              !end && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {end ? format(end, 'LLL dd, y') : <span>End date</span>}
          </Button>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent
          className="w-auto p-0"
          align="start"
        >
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={end}
            selected={end}
            onSelect={handleEndSelect}
            numberOfMonths={1}
          />
        </Popover.PopoverContent>
      </Popover.Popover>
    </div>
  );
}
