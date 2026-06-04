"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg m-6 border border-gray-200 dark:border-gray-800">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 text-red-600 dark:text-red-400">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        An unexpected error occurred while rendering this page. The application could not recover automatically.
      </p>
      
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 p-4 rounded-md mb-8 w-full max-w-md overflow-auto text-sm text-red-800 dark:text-red-300">
        {error.message || "Unknown error"}
      </div>

      <div className="flex gap-4">
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
        <Button onClick={() => reset()} className="bg-blue-600 hover:bg-blue-700 text-white">
          Try Again
        </Button>
      </div>
    </div>
  );
}
