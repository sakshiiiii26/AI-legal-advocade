"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AnalyticsData {
  total_cases: number;
  open_cases: number;
  high_risk_cases: number;
  tasks_by_status: Record<string, number>;
  recent_documents: Array<{ id: number; file_name: string; uploaded_at: string }>;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const analyticsData = await apiFetch("/analytics");
        setData(analyticsData);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const successRate = data.total_cases > 0 ? Math.round((data.open_cases / data.total_cases) * 100) : 0;
  const closedCases = data.total_cases - data.open_cases;
  
  const caseOutcomes = [
    { name: 'Open', value: data.open_cases },
    { name: 'Closed', value: closedCases },
    { name: 'High Risk', value: data.high_risk_cases },
  ];

  const taskStatusData = Object.entries(data.tasks_by_status).map(([status, count]) => ({
    name: status,
    tasks: count,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Legal case trends and performance metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Cases</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.total_cases}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">All-time cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Open Cases</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.open_cases}</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">High Risk Cases</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{data.high_risk_cases}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Closed Cases</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{closedCases}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {caseOutcomes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={caseOutcomes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {caseOutcomes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-400 py-12">No case data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {taskStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taskStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-400 py-12">No task data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_documents.length > 0 ? (
            <div className="space-y-2">
              {data.recent_documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.file_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-6">No recent documents</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
 
