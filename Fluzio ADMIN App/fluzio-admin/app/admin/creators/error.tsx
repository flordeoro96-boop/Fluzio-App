'use client';

export default function CreatorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-4">Creators Page Error</h2>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-red-800">Error Message:</p>
            <p className="text-red-700 font-mono text-sm">{error.message}</p>
          </div>
          {error.digest && (
            <div>
              <p className="font-semibold text-red-800">Error Digest:</p>
              <p className="text-red-700 font-mono text-sm">{error.digest}</p>
            </div>
          )}
          {error.stack && (
            <div>
              <p className="font-semibold text-red-800">Stack Trace:</p>
              <pre className="text-red-700 font-mono text-xs overflow-auto bg-red-100 p-2 rounded max-h-96">
                {error.stack}
              </pre>
            </div>
          )}
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
