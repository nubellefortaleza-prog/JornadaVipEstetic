// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary.tsx — Captura erros não tratados em componentes React
//
// Exibe uma tela amigável ao invés de quebrar o app inteiro.
// ─────────────────────────────────────────────────────────────────────────────

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[JornadaVip] Erro capturado:', error, errorInfo);

    // Em produção, enviar para serviço de monitoramento
    try {
      if (typeof window !== 'undefined' && (window as any).smartlook) {
        (window as any).smartlook('track', 'app_error', {
          message: error.message,
          stack: error.stack?.substring(0, 500),
          component: errorInfo.componentStack?.substring(0, 300),
        });
      }
    } catch (_) {
      // silencioso
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-[#1A1A1B] flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-[#AABAA4]/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#AABAA4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <div>
              <h2 className="text-white text-lg font-medium mb-2">
                Algo deu errado
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Pedimos desculpas pelo inconveniente. Tente novamente ou recarregue a pagina.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 bg-[#AABAA4] text-[#1A1A1B] rounded-xl font-medium hover:bg-[#AABAA4]/90 transition"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition"
              >
                Recarregar pagina
              </button>
            </div>

            {this.state.error && (
              <details className="text-left bg-white/5 rounded-lg p-3">
                <summary className="text-white/60 text-xs cursor-pointer">
                  Detalhes tecnicos
                </summary>
                <pre className="text-white/50 text-[11px] mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <p className="text-white/50 text-[11px] tracking-[0.3em] uppercase">
              VIP ESTETIC
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
