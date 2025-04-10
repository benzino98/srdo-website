import React from "react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="text-center py-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        Error Loading Data
      </h2>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-800 mb-2">{message}</p>
        <p className="text-gray-700 text-sm">
          This could be due to the API server being unavailable or a network
          issue.
        </p>
      </div>

      {onRetry && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMessage;
