import * as React from 'react';
import type { ElementType } from 'react';
import { cn } from '../../lib/utils';
import { Icons } from '../Icons/Icons';
import { Button } from '../Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../DropdownMenu';

/** Public getters to adapt arbitrary data shapes to the PatientSummary defaults */
export type PatientSummaryGetters<T> = {
  name?: (data: T) => React.ReactNode;
  mrn?: (data: T) => React.ReactNode;
};

type ResolvedGetters<T> = {
  name: (data: T) => React.ReactNode;
  mrn: (data: T) => React.ReactNode;
};

type SummaryContextValue<T> = {
  data: T | null;
  get: ResolvedGetters<T>;
};

const SummaryContext = React.createContext<SummaryContextValue<unknown> | null>(null);

function useSummaryContext<T>() {
  const context = React.useContext(SummaryContext);
  if (!context) {
    throw new Error('PatientSummary.* components must be used within <PatientSummary.Root>');
  }
  return context as SummaryContextValue<T>;
}

type RootProps<T extends { patient?: unknown; mrn?: unknown } = any> = {
  data?: T | null;
  /** @deprecated use `data` instead */
  study?: T | null;
  get?: PatientSummaryGetters<T>;
  className?: string;
  children?: React.ReactNode;
};

function Root<T extends { patient?: unknown; mrn?: unknown } = any>({
  data: dataProp,
  study,
  get,
  className,
  children,
}: RootProps<T>) {
  const data = dataProp ?? study ?? null;

  const resolvedGetters = React.useMemo<ResolvedGetters<T>>(
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

type SectionProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'card' | 'row' | 'ghost';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
};

const Section = React.forwardRef<HTMLDivElement, SectionProps>(
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
Section.displayName = 'PatientSummarySection';

type IconProps = {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  hideWhenEmpty?: boolean;
  children?: React.ReactNode;
};

function Icon({
  src,
  alt = '',
  size = 33,
  className,
  hideWhenEmpty,
  children,
}: IconProps) {
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

type NameProps<T = any> = {
  placeholder?: React.ReactNode;
  className?: string;
  children?: (value: React.ReactNode, data: T | null) => React.ReactNode;
  showTitleOnTruncate?: boolean;
};

function Name<T = any>({
  placeholder = 'Select a study',
  className,
  children,
  showTitleOnTruncate = true,
}: NameProps<T>) {
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

type MRNProps<T = any> = {
  hideWhenEmpty?: boolean;
  prefix?: React.ReactNode;
  className?: string;
  children?: (value: React.ReactNode, data: T | null) => React.ReactNode;
  showTitleOnTruncate?: boolean;
};

function MRN<T = any>({
  hideWhenEmpty = true,
  prefix,
  className,
  children,
  showTitleOnTruncate = true,
}: MRNProps<T>) {
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

function Meta({ className, children }: { className?: string; children?: React.ReactNode }) {
  if (children == null) {
    return null;
  }
  return (
    <span className={cn('text-muted-foreground truncate text-sm leading-tight', className)}>
      {children}
    </span>
  );
}

type ActionsProps = React.HTMLAttributes<HTMLDivElement> & {
  direction?: 'column' | 'row';
  gap?: number;
  wrap?: boolean;
  justify?: 'start' | 'end' | 'between' | 'center';
};

const Actions = React.forwardRef<HTMLDivElement, ActionsProps>(
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
Actions.displayName = 'PatientSummaryActions';

type ActionOwnProps<T = any> = {
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

type ActionProps<T = any> = ActionOwnProps<T> &
  Omit<React.HTMLAttributes<HTMLElement>, keyof ActionOwnProps<T> | 'onClick'>;

const ActionInner = <T = any,>(
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
  }: ActionProps<T>,
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
      <span id={reasonId} className="sr-only">
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

type ActionComponentType = <T = any>(
  props: ActionProps<T> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement | null;

const Action = React.forwardRef(ActionInner) as ActionComponentType;
Action.displayName = 'PatientSummaryAction';

type WorkflowButtonProps<T = any, M extends string = string> = {
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
  /** Selected default mode label; when set, replaces per-study workflow buttons with a badge */
  defaultMode?: M | null;
  /** Updates the default mode label (set or clear) */
  onDefaultModeChange?: (value: M | null) => void;
} & Omit<React.HTMLAttributes<HTMLElement>, 'onClick'>;

const WorkflowButtonInner = <T = any, M extends string = string>(
  {
    label = 'Launch workflow',
    onClick,
    disabled,
    disabledReason,
    className,
    icon = <Icons.Info />,
    iconPosition = 'end',
    iconSize = 18,
    as,
    onLaunchBasic,
    onLaunchSegmentation,
    defaultMode,
    onDefaultModeChange,
    style,
    ...rest
  }: WorkflowButtonProps<T, M>,
  ref: React.ForwardedRef<HTMLElement>
) => {
  const { data } = useSummaryContext<T>();
  const computedDisabled = disabled ?? false; // allow default-mode picking even when no data
  const id = React.useId();
  const reasonId = `${id}-reason`;

  const getInferredWorkflows = React.useCallback((d: any): string[] => {
    const defaults = ['Basic Viewer', 'Segmentation'];
    if (!d) return defaults;
    if (Array.isArray(d.workflows) && d.workflows.length > 0) {
      return Array.from(new Set(d.workflows.map(String)));
    }
    const mod = String(d.modalities ?? '').toUpperCase();
    const flows = [...defaults];
    if (mod.includes('US')) flows.push('US Workflow');
    if (mod.includes('PET/CT') || (mod.includes('PET') && mod.includes('CT')))
      flows.push('TMTV Workflow');
    return Array.from(new Set(flows));
  }, []);

  const workflowButtons = React.useMemo(
    () => getInferredWorkflows(data),
    [data, getInferredWorkflows]
  );
  const hasDefault = !!(defaultMode && String(defaultMode).trim().length > 0);

  const handleLaunch = (wfLabel: string) => {
    if (computedDisabled || !data) return;
    // Back-compat explicit callbacks:
    if (wfLabel === 'Basic Viewer') onLaunchBasic?.(data);
    if (wfLabel === 'Segmentation') onLaunchSegmentation?.(data);
    // Generic handler fallback:
    onClick?.(data);
    try {
      // eslint-disable-next-line no-console
      console.log('Launch workflow:', wfLabel, { study: data });
    } catch {}
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
      <span id={reasonId} className="sr-only">
        {disabledReason}
      </span>
    ) : null;

  const renderBadge = (labelValue: string) => (
    <div className="mt-2">
      <span
        className="border-primary bg-primary/20 text-primary inline-flex items-center gap-1 rounded-full border px-2 py-1 text-base"
        role="status"
        aria-live="polite"
      >
        {labelValue}
        <button
          type="button"
          aria-label="Clear default mode"
          className="hover:bg-primary/20 ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full"
          onClick={() => onDefaultModeChange?.(null)}
        >
          x
        </button>
      </span>
    </div>
  );


  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn('border-border/50 bg-muted w-full rounded-lg px-4 py-3 text-left transition', className)}
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

      {/* Content selection logic */}
      {hasDefault ? (
        renderBadge(String(defaultMode))
      ) : data ? (
        <div className="mt-2 flex flex-wrap items-center gap-0">
          {workflowButtons.map((wf) => (
            <Button
              key={String(wf)}
              variant="ghost"
              size="sm"
              className="bg-primary/20 ml-1 mb-1 h-6 w-32"
              disabled={computedDisabled}
              onClick={() => handleLaunch(String(wf))}
            >
              {wf}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

type WorkflowButtonComponent = <T = any, M extends string = string>(
  props: WorkflowButtonProps<T, M> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement | null;

const WorkflowButton = React.forwardRef(WorkflowButtonInner) as WorkflowButtonComponent;
WorkflowButton.displayName = 'PatientSummaryWorkflowButton';

type PatientProps = {
  placeholder?: React.ReactNode;
  className?: string;
  hideIcon?: boolean;
  hideName?: boolean;
  hideMrn?: boolean;
  icon?: React.ReactNode;
  align?: SectionProps['align'];
  gap?: number;
  variant?: SectionProps['variant'];
};

function Patient({
  placeholder = 'Select a study',
  className,
  hideIcon,
  hideName,
  hideMrn,
  icon,
  align,
  gap,
  variant,
}: PatientProps) {
  return (
    <Section className={className} align={align} gap={gap} variant={variant}>
      {!hideIcon && (
        <Icon size={33} className="text-primary">
          {icon ?? <Icons.PatientStudyList width="100%" height="100%" />}
        </Icon>
      )}
      <div className="flex min-w-0 flex-col">
        {!hideName && <Name placeholder={placeholder} />}
        {!hideMrn && <MRN />}
      </div>
    </Section>
  );
}

/** Back-compat alias to match the prototype naming */
type WorkflowsProps<T = any, M extends string = string> = WorkflowButtonProps<T, M>;
function Workflows<T = any, M extends string = string>(props: WorkflowsProps<T, M>) {
  return <WorkflowButton<T, M> {...props} />;
}

type EmptyProps = {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  section?: SectionProps;
};

function Empty({ children, icon, section }: EmptyProps) {
  const { data } = useSummaryContext<unknown>();
  if (data) return null;

  return (
    <Section variant="card" {...section}>
      {icon ?? (
        <Icon size={33} className="text-primary">
          <Icons.PatientStudyList width="100%" height="100%" />
        </Icon>
      )}
      <span className="text-muted-foreground text-base font-medium leading-tight">
        {children ?? 'Select a study'}
      </span>
    </Section>
  );
}

type FieldProps<T = any> = {
  of: (data: T) => React.ReactNode;
  hideWhenEmpty?: boolean;
  muted?: boolean;
  className?: string;
  showTitleOnTruncate?: boolean;
};

function Field<T = any>({
  of,
  hideWhenEmpty = true,
  muted,
  className,
  showTitleOnTruncate = true,
}: FieldProps<T>) {
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

type PatientSummaryNamespace = typeof Root & {
  Root: typeof Root;
  Section: typeof Section;
  Icon: typeof Icon;
  Name: typeof Name;
  MRN: typeof MRN;
  Meta: typeof Meta;
  Actions: typeof Actions;
  Action: ActionComponentType;
  WorkflowButton: WorkflowButtonComponent;
  Patient: typeof Patient;
  Workflows: typeof Workflows;
  Empty: typeof Empty;
  Field: typeof Field;
};

export const PatientSummary: PatientSummaryNamespace = Object.assign(Root, {
  Root,
  Section,
  Icon,
  Name,
  MRN,
  Meta,
  Actions,
  Action,
  WorkflowButton,
  Patient,
  Workflows,
  Empty,
  Field,
});