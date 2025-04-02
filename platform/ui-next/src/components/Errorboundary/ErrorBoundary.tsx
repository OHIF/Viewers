import React, { useState, useEffect } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '../Dialog/Dialog';
import { ScrollArea } from '../ScrollArea/ScrollArea';
import { Button } from '../Button/Button';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Parses an error stack trace to extract important information
 */
const parseErrorStack = (error: ErrorBoundaryError) => {
  if (!error.stack) {
    return { filePath: null, errorTitle: null, code: null };
  }

  const stack = error.stack;
  const lines = stack.split('\n');

  // Extract error message and first call site
  const errorMessage = lines[0].trim();

  return {
    errorTitle: errorMessage,
    code: stack,
  };
};

interface ErrorBoundaryError extends Error {
  message: string;
  stack?: string;
}

interface DefaultFallbackProps {
  error: ErrorBoundaryError;
  context: string;
  resetErrorBoundary: () => void;
}

interface ErrorBoundaryProps {
  context?: string;
  onReset?: () => void;
  onError?: (error: ErrorBoundaryError, componentStack: string, context: string) => void;
  fallbackComponent?: React.ComponentType<DefaultFallbackProps>;
  children: React.ReactNode;
  fallbackRoute?: string | null;
  isPage?: boolean;
}

const DefaultFallback = ({
  error,
  context,
  resetErrorBoundary = () => {},
}: DefaultFallbackProps) => {
  const { t } = useTranslation('ErrorBoundary');
  const [showDetails, setShowDetails] = useState(false);
  const title = `${t('Something went wrong')}${!isProduction && ` ${t('in')} ${context}`}.`;
  const subtitle = t('Sorry, something went wrong there. Try again.');

  const { filePath, errorTitle, errorMessage, callSites, code } = parseErrorStack(error);

  useEffect(() => {
    toast.error(title, {
      description: subtitle,
      action: {
        label: t('Show Details'),
        onClick: () => setShowDetails(true),
      },
      duration: 0,
    });
  }, [error, subtitle, t, title]);

  if (isProduction) {
    return null;
  }

  const handleCopy = () => {
    if (filePath) {
      navigator.clipboard.writeText(filePath);
      toast.success(t('Copied to clipboard'));
    }
  };

  return (
    <Dialog
      open={showDetails}
      onOpenChange={setShowDetails}
    >
      <DialogContent
        className="bg-muted max-w-3xl overflow-hidden border-0 p-0"
        onInteractOutside={e => e.preventDefault()}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-highlight text-xl font-normal">
              {errorTitle || error.message || title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(false)}
              className="0 h-8 w-8 rounded-full"
            ></Button>
          </div>
        </div>

        {/* Code block */}
        {code && (
          <div className="text-foreground px-6 pb-4">
            <ScrollArea className="bg-background h-[200px] overflow-hidden rounded-md">
              <div className="p-4 font-mono text-sm">
                {code.split('\n').map((line, index) => (
                  <div
                    key={index}
                    className="flex"
                  >
                    <span className="w-8 pr-4 text-right">{index + 1}</span>
                    <span className="flex-1">{line}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end p-6 pt-2">
          <Button
            variant="link"
            className="text-primary p-0"
          >
            Report Issue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ErrorBoundary = ({
  context = 'OHIF',
  onReset = () => {},
  onError = () => {},
  fallbackComponent: FallbackComponent = DefaultFallback,
  children,
  fallbackRoute = null,
  isPage,
}: ErrorBoundaryProps) => {
  const [error, setError] = useState<ErrorBoundaryError | null>(null);

  const onResetHandler = () => {
    setError(null);
    onReset();
  };

  // Add error event listener to window
  useEffect(() => {
    let errorTimeout: NodeJS.Timeout;

    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      clearTimeout(errorTimeout);
      errorTimeout = setTimeout(() => {
        setError(event.error);
        onErrorHandler(event.error, null);
      }, 100);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      clearTimeout(errorTimeout);
      errorTimeout = setTimeout(() => {
        setError(event.reason);
        onErrorHandler(event.reason, null);
      }, 100);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      clearTimeout(errorTimeout);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const onErrorHandler = (error: ErrorBoundaryError, componentStack: string | null) => {
    console.debug(`${context} Error Boundary`, error, componentStack, context);
    onError(error, componentStack || '', context);
  };

  return (
    <ReactErrorBoundary
      fallbackRender={props => (
        <FallbackComponent
          error={props.error}
          context={context}
          resetErrorBoundary={props.resetErrorBoundary}
        />
      )}
      onReset={onResetHandler}
      onError={(error, info) => onErrorHandler(error as ErrorBoundaryError, info.componentStack)}
    >
      <>
        {children}
        {error && (
          <FallbackComponent
            error={error}
            context={context}
            resetErrorBoundary={() => setError(null)}
          />
        )}
      </>
    </ReactErrorBoundary>
  );
};

export { ErrorBoundary };
