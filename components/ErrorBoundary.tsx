'use client';

import React, { Component, ReactNode } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unknown error occurred.';
      return (
        <div className="p-12 text-center bg-red-50 rounded-[32px] border border-red-100 max-w-2xl mx-auto my-12 shadow-xl shadow-red-500/5">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-3xl font-black text-red-900 tracking-tight">Something went wrong</h2>
          <p className="mt-4 text-red-700 font-medium text-lg leading-relaxed">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-10 px-8 py-4 bg-red-600 text-white font-black rounded-2xl flex items-center gap-3 mx-auto shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
          >
            <RotateCcw size={20} />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
