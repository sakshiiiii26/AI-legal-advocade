"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Loader } from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";

interface AnalyticsData {
  total_cases: number;
  open_cases: number;
  high_risk_cases: number;
  tasks_by_status?: Record<string, number>;
}

export function OverviewCards() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analytics`, {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const analyticsData = await response.json();
          setData(analyticsData);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-20">
                <Loader className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completedCases = (data?.total_cases || 0) - (data?.open_cases || 0);
  const successRate =
    data && data.total_cases > 0
      ? Math.round(((data.total_cases - data.open_cases) / data.total_cases) * 100)
      : 0;

  const stats = [
    {
      title: "Active Cases",
      value: data?.open_cases || 0,
      change: `${data?.total_cases || 0} total`,
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "High Risk Cases",
      value: data?.high_risk_cases || 0,
      change: "Require attention",
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Completed Cases",
      value: completedCases,
      change: `${successRate}% success rate`,
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Pending Tasks",
      value: (data?.tasks_by_status?.["Open"] || 0) + (data?.tasks_by_status?.["In Progress"] || 0),
      change: "In progress or waiting",
      icon: <Clock className="w-5 h-5 text-orange-500" />,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className={`${stat.bgColor} p-3 rounded-lg w-fit mb-4`}>
              {stat.icon}
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
