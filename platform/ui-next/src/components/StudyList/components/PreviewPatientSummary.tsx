/**
 * PreviewPatientSummary — compound component for patient header + workflow actions
 *
 * What it is
 * - A small set of primitives composed under a root provider: Patient, Workflows, Title, Subtitle, Meta, Actions, Action, Field, Section, Icon.
 * - All subcomponents read `data` from the nearest <PreviewPatientSummary> via context.
 *
 * Minimal usage
 *   <PreviewPatientSummary data={row}>
 *     <PreviewPatientSummary.Patient />
 *     <PreviewPatientSummary.Workflows />
 *   </PreviewPatientSummary>
 *
 * Adapting data shapes
 * - Use `get` on the root to map custom fields:
 *   <PreviewPatientSummary data={row} get={{ title: r => r.displayName, subtitle: r => r.patientId }}>
 *
 * Default workflow behavior
 * - Workflows component automatically uses WorkflowsProvider context.
 * - Shows default workflow badge and allows clearing it.
 * - Renders buttons for other available workflows.
 *
 * Helpful references
 * - platform/ui-next/src/components/StudyList/components/PreviewContent.tsx (in-context example, including empty state handling)
 */
import * as React from 'react';
import type { ElementType } from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { cn } from '../../../lib/utils';
import { Icons } from '../../Icons/Icons';
import { Button } from '../../Button';
import type { StudyRow } from '../types/types';
import { useWorkflows } from './WorkflowsProvider';

/** Public getters to adapt arbitrary data shapes to the PreviewPatientSummary defaults */
export type PreviewPatientSummaryGetters<T> = {
  title?: (data: T) => React.ReactNode;
  subtitle?: (data: T) => React.ReactNode;
};

type ResolvedGetters<T> = {
  title: (data: T) => React.ReactNode;
  subtitle: (data: T) => React.ReactNode;
};

type SummaryContextValue<T> = {
  data: T | null;
  get: ResolvedGetters<T>;
};

const SummaryContext = React.createContext<SummaryContextValue<unknown> | null>(null);

function useSummaryContext<T>() {
  const context = React.useContext(SummaryContext);
  if (!context) {
    throw new Error(
      'PreviewPatientSummary.* components must be used within <PreviewPatientSummary>'
    );
  }
  return context as SummaryContextValue<T>;
}

