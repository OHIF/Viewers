import React, { useState, useEffect } from 'react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle } from '../Dialog/Dialog';
import { ScrollArea } from '../ScrollArea/ScrollArea';
import { Button } from '../Button/Button';
import { useNotification } from '../../contextProviders';

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

  // Sanitize stack trace for display - safer approach to avoid ReDoS
  const sanitizedStack = stackLines
    .map(line => {
      // Limit line length to prevent excessive processing
      const limitedLine = line.substring(0, 2000);

      // Process each part separately to avoid complex regex patterns
      if (limitedLine.includes('(')) {
        // Extract filename from paths in parentheses
        const openParenIndex = limitedLine.indexOf('(');
        const closeParenIndex = limitedLine.indexOf(')', openParenIndex);

        if (openParenIndex >= 0 && closeParenIndex > openParenIndex) {
          const pathInParens = limitedLine.substring(openParenIndex + 1, closeParenIndex);

          // Find the last segment after slash or backslash
          const lastSlashIndex = Math.max(
            pathInParens.lastIndexOf('/'),
            pathInParens.lastIndexOf('\\')
          );

          if (lastSlashIndex >= 0) {
            const filename = pathInParens.substring(lastSlashIndex + 1);
            return (
              limitedLine.substring(0, openParenIndex + 1) +
              filename +
              limitedLine.substring(closeParenIndex)
            );
          }
        }
      }

      // Handle the "at Function path:line:column" format
      if (limitedLine.includes(' at ')) {
        const atIndex = limitedLine.indexOf(' at ');
        const afterAt = limitedLine.substring(atIndex + 4).trim();

        // Split by whitespace to separate function and path
        const spaceAfterFunc = afterAt.indexOf(' ');

        if (spaceAfterFunc > 0) {
          const funcName = afterAt.substring(0, spaceAfterFunc);
          const path = afterAt.substring(spaceAfterFunc + 1);

          // Check if this is a path with line/column numbers
          if (path.includes(':') && /.*:[0-9]+:[0-9]+/.test(path)) {
            // Find the last segment after slash or backslash
            const lastSlashIndex = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

            if (lastSlashIndex >= 0) {
              const filename = path.substring(lastSlashIndex + 1);
              return limitedLine.substring(0, atIndex + 4) + funcName + ' ' + filename;
            }
          }
        }
      }

      return limitedLine;
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

interface DefaultFallbackProps extends FallbackProps {
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
  const { show } = useNotification();

  const title = `${t('Something went wrong')}${!isProduction && ` ${t('in')} ${context}`}.`;
  const subtitle = t('Sorry, something went wrong there. Try again.');

  const { errorTitle, code, firstFilename } = parseErrorStack(error);

  const copyErrorToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      show({
        title: t('Success'),
        message: t('Error copied to clipboard'),
        type: 'success',
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    // Use a stable ID based on error message to support deduplication
    const errorId = `error-${errorTitle || error.message}`;

    // We don't need to track shown state - instead rely on the notification deduplication system
    show({
      title,
      message: subtitle,
      type: 'error',
      duration: 0,
      id: errorId,
      action: {
        label: t('Show Details'),
        onClick: () => setShowDetails(true),
      },
    });
  }, [error, errorTitle, subtitle, t, title, show]);

  if (isProduction) {
    return null;
  }

  return (
    <Dialog
      open={showDetails}
      onOpenChange={setShowDetails}
    >
      <DialogTitle className="invisible">{errorTitle}</DialogTitle>
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
  onError = _error => {},
  fallbackComponent: FallbackComponent = DefaultFallback,
  children,
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
        setError(event.reason || event);
        onErrorHandler(event.reason || event, null);
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

  const onErrorHandler = (
    error: ErrorBoundaryError | ErrorEvent,
    componentStack: string | null
  ) => {
    console.debug(`${context} Error Boundary`, error, componentStack, context);
    onError(error, componentStack || '', context);
  };

  return (
    <ReactErrorBoundary
      fallbackRender={props => (
        <FallbackComponent
          {...props}
          context={context}
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
