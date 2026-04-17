import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || '未知错误';
      try {
        if (errorMessage.startsWith('{')) {
           const parsed = JSON.parse(errorMessage);
           if (parsed.error) {
             errorMessage = parsed.error;
           }
        }
      } catch (e) {
        // ignore
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center">
            <div className="text-5xl mb-4">🚨</div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">哎呀！出错了</h1>
            <p className="text-slate-500 mb-6">程序遇到了一些问题导致崩溃：</p>
            <div className="p-4 bg-red-100 text-red-600 rounded-2xl text-left font-mono text-sm break-words overflow-auto">
              {errorMessage}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 px-8 py-3 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 active:scale-95 transition-all"
            >
              刷新页面重试
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

