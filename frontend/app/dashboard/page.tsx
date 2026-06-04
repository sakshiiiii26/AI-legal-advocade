import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, Advocate. Here's your legal operations overview.</p>
      </div>

      {/* Overview Cards */}
      <div className="mb-8">
        <OverviewCards />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <ActivityTimeline />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
