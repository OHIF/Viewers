import React, { useState, useEffect } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '../Dialog/Dialog';
import { ScrollArea } from '../ScrollArea/ScrollArea';
import { Button } from '../Button/Button';
import { Copy } from 'lucide-react';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Parses an error stack trace to extract important information
 * Extracts the first function name from the stack trace
 */
const parseErrorStack = (error: ErrorBoundaryError) => {
  if (!error.stack) {
    return { filePath: null, errorTitle: null, code: null, firstFilename: null };
  }

  const stack = error.stack;
  const stackLines = stack.split('\n');

  // Extract error message from first line
  const errorMessage = stackLines[0].trim();

  // Extract first function name from the stack trace
  let firstFilename = null;

  // Find the first stack line (starts with " at ")
  for (let i = 1; i < stackLines.length; i++) {
    const line = stackLines[i].trim();
    if (line.startsWith('at ')) {
      // Extract function name pattern
      const match = line.match(/at\s+([^\s(]+)[\s(]/);
      if (match && match[1]) {
        firstFilename = match[1];
        break;
      }
    }
  }

  // Sanitize stack trace for display
  const sanitizedStack = stackLines
    .map(line => {
      return line
        .replace(/\(([^)]+)\)/g, (match, path) => {
          const filename = path.split(/[\/\\]/).pop(); // Extract filename from path
          return filename ? `(${filename})` : match;
        })
        .replace(/(\s+at\s+[^\s(]+\s+)([^\s(]+:[0-9]+:[0-9]+)/g, (match, prefix, path) => {
          const filename = path.split(/[\/\\]/).pop(); // Extract filename from path
          return filename ? `${prefix}${filename}` : match;
        });
    })
    .join('\n');

  return {
    errorTitle: errorMessage,
    code: sanitizedStack,
    firstFilename: firstFilename,
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

  const { errorTitle, code, firstFilename } = parseErrorStack(error);

  const copyErrorToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success(t('Error copied to clipboard'));
    }
  };

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

  return (
    <Dialog
      open={showDetails}
      onOpenChange={setShowDetails}
    >
      <DialogContent
        className="bg-muted max-w-3xl overflow-hidden border-0 p-0"
        onInteractOutside={e => e.preventDefault()}
      >
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-highlight text-xl font-normal">
              {errorTitle || error.message || title}
            </h2>
          </div>
        </div>

        {/* Code block */}
        {code && (
          <>
            <ScrollArea className="bg-background text-foreground mx-6 h-[321px] rounded-b-md">
              <div className="bg-background border-input flex items-center justify-between rounded-t-md border-b px-4 py-2">
                <div className="text-muted-foreground text-base">
                  {firstFilename || 'Error Stack'}
                </div>
                <Button
                  className="w-20"
                  onClick={copyErrorToClipboard}
                  title={t('Copy error')}
                >
                  Copy
                </Button>
              </div>
              <div className="p-4 font-mono text-sm">
                {code.split('\n').map((line, index) => (
                  <div
                    key={index}
                    className="flex"
                  >
                    <span className="whitespace-pre">{line}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end p-6 pt-2">
          <Button
            variant="link"
            className="text-primary p-0"
            onClick={() =>
              window.open(
                'https://github.com/OHIF/Viewers/issues/new?template=bug-report.yml',
                '_blank'
              )
            }
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
