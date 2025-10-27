import React from 'react';
import type { ElementType } from 'react';
import type { StudyRow } from '../types';
import { cn } from '../../../src/lib/utils';
import patientSummaryIcon from '../assets/PatientStudyList.svg';
import infoIcon from '../assets/info.svg';
import { Icons } from '../../../src/components/Icons/Icons';
import { Button } from '../../../src/components/Button';

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
      name: get?.name ?? ((item: T) => ((item as any)?.patient ?? '') as React.ReactNode),
      mrn: get?.mrn ?? ((item: T) => ((item as any)?.mrn ?? '') as React.ReactNode),
    }),
    [get]
  );

  return (
    <SummaryContext.Provider value={{ data, get: resolvedGetters }}>
      <div className={cn('flex flex-col gap-1', className)}>{children}</div>
    </SummaryContext.Provider>
  );
}

type SummarySectionProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'card' | 'row' | 'ghost';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
};

const SummarySection = React.forwardRef<HTMLDivElement, SummarySectionProps>(
  ({ variant = 'card', align = 'center', gap = 3, className, style, children, ...rest }, ref) => {
    const baseClassMap = {
      card: 'bg-muted rounded-lg px-4 py-3',
      row: 'rounded-lg px-4 py-3',
      ghost: 'px-0 py-0',
    } as const;
    const baseClass = baseClassMap[variant] ?? baseClassMap.card;

    const alignClassMap = {
      start: 'items-start',
      end: 'items-end',
      stretch: 'items-stretch',
      center: 'items-center',
    } as const;
    const alignmentClass = alignClassMap[align] ?? alignClassMap.center;

    return (
      <div
        ref={ref}
        className={cn(baseClass, 'flex', alignmentClass, className)}
        style={{ gap: `${gap * 0.25}rem`, ...style }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

SummarySection.displayName = 'SummarySection';

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
      className={cn('shrink-0', className)}
      style={{ width: size, height: size }}
    />
  );
}

type SummaryNameProps<T = StudyRow> = {
  placeholder?: React.ReactNode;
  className?: string;
  children?: (value: React.ReactNode, data: T | null) => React.ReactNode;
  showTitleOnTruncate?: boolean;
};

function SummaryName<T = StudyRow>({
  placeholder = 'Select a study',
  className,
  children,
  showTitleOnTruncate = true,
}: SummaryNameProps<T>) {
  const { data, get } = useSummaryContext<T>();
  const value = data ? get.name(data) : null;
  const content = value ?? placeholder;
  const title =
    showTitleOnTruncate && (typeof value === 'string' || typeof value === 'number')
      ? String(value)
      : undefined;

  return (
    <span
      title={title}
      className={cn('text-foreground truncate text-base font-medium leading-tight', className)}
    >
      {typeof children === 'function' ? children(content, data) : content}
    </span>
  );
}

type SummaryMRNProps<T = StudyRow> = {
  hideWhenEmpty?: boolean;
  prefix?: React.ReactNode;
  className?: string;
  children?: (value: React.ReactNode, data: T | null) => React.ReactNode;
  showTitleOnTruncate?: boolean;
};

function SummaryMRN<T = StudyRow>({
  hideWhenEmpty = true,
  prefix,
  className,
  children,
  showTitleOnTruncate = true,
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
    <span
      title={
        showTitleOnTruncate && (typeof value === 'string' || typeof value === 'number')
          ? String(value)
          : undefined
      }
      className={cn('text-muted-foreground truncate text-sm leading-tight', className)}
    >
      {typeof children === 'function' ? children(value, data) : baseContent}
    </span>
  );
}

function SummaryMeta({ className, children }: { className?: string; children?: React.ReactNode }) {
  if (children == null) {
    return null;
  }
  return (
    <span className={cn('text-muted-foreground truncate text-sm leading-tight', className)}>
      {children}
    </span>
  );
}

type SummaryActionsProps = React.HTMLAttributes<HTMLDivElement> & {
  direction?: 'column' | 'row';
  gap?: number;
  wrap?: boolean;
  justify?: 'start' | 'end' | 'between' | 'center';
};

const SummaryActions = React.forwardRef<HTMLDivElement, SummaryActionsProps>(
  (
    {
      direction = 'column',
      gap = 2,
      wrap = false,
      justify = 'start',
      className,
      style,
      children,
      ...rest
    },
    ref
  ) => {
    const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';

    const justifyClassMap = {
      start: 'justify-start',
      end: 'justify-end',
      between: 'justify-between',
      center: 'justify-center',
    } as const;
    const justifyClass = justifyClassMap[justify] ?? justifyClassMap.start;

    return (
      <div
        ref={ref}
        className={cn('flex', directionClass, justifyClass, className)}
        style={{ gap: `${gap * 0.25}rem`, flexWrap: wrap ? 'wrap' : undefined, ...style }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

SummaryActions.displayName = 'SummaryActions';

type SummaryActionOwnProps<T = StudyRow> = {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: (data: T | null) => void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  children?: React.ReactNode;
  as?: ElementType;
  href?: string;
  iconPosition?: 'start' | 'end';
  iconSize?: number;
};

type SummaryActionProps<T = StudyRow> = SummaryActionOwnProps<T> &
  Omit<React.HTMLAttributes<HTMLElement>, keyof SummaryActionOwnProps<T> | 'onClick'>;

const SummaryActionInner = <T = StudyRow,>(
  {
    label,
    icon,
    onClick,
    disabled,
    disabledReason,
    className,
    children,
    as: Component = 'button',
    href,
    iconPosition = 'end',
    iconSize = 24,
    style,
    ...rest
  }: SummaryActionProps<T>,
  ref: React.ForwardedRef<HTMLElement>
) => {
  const { data } = useSummaryContext<T>();
  const isDisabled = disabled ?? !data;
  const titleAttr = isDisabled && disabledReason ? String(disabledReason) : undefined;
  const id = React.useId();
  const reasonId = `${id}-reason`;

  const iconNode = icon ? (
    <span
      className="text-primary shrink-0"
      aria-hidden
      style={{ width: iconSize, height: iconSize }}
    >
      {icon}
    </span>
  ) : null;

  const leadingContent =
    iconNode && iconPosition === 'start' ? (
      <span className="text-foreground flex items-center gap-2 text-base font-medium leading-tight">
        {iconNode}
        {children ?? label}
      </span>
    ) : (
      <span className="text-foreground text-base font-medium leading-tight">
        {children ?? label}
      </span>
    );

  const trailingContent = iconNode && iconPosition === 'end' ? iconNode : null;

  const srOnly =
    isDisabled && disabledReason ? (
      <span
        id={reasonId}
        className="sr-only"
      >
        {disabledReason}
      </span>
    ) : null;

  const commonClassName = cn(
    'border-border/50 flex w-full items-center justify-between rounded-lg bg-muted px-4 py-3 text-left transition',
    isDisabled
      ? 'cursor-not-allowed opacity-50'
      : 'hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    className
  );

  const commonProps = {
    className: commonClassName,
    style,
    'aria-disabled': isDisabled || undefined,
    title: titleAttr,
    'aria-describedby': isDisabled && disabledReason ? reasonId : undefined,
  };

  const handleActivate = (event: React.MouseEvent<HTMLElement>) => {
    if (isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(data ?? null);
  };

  if (Component === 'button') {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        disabled={isDisabled}
        onClick={handleActivate}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        {...commonProps}
      >
        {srOnly}
        {leadingContent}
        {trailingContent}
      </button>
    );
  }

  if (Component === 'a') {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={isDisabled ? undefined : href}
        onClick={handleActivate}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        {...commonProps}
      >
        {srOnly}
        {leadingContent}
        {trailingContent}
      </a>
    );
  }

  const Comp = Component as ElementType;

  return (
    <Comp
      ref={ref}
      onClick={handleActivate}
      {...(rest as Record<string, unknown>)}
      {...commonProps}
    >
      {srOnly}
      {leadingContent}
      {trailingContent}
    </Comp>
  );
};

type SummaryActionComponentType = <T = StudyRow>(
  props: SummaryActionProps<T> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement | null;

const SummaryAction = React.forwardRef(SummaryActionInner) as SummaryActionComponentType;
SummaryAction.displayName = 'SummaryAction';

type SummaryWorkflowButtonProps<T = StudyRow> = {
  label?: React.ReactNode;
  onClick?: (data: T) => void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  iconSize?: number;
  as?: ElementType;
  onLaunchBasic?: (data: T) => void;
  onLaunchSegmentation?: (data: T) => void;
} & Omit<React.HTMLAttributes<HTMLElement>, 'onClick'>;

const SummaryWorkflowButtonInner = <T = StudyRow,>(
  {
    label = 'Launch workflow',
    onClick,
    disabled,
    disabledReason,
    className,
    icon = (
      <img
        src={infoIcon}
        alt=""
        className="h-4.5 w-4.5"
      />
    ),
    iconPosition = 'end',
    iconSize = 18,
    as,
    onLaunchBasic,
    onLaunchSegmentation,
    style,
    ...rest
  }: SummaryWorkflowButtonProps<T>,
  ref: React.ForwardedRef<HTMLElement>
) => {
  const { data } = useSummaryContext<T>();
  const computedDisabled = disabled ?? !data;
  const id = React.useId();
  const reasonId = `${id}-reason`;

  const handleBasic = () => {
    if (computedDisabled || !data) return;
    // Prefer explicit basic callback if provided; fall back to legacy onClick.
    onLaunchBasic?.(data);
    if (!onLaunchBasic) onClick?.(data);
  };

  const handleSegmentation = () => {
    if (computedDisabled || !data) return;
    onLaunchSegmentation?.(data);
    if (!onLaunchSegmentation) onClick?.(data);
  };

  const iconNode = icon ? (
    <span
      className="text-primary shrink-0"
      aria-hidden
      style={{ width: iconSize, height: iconSize }}
    >
      {icon}
    </span>
  ) : null;

  const srOnly =
    computedDisabled && disabledReason ? (
      <span
        id={reasonId}
        className="sr-only"
      >
        {disabledReason}
      </span>
    ) : null;

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(
        'border-border/50 bg-muted w-full rounded-lg px-4 py-3 text-left transition',
        className
      )}
      style={style}
      aria-disabled={computedDisabled || undefined}
      aria-describedby={computedDisabled && disabledReason ? reasonId : undefined}
      {...rest}
    >
      {srOnly}
      <div className="flex w-full items-center justify-between">
        {iconNode && iconPosition === 'start' ? (
          <span className="text-foreground flex items-center gap-2 text-base font-medium leading-tight">
            {iconNode}
            {label}
          </span>
        ) : (
          <span className="text-foreground text-base font-medium leading-tight">{label}</span>
        )}
        {iconNode && iconPosition === 'end' ? iconNode : null}
      </div>
      {data ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-32"
            disabled={computedDisabled}
            onClick={handleBasic}
          >
            Basic Viewer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-32"
            disabled={computedDisabled}
            onClick={handleSegmentation}
          >
            Segmentation
          </Button>
        </div>
      ) : null}
    </div>
  );
};

type SummaryWorkflowButtonComponent = <T = StudyRow>(
  props: SummaryWorkflowButtonProps<T> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement | null;

const SummaryWorkflowButton = React.forwardRef(
  SummaryWorkflowButtonInner
) as SummaryWorkflowButtonComponent;
SummaryWorkflowButton.displayName = 'SummaryWorkflowButton';

type SummaryPatientProps = {
  placeholder?: React.ReactNode;
  className?: string;
  hideIcon?: boolean;
  hideName?: boolean;
  hideMrn?: boolean;
  iconAlt?: string;
  iconSrc?: string;
  align?: SummarySectionProps['align'];
  gap?: number;
  variant?: SummarySectionProps['variant'];
};

function SummaryPatient({
  placeholder = 'Select a study',
  className,
  hideIcon,
  hideName,
  hideMrn,
  iconAlt = '',
  iconSrc = patientSummaryIcon,
  align,
  gap,
  variant,
}: SummaryPatientProps) {
  return (
    <SummarySection
      className={className}
      align={align}
      gap={gap}
      variant={variant}
    >
      {!hideIcon && (
        <SummaryIcon
          src={iconSrc}
          alt={iconAlt}
          size={33}
        />
      )}
      <div className="flex min-w-0 flex-col">
        {!hideName && <SummaryName placeholder={placeholder} />}
        {!hideMrn && <SummaryMRN />}
      </div>
    </SummarySection>
  );
}

type SummaryWorkflowsProps<T = StudyRow> = SummaryWorkflowButtonProps<T>;

/** @deprecated Prefer <Summary.WorkflowButton /> for new usage. */
function SummaryWorkflows<T = StudyRow>({
  label = 'Launch workflow',
  onClick,
  className,
  disabled,
  disabledReason,
  icon,
  iconPosition,
  iconSize,
  ...rest
}: SummaryWorkflowsProps<T>) {
  return (
    <SummaryWorkflowButton<T>
      label={label}
      onClick={onClick}
      className={className}
      disabled={disabled}
      disabledReason={disabledReason}
      icon={icon}
      iconPosition={iconPosition}
      iconSize={iconSize}
      {...rest}
    />
  );
}

type SummaryEmptyProps = {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconSrc?: string;
  iconAlt?: string;
  iconSize?: number;
  section?: SummarySectionProps;
};

function SummaryEmpty({
  children,
  icon,
  iconSrc = patientSummaryIcon,
  iconAlt = '',
  iconSize = 33,
  section,
}: SummaryEmptyProps) {
  const { data } = useSummaryContext<unknown>();

  if (data) {
    return null;
  }

  return (
    <SummarySection
      variant="card"
      {...section}
    >
      {icon ?? (
        <SummaryIcon
          src={iconSrc}
          alt={iconAlt}
          size={iconSize}
        />
      )}
      <span className="text-muted-foreground text-base font-medium leading-tight">
        {children ?? 'Select a study'}
      </span>
    </SummarySection>
  );
}

type SummaryFieldProps<T = StudyRow> = {
  of: (data: T) => React.ReactNode;
  hideWhenEmpty?: boolean;
  muted?: boolean;
  className?: string;
  showTitleOnTruncate?: boolean;
};

function SummaryField<T = StudyRow>({
  of,
  hideWhenEmpty = true,
  muted,
  className,
  showTitleOnTruncate = true,
}: SummaryFieldProps<T>) {
  const { data } = useSummaryContext<T>();
  const value = data ? of(data) : null;
  const isEmpty = value === null || value === undefined || value === '';

  if (hideWhenEmpty && isEmpty) {
    return null;
  }

  return (
    <span
      className={cn(
        muted ? 'text-muted-foreground' : 'text-foreground',
        'truncate text-sm leading-tight',
        className
      )}
      title={
        showTitleOnTruncate && (typeof value === 'string' || typeof value === 'number')
          ? String(value)
          : undefined
      }
    >
      {value}
    </span>
  );
}

type SummaryNamespace = typeof SummaryRoot & {
  Root: typeof SummaryRoot;
  Section: typeof SummarySection;
  Icon: typeof SummaryIcon;
  Name: typeof SummaryName;
  MRN: typeof SummaryMRN;
  Meta: typeof SummaryMeta;
  Actions: typeof SummaryActions;
  Action: SummaryActionComponentType;
  WorkflowButton: SummaryWorkflowButtonComponent;
  Patient: typeof SummaryPatient;
  Workflows: typeof SummaryWorkflows;
  Empty: typeof SummaryEmpty;
  Field: typeof SummaryField;
};

export const Summary: SummaryNamespace = Object.assign(SummaryRoot, {
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
  Empty: SummaryEmpty,
  Field: SummaryField,
});

export const PanelSummary = Summary;
