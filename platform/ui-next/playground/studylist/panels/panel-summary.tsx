import React from 'react';
import type { StudyRow } from '../types';
import { cn } from '../../../src/lib/utils';
import patientSummaryIcon from '../assets/PatientStudyList.svg';
import { Icons } from '../../../src/components/Icons/Icons';

export type SummaryGetters<T> = {
  name?: (data: T) => React.ReactNode;
  mrn?: (data: T) => React.ReactNode;
};

type SummaryResolvedGetters<T> = {
  name: (data: T) => React.ReactNode;
  mrn: (data: T) => React.ReactNode;
};

type SummaryContextValue<T> = {
  data: T | null;
  get: SummaryResolvedGetters<T>;
};

const SummaryContext = React.createContext<SummaryContextValue<unknown> | null>(null);

function useSummaryContext<T>() {
  const context = React.useContext(SummaryContext);
  if (!context) {
    throw new Error('Summary.* components must be used within <Summary.Root>');
  }
  return context as SummaryContextValue<T>;
}

type SummaryRootProps<T extends { patient?: unknown; mrn?: unknown } = StudyRow> = {
  data?: T | null;
  /** @deprecated use `data` instead */
  study?: T | null;
  get?: SummaryGetters<T>;
  className?: string;
  children: React.ReactNode;
};

function SummaryRoot<T extends { patient?: unknown; mrn?: unknown } = StudyRow>({
  data: dataProp,
  study,
  get,
  className,
  children,
}: SummaryRootProps<T>) {
  const data = dataProp ?? study ?? null;

  const resolvedGetters = React.useMemo<SummaryResolvedGetters<T>>(
    () => ({
      name:
        get?.name ??
        ((item: T) => ((item as unknown as StudyRow | undefined)?.patient ?? '') as React.ReactNode),
      mrn:
        get?.mrn ??
        ((item: T) => ((item as unknown as StudyRow | undefined)?.mrn ?? '') as React.ReactNode),
    }),
    [get]
  );

  return (
    <SummaryContext.Provider value={{ data, get: resolvedGetters }}>
      <div className={cn('flex flex-col gap-2', className)}>{children}</div>
    </SummaryContext.Provider>
  );
}

type SummarySectionProps = {
  variant?: 'card' | 'row';
  className?: string;
  children?: React.ReactNode;
};

function SummarySection({ variant = 'card', className, children }: SummarySectionProps) {
  const base =
    variant === 'card'
      ? 'border-border/50 bg-muted/40 rounded-lg border px-4 py-3'
      : 'border-border/50 rounded-lg border px-4 py-3';
  return <div className={cn(base, 'flex items-center gap-3', className)}>{children}</div>;
}

type SummaryIconProps = {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  hideWhenEmpty?: boolean;
  children?: React.ReactNode;
};

function SummaryIcon({
  src,
  alt = '',
  size = 33,
  className,
  hideWhenEmpty,
  children,
}: SummaryIconProps) {
  if (hideWhenEmpty && !src && !children) {
    return null;
  }

  if (children) {
    return (
      <div
        className={cn('shrink-0', className)}
        aria-hidden
        style={{ width: size, height: size }}
      >
        {children}
      </div>
    );
  }

  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      style={{ width: size, height: size }}
    />
  );
}

type SummaryNameProps<T = StudyRow> = {
  placeholder?: React.ReactNode;
  className?: string;
  children?: (value: React.ReactNode, data: T | null) => React.ReactNode;
};

function SummaryName<T = StudyRow>({
  placeholder = 'Select a study',
  className,
  children,
}: SummaryNameProps<T>) {
  const { data, get } = useSummaryContext<T>();
  const value = data ? get.name(data) : null;
  const content = value ?? placeholder;

  return (
    <span className={cn('text-foreground truncate text-base font-medium leading-tight', className)}>
      {typeof children === 'function' ? children(content, data) : content}
    </span>
  );
}

type SummaryMRNProps<T = StudyRow> = {
  hideWhenEmpty?: boolean;
  prefix?: React.ReactNode;
  className?: string;
  children?: (value: React.ReactNode, data: T | null) => React.ReactNode;
};

function SummaryMRN<T = StudyRow>({
  hideWhenEmpty = true,
  prefix,
  className,
  children,
}: SummaryMRNProps<T>) {
  const { data, get } = useSummaryContext<T>();
  const value = data ? get.mrn(data) : null;

  if ((value === null || value === undefined || value === '') && hideWhenEmpty) {
    return null;
  }

  const baseContent = (
    <>
      {prefix}
      {value}
    </>
  );

  return (
    <span className={cn('text-muted-foreground truncate text-sm leading-tight', className)}>
      {typeof children === 'function' ? children(value, data) : baseContent}
    </span>
  );
}

