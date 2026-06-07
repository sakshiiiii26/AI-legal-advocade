"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, FileText, MessageSquare } from "lucide-react";

const quickActions = [
  {
    title: "New Case",
    description: "Start a new case",
    icon: Plus,
    href: "/cases?new=true",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    title: "Upload Document",
    description: "Add case document",
    icon: Upload,
    href: "/documents",
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    title: "Generate Draft",
    description: "Create legal document",
    icon: FileText,
    href: "/drafting",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    title: "Ask AI Assistant",
    description: "Query legal AI",
    icon: MessageSquare,
    href: "/chat",
    color: "bg-orange-500 hover:bg-orange-600",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <button className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <div className={`${action.color} text-white w-fit p-2 rounded-lg mb-2 transition-colors`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white text-left">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                    {action.description}
                  </p>
                </button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
