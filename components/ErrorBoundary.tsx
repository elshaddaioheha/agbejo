'use client'; // This is a client component because it uses state and lifecycle methods

import React, { Component, ReactNode } from 'react';

// Define the types for the component's props and state for type safety
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  // Initialize the component's state
  public state: State = {
    hasError: false,
    error: null,
  };

  // This special lifecycle method is called when an error is thrown by a child component.
  // It should return a new state object.
  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error: error };
  }

  // This lifecycle method is called after an error has been thrown by a descendant component.
  // It's a good place to log the error to an external service.
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  // The render method determines what to display.
  public render() {
    // If an error has occurred, render the fallback UI
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unknown error occurred.';
      return (
        <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h2 className="text-2xl font-bold">Something went wrong.</h2>
          <p className="mt-2">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    // If there's no error, render the children components as normal
    return this.props.children;
  }
}

export default ErrorBoundary;