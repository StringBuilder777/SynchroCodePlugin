import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-red-900/20 text-red-400 border border-red-800 rounded-lg max-w-lg w-full text-left shadow-xl">
            <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span className="text-xl">💥</span> Something went wrong
            </h2>
            <p className="text-sm mb-4">La interfaz ha crasheado. Aquí tienes los detalles técnicos:</p>
            <pre className="text-xs whitespace-pre-wrap bg-zinc-950 p-3 rounded border border-zinc-800 font-mono overflow-auto max-h-40">{this.state.error?.message}</pre>
            <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap mt-3 overflow-auto max-h-40">{this.state.error?.stack}</pre>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-200 text-xs font-bold transition-all w-full"
            >
              Intentar Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
