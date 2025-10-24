import React from 'react';
import type { StudyRow } from '../types';
import { cn } from '../../../src/lib/utils';
import patientSummaryIcon from '../assets/PatientStudyList.svg';
import { Icons } from '../../../src/components/Icons/Icons';

type SummaryContextValue = {
  study: StudyRow | null;
};

const SummaryContext = React.createContext<SummaryContextValue | null>(null);

function useSummaryContext() {
  const context = React.useContext(SummaryContext);
  if (!context) {
    throw new Error('Summary.* components must be used within <Summary>');
  }
  return context;
}

type SummaryProps = {
  study?: StudyRow | null;
  children: React.ReactNode;
  className?: string;
};

function SummaryRoot({ study = null, children, className }: SummaryProps) {
  return (
    <SummaryContext.Provider value={{ study }}>
      <div className={cn('flex flex-col gap-2', className)}>{children}</div>
    </SummaryContext.Provider>
  );
}

type SummaryPatientProps = {
  placeholder?: string;
  className?: string;
};

function SummaryPatient({ placeholder = 'Select a study', className }: SummaryPatientProps) {
  const { study } = useSummaryContext();
  const hasSelection = Boolean(study);

  return (
    <div
      className={cn(
        'border-border/50 bg-muted/40 flex items-center gap-3 rounded-lg border px-4 py-3',
        className
      )}
    >
      <img
        src={patientSummaryIcon}
        alt=""
        width={33}
        height={33}
        className="h-[33px] w-[33px]"
        aria-hidden
      />
      <div className="flex min-w-0 flex-col">
        {hasSelection && study ? (
          <>
            <span className="text-foreground truncate text-base font-medium leading-tight">
              {study.patient}
            </span>
            <span className="text-muted-foreground truncate text-sm leading-tight">{study.mrn}</span>
          </>
        ) : (
          <span className="text-muted-foreground text-base font-medium leading-tight">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

type SummaryWorkflowsProps = {
  label?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

function SummaryWorkflows({
  label = 'Launch workflow',
  onClick,
  className,
  disabled,
}: SummaryWorkflowsProps) {
  const { study } = useSummaryContext();
  const hasSelection = Boolean(study);
  const isDisabled = disabled ?? !hasSelection;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isDisabled) {
          onClick?.();
        }
      }}
      disabled={isDisabled}
      className={cn(
        'border-border/50 flex items-center justify-between rounded-lg border px-4 py-3 text-left transition',
        isDisabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
    >
      <span className="text-foreground text-base font-medium leading-tight">{label}</span>
      <Icons.LaunchArrow className="text-primary h-6 w-6 shrink-0" aria-hidden />
    </button>
  );
}

export const Summary = Object.assign(SummaryRoot, {
  Patient: SummaryPatient,
  Workflows: SummaryWorkflows,
});

export const PanelSummary = Summary;

