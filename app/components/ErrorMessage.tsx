/**
 * ErrorMessage Component
 * Consistent error display pattern
 */

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ 
  title = "Something went wrong",
  message, 
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className="backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="text-lg font-semibold text-red-400 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
