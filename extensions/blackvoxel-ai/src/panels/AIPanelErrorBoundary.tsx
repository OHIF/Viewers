import React from 'react';

interface AIPanelErrorBoundaryProps {
  children: React.ReactNode;
}

interface AIPanelErrorBoundaryState {
  hasError: boolean;
}

/**
 * Contains any crash inside the AI panel so it can never take down the
 * viewer shell (MIMPS-24). Renders a PT error card and logs the error.
 */
class AIPanelErrorBoundary extends React.Component<
  AIPanelErrorBoundaryProps,
  AIPanelErrorBoundaryState
> {
  constructor(props: AIPanelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AIPanelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[blackvoxel-ai] panel crashed:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-black p-6 text-center">
          <span
            className="text-2xl"
            aria-hidden="true"
          >
            ⚠
          </span>
          <p className="m-0 text-[13px] font-semibold text-white">
            O painel de IA encontrou um erro.
          </p>
          <p className="m-0 text-[11px] leading-relaxed text-[#A0ADB4]">
            O visualizador continua funcionando normalmente. Feche e reabra o painel para tentar
            novamente.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AIPanelErrorBoundary;
