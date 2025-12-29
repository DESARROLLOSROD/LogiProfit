import React from 'react';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);

    // Mostrar toast al usuario
    toast.error('Ocurrió un error inesperado. Por favor, intenta recargar la página.');

    // Aquí podrías enviar el error a un servicio de logging
    // como Sentry, LogRocket, etc.
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
              Algo salió mal
            </h2>

            <p className="text-gray-600 text-center mb-6">
              La aplicación encontró un error inesperado.
              {' '}Por favor, intenta recargar la página.
            </p>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <div className="mb-6">
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-700 font-medium mb-2">
                    Detalles del error (desarrollo)
                  </summary>
                  <div className="bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    <pre className="text-xs text-red-600 whitespace-pre-wrap">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Ir al inicio
              </button>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500">
              Si el problema persiste, contacta a soporte
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}