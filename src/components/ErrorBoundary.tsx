import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Something went wrong.';
      let details = '';

      try {
        // Check if it's a Firestore JSON error
        const firestoreError = JSON.parse(this.state.error?.message || '');
        if (firestoreError.error) {
          errorMessage = 'Database permission error.';
          details = `Operation: ${firestoreError.operationType} on ${firestoreError.path}`;
        }
      } catch (e) {
        // Not a JSON error or other error
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <h2 className="text-2xl font-serif text-brand-dark mb-4">Oops!</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            {details && (
              <p className="text-xs text-gray-400 mb-6 font-mono">{details}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
