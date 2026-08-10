export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Village AI Nexus
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Project Foundation Established
          </p>
        </div>
        <div className="mt-8">
          <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Frontend shell initialized successfully.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
