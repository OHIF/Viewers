import * as React from 'react';
import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import {
  ar as arLocale,
  ca as caLocale,
  de as deLocale,
  enUS,
  fr as frLocale,
  ja as jaLocale,
  nl as nlLocale,
  ptBR as ptBRLocale,
  ru as ruLocale,
  tr as trLocale,
  vi as viLocale,
  zhCN as zhLocale,
} from 'date-fns/locale';

import { cn } from '../../lib/utils';

import { buttonVariants } from '../Button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const DATE_FNS_LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  'en-US': enUS,
  fr: frLocale,
  'fr-FR': frLocale,
  ar: arLocale,
  ca: caLocale,
  de: deLocale,
  'ja-JP': jaLocale,
  ja: jaLocale,
  nl: nlLocale,
  'pt-BR': ptBRLocale,
  pt: ptBRLocale,
  ru: ruLocale,
  'tr-TR': trLocale,
  tr: trLocale,
  vi: viLocale,
  zh: zhLocale,
  'zh-CN': zhLocale,
  'zh-cn': zhLocale,
  'test-LNG': enUS,
};

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const { i18n, t } = useTranslation('DatePicker');

  const locale = useMemo(() => {
    const lang = i18n.language || 'en';
    return DATE_FNS_LOCALE_MAP[lang] ?? enUS;
  }, [i18n.language]);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      captionLayout="dropdown"
      fromYear={1945}
      toYear={new Date().getFullYear()}
      labels={{
        labelMonthDropdown: () => undefined,
        labelYearDropdown: () => undefined,
      }}
      locale={locale}
      formatters={{
        formatCaption: month => format(month, 'LLLL yyyy', { locale }),
      }}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-between items-center px-2',

        caption_dropdowns: 'flex space-x-2 text-black',
        caption_label: 'hidden',
        nav: 'space-x-1 flex items-center',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] uppercase',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary/60 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground focus:bg-primary/80 focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
