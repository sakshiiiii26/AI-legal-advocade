"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, AlertCircle, CheckCircle2, Briefcase, CheckSquare, Loader } from "lucide-react";
import { apiFetch } from "@/lib/api";

function formatTimeAgo(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function getIconForType(type: string) {
  switch (type) {
    case "document": return { icon: FileText, color: "text-blue-500" };
    case "case": return { icon: Briefcase, color: "text-purple-500" };
    case "task": return { icon: CheckSquare, color: "text-orange-500" };
    case "alert": return { icon: AlertCircle, color: "text-red-500" };
    default: return { icon: CheckCircle2, color: "text-green-500" };
  }
}

export function ActivityTimeline() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/analytics/activity")
      .then(data => setActivities(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center p-8 text-gray-500">No recent activity</div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, idx) => {
              const { icon: IconComponent, color } = getIconForType(activity.type);
              return (
                <div key={activity.id} className="flex gap-4">
                  <div className="relative">
                    <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    {idx !== activities.length - 1 && (
                      <div className="absolute left-1/2 top-10 w-0.5 h-8 bg-gray-200 dark:bg-gray-700 -translate-x-1/2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {formatTimeAgo(activity.time)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
