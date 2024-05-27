"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from '../../lib/utils';
import { Button } from "../Button"
import Calendar from "../Calendar"
import Popover from "../Popover"

export type DatePickerWithRangeProps = {
  id: string,
  /** YYYYMMDD (19921022) */
  startDate: string,
  /** YYYYMMDD (19921022) */
  endDate: string,
  /** Callback that received { startDate: string(YYYYMMDD), endDate: string(YYYYMMDD)} */
  onChange: (value: { startDate: string, endDate: string }) => void,
};

export function DatePickerWithRange({
  className,
  id,
  startDate,
  endDate,
  onChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & DatePickerWithRangeProps) {

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startDate ? parse(startDate, "yyyyMMdd", new Date()) : undefined,
    to: endDate ? parse(endDate, "yyyyMMdd", new Date()) : undefined,
  })

  React.useEffect(() => {
    onChange({
      startDate: date?.from ? format(date.from, "yyyyMMdd") : "",
      endDate: date?.to ? format(date.to, "yyyyMMdd") : "",
    })
  }, [date])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover.Popover>
        <Popover.PopoverTrigger asChild>
          <Button
            id={id || "date"}
            variant={"outline"}
            className={cn(
              "w-full h-full py-[6.5px] pl-[6.5px] pr-[6.5px]  border-inputfield-main bg-black hover:bg-black hover:text-white focus:border-inputfield-focus [&[data-state=open]]:border-inputfield-focus rounded justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </Popover.PopoverTrigger>
        <Popover.PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </Popover.PopoverContent>
      </Popover.Popover>
    </div>
  )
}
