export default function Loading() {
  return (
    <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading LexAI...</p>
      </div>
    </div>
  );
}