function SummaryMeta({ className, children }: { className?: string; children?: React.ReactNode }) {
  if (!children) {
    return null;
  }
  return (
    <span className={cn('text-muted-foreground truncate text-sm leading-tight', className)}>
      {children}
    </span>
  );
}

function SummaryActions({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn('flex flex-col gap-2', className)}>{children}</div>;
}

type SummaryActionProps<T = StudyRow> = {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: (data: T | null) => void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  children?: React.ReactNode;
};

function SummaryAction<T = StudyRow>({
  label,
  icon,
  onClick,
  disabled,
  disabledReason,
  className,
  children,
}: SummaryActionProps<T>) {
  const { data } = useSummaryContext<T>();
  const isDisabled = disabled ?? !data;
  const titleAttr = isDisabled && disabledReason ? String(disabledReason) : undefined;

  return (
    <button
      type="button"
      onClick={() => {
        if (!isDisabled) {
          onClick?.(data ?? null);
        }
      }}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      title={titleAttr}
      className={cn(
        'border-border/50 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition',
        isDisabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
    >
      <span className="text-foreground text-base font-medium leading-tight">
        {children ?? label}
      </span>
      {icon ? (
        <span className="text-primary h-6 w-6 shrink-0" aria-hidden>
          {icon}
        </span>
      ) : null}
    </button>
  );
}

type SummaryWorkflowButtonProps<T = StudyRow> = {
  label?: React.ReactNode;
  onClick?: (data: T) => void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  icon?: React.ReactNode;
};

function SummaryWorkflowButton<T = StudyRow>({
  label = 'Launch workflow',
  onClick,
  disabled,
  disabledReason,
  className,
  icon = <Icons.LaunchArrow />,
}: SummaryWorkflowButtonProps<T>) {
  const { data } = useSummaryContext<T>();
  const computedDisabled = disabled ?? !data;

  return (
    <SummaryAction<T>
      label={label}
      icon={icon}
      className={className}
      disabled={computedDisabled}
      disabledReason={disabledReason ?? 'Select a study to launch'}
      onClick={(item) => {
        if (!computedDisabled && item) {
          onClick?.(item);
        }
      }}
    />
  );
}

type SummaryPatientProps = {
  placeholder?: React.ReactNode;
  className?: string;
  hideIcon?: boolean;
  hideName?: boolean;
  hideMrn?: boolean;
  iconAlt?: string;
  iconSrc?: string;
};

function SummaryPatient({
  placeholder = 'Select a study',
  className,
  hideIcon,
  hideName,
  hideMrn,
  iconAlt = '',
  iconSrc = patientSummaryIcon,
}: SummaryPatientProps) {
  return (
    <SummarySection className={className}>
      {!hideIcon && <SummaryIcon src={iconSrc} alt={iconAlt} size={33} />}
      <div className="flex min-w-0 flex-col">
        {!hideName && <SummaryName placeholder={placeholder} />}
        {!hideMrn && <SummaryMRN />}
      </div>
    </SummarySection>
  );
}

type SummaryWorkflowsProps<T = StudyRow> = {
  label?: React.ReactNode;
  onClick?: (data: T) => void;
  className?: string;
  disabled?: boolean;
  disabledReason?: string;
  icon?: React.ReactNode;
};

function SummaryWorkflows<T = StudyRow>({
  label = 'Launch workflow',
  onClick,
  className,
  disabled,
  disabledReason,
  icon,
}: SummaryWorkflowsProps<T>) {
  return (
    <SummaryWorkflowButton<T>
      label={label}
      onClick={onClick}
      className={className}
      disabled={disabled}
      disabledReason={disabledReason}
      icon={icon}
    />
  );
}

export const Summary = Object.assign(SummaryRoot, {
  Root: SummaryRoot,
  Section: SummarySection,
  Icon: SummaryIcon,
  Name: SummaryName,
  MRN: SummaryMRN,
  Meta: SummaryMeta,
  Actions: SummaryActions,
  Action: SummaryAction,
  WorkflowButton: SummaryWorkflowButton,
  Patient: SummaryPatient,
  Workflows: SummaryWorkflows,
});

export const PanelSummary = Summary;