type RootProps<T = any> = {
  data?: T | null;
  get?: PreviewPatientSummaryGetters<T>;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Root context provider for PreviewPatientSummary compound components.
 *
 * Use `get` to adapt arbitrary data shapes (e.g., map `displayName` → name, `patientId` → mrn).
 */
function Root<T = any>({ data: dataProp, get, className, children }: RootProps<T>) {
  const data = dataProp ?? null;

  const resolvedGetters = React.useMemo<ResolvedGetters<T>>(
    () => ({
      title: get?.title ?? ((item: T) => ((item as any)?.patientName ?? '') as React.ReactNode),
      subtitle: get?.subtitle ?? ((item: T) => ((item as any)?.mrn ?? '') as React.ReactNode),
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
Section.displayName = 'PreviewPatientSummarySection';

type IconProps = {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
  hideWhenEmpty?: boolean;
  children?: React.ReactNode;
};

function Icon({ src, alt = '', size = 33, className, hideWhenEmpty, children }: IconProps) {
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

type TitleProps<T = any> = {
  placeholder?: React.ReactNode;
  className?: string;
  children?: (value: React.ReactNode, data: T | null) => React.ReactNode;
  showTitleOnTruncate?: boolean;
};

function Title<T = any>({
  placeholder = 'Select a study',
  className,
  children,
  showTitleOnTruncate = true,
}: TitleProps<T>) {
  const { data, get } = useSummaryContext<T>();
  const value = data ? get.title(data) : null;
  const content = value ?? placeholder;
  const title =
    showTitleOnTruncate && (typeof value === 'string' || typeof value === 'number')
      ? String(value)
      : undefined;

  return (
    <span
      title={title}
      className={cn('text-foreground truncate text-lg font-medium leading-tight', className)}
    >
      {typeof children === 'function' ? children(content, data) : content}
    </span>
  );
}

type SubtitleProps<T = any> = {
  hideWhenEmpty?: boolean;
  prefix?: React.ReactNode;
  className?: string;
  children?: (value: React.ReactNode, data: T | null) => React.ReactNode;
  showTitleOnTruncate?: boolean;
};

function Subtitle<T = any>({
  hideWhenEmpty = true,
  prefix,
  className,
  children,
  showTitleOnTruncate = true,
}: SubtitleProps<T>) {
  const { data, get } = useSummaryContext<T>();
  const value = data ? get.subtitle(data) : null;

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
      className={cn('text-muted-foreground truncate text-lg leading-tight', className)}
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
Actions.displayName = 'PreviewPatientSummaryActions';

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

type ActionComponentType = <T = any>(
  props: ActionProps<T> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement | null;

const Action = React.forwardRef(ActionInner) as ActionComponentType;
Action.displayName = 'PreviewPatientSummaryAction';

type WorkflowButtonProps<T = any> = {
  label?: React.ReactNode;
  onClick?: (data: T) => void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  iconSize?: number;
} & Omit<React.HTMLAttributes<HTMLElement>, 'onClick'>;

const WorkflowButtonInner = <T = any,>(
  {
    label = 'Launch workflow',
    onClick,
    disabled,
    disabledReason,
    className,
    icon = <Icons.Info />,
    iconPosition = 'end',
    iconSize = 18,
    style,
    ...rest
  }: WorkflowButtonProps<T>,
  ref: React.ForwardedRef<HTMLElement>
) => {
  const { data } = useSummaryContext<T>();
  const workflowContext = useWorkflows();
  const computedDisabled = disabled ?? false;
  const id = React.useId();
  const reasonId = `${id}-reason`;

  // Get workflows for the current study (or all workflows if no study)
  const studyRow = data as StudyRow | null;
  const availableWorkflows = React.useMemo(() => {
    if (studyRow) {
      return workflowContext.getWorkflowsForStudy(studyRow);
    }
    return workflowContext.workflows;
  }, [studyRow, workflowContext]);

  const defaultWorkflow = React.useMemo(() => {
    if (studyRow) {
      return workflowContext.getDefaultWorkflowForStudy(studyRow);
    }
    return workflowContext.workflows.find(w => w.isDefault);
  }, [studyRow, workflowContext]);

  const workflowButtons = React.useMemo(() => {
    return availableWorkflows.map(w => w.displayName);
  }, [availableWorkflows]);

  const hasDefault = !!defaultWorkflow;
  const filteredWorkflows = React.useMemo(() => {
    if (!hasDefault) {
      return workflowButtons;
    }
    return workflowButtons.filter(wf => wf !== defaultWorkflow.displayName);
  }, [workflowButtons, hasDefault, defaultWorkflow]);

  const handleLaunch = (wfDisplayName: string) => {
    if (computedDisabled || !data) {
      return;
    }
    const wf = availableWorkflows.find(w => w.displayName === wfDisplayName);
    if (wf && studyRow) {
      wf.launchWithStudy(studyRow);
    }
    onClick?.(data);
  };

  const handleDefaultModeChange = () => {
    workflowContext.setDefaultWorkflowId();
  };

  const iconNode = icon ? (
    <span
      className="text-primary shrink-0 -translate-y-0.5"
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

  const renderDefaultWorkflow = (labelValue: string) => (
    <div
      className="mt-2 flex flex-wrap items-center gap-0"
      role="status"
      aria-live="polite"
    >
      <Button
        variant="ghost"
        size="sm"
        className="bg-primary/20 text-primary ring-primary ring-offset-background ml-1 mb-1 h-6 w-32 ring-1 ring-offset-2"
        disabled={computedDisabled}
        onClick={() => handleLaunch(labelValue)}
      >
        {labelValue}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Clear default mode"
        className="text-primary focus-visible:ring-ring focus-visible:ring-offset-background ml-1.5 mb-1 opacity-70 transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={handleDefaultModeChange}
      >
        <Cross2Icon
          className="text-primary h-3.5 w-3.5"
          aria-hidden
        />
        <span className="sr-only">Clear default mode</span>
      </Button>
    </div>
  );

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

      {/* Default workflow badge + other workflows */}
      {hasDefault && renderDefaultWorkflow(defaultWorkflow.displayName)}
      {hasDefault && data && filteredWorkflows.length > 0 && (
        <div className="text-muted-foreground mt-2 text-sm">Other Available Workflows</div>
      )}
      {data && filteredWorkflows.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-0">
          {filteredWorkflows.map(wf => (
            <Button
              key={wf}
              variant="ghost"
              size="sm"
              className="bg-primary/20 ml-1 mb-1 h-6 w-32"
              disabled={computedDisabled}
              onClick={() => handleLaunch(wf)}
            >
              {wf}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

type WorkflowButtonComponent = <T = any>(
  props: WorkflowButtonProps<T> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement | null;

const WorkflowButton = React.forwardRef(WorkflowButtonInner) as WorkflowButtonComponent;
WorkflowButton.displayName = 'PreviewPatientSummaryWorkflowButton';

type PatientProps = {
  placeholder?: React.ReactNode;
  className?: string;
  hideIcon?: boolean;
  hideTitle?: boolean;
  hideSubtitle?: boolean;
  icon?: React.ReactNode;
  align?: SectionProps['align'];
  gap?: number;
  variant?: SectionProps['variant'];
};

function Patient({
  placeholder = 'Select a study',
  className,
  hideIcon,
  hideTitle,
  hideSubtitle,
  icon,
  align,
  gap,
  variant,
}: PatientProps) {
  return (
    <Section
      className={className}
      align={align}
      gap={gap}
      variant={variant}
    >
      {!hideIcon && (
        <Icon
          size={33}
          className="text-primary"
        >
          {icon ?? (
            <Icons.PatientStudyList
              width="100%"
              height="100%"
            />
          )}
        </Icon>
      )}
      <div className="flex h-[38px] min-w-0 flex-col justify-center gap-px">
        {!hideTitle && <Title placeholder={placeholder} />}
        {!hideSubtitle && <Subtitle />}
      </div>
    </Section>
  );
}

/**
 * Public API for the workflow picker.
 *
 * Usage:
 * - Must be used inside `<PreviewPatientSummary>` so it can read the current `data` from context.
 * - Must be used inside `<WorkflowsProvider>` to access workflow context.
 * - Automatically gets workflows for the current study and handles launching.
 * - Shows default workflow badge and allows clearing it.
 */
function Workflows<T = any>(props: WorkflowButtonProps<T>) {
  return <WorkflowButton<T> {...props} />;
}

type EmptyProps = {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  section?: SectionProps;
};

function Empty({ children, icon, section }: EmptyProps) {
  const { data } = useSummaryContext<unknown>();
  if (data) {
    return null;
  }

  return (
    <Section
      variant="card"
      {...section}
    >
      {icon ?? (
        <Icon
          size={33}
          className="text-primary"
        >
          <Icons.PatientStudyList
            width="100%"
            height="100%"
          />
        </Icon>
      )}
      <div className="flex h-[38px] items-center">
        <span className="text-muted-foreground text-base font-medium leading-tight">
          {children ?? 'Select a study'}
        </span>
      </div>
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

type PreviewPatientSummaryNamespace = typeof Root & {
  Section: typeof Section;
  Icon: typeof Icon;
  Title: typeof Title;
  Subtitle: typeof Subtitle;
  Meta: typeof Meta;
  Actions: typeof Actions;
  Action: ActionComponentType;
  Patient: typeof Patient;
  Workflows: typeof Workflows;
  Empty: typeof Empty;
  Field: typeof Field;
};

export const PreviewPatientSummary: PreviewPatientSummaryNamespace = Object.assign(Root, {
  Section,
  Icon,
  Title,
  Subtitle,
  Meta,
  Actions,
  Action,
  Patient,
  Workflows,
  Empty,
  Field,
});
