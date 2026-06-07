"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  MessageSquare,
  Users,
  Calendar,
  BarChart3,
  Zap,
  Settings,
  ChevronDown,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavIcon {
  icon: React.ReactNode;
  label: string;
  href?: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavIcon[];
}

const navGroups: NavGroup[] = [
  {
    title: "Core",
    items: [
      {
        icon: <LayoutDashboard className="w-5 h-5" />,
        label: "Dashboard",
        href: "/dashboard",
      },
    ],
  },
  {
    title: "Case Intelligence",
    items: [
      {
        icon: <Briefcase className="w-5 h-5" />,
        label: "Cases",
        href: "/cases",
      },
      {
        icon: <FileText className="w-5 h-5" />,
        label: "Document AI",
        href: "/documents",
      },
    ],
  },
  {
    title: "Collaboration",
    items: [
      {
        icon: <MessageSquare className="w-5 h-5" />,
        label: "AI Assistant",
        href: "/chat",
      },
      {
        icon: <Users className="w-5 h-5" />,
        label: "Clients",
        href: "/clients",
      },
      {
        icon: <Calendar className="w-5 h-5" />,
        label: "Calendar & Tasks",
        href: "/calendar",
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        icon: <BarChart3 className="w-5 h-5" />,
        label: "Analytics",
        href: "/analytics",
      },
      {
        icon: <Zap className="w-5 h-5" />,
        label: "Integrations",
        href: "/integrations",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        icon: <Settings className="w-5 h-5" />,
        label: "Settings",
        href: "/settings",
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Core", "Case Intelligence"]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">⚖️</span>
          </div>
          <h1 className="font-bold text-lg text-gray-900 dark:text-white">LexAI</h1>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 -mr-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen overflow-y-auto flex flex-col transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">⚖️</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">LexAI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Legal OS</p>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="px-4 py-3">
        <Link href="/cases?new=true">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Case</span>
          </button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navGroups.map((group) => (
          <div key={group.title}>
            <button
              onClick={() => toggleGroup(group.title)}
              className="w-full px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 uppercase tracking-wider flex items-center justify-between transition-colors"
            >
              {group.title}
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  expandedGroups.includes(group.title) ? "rotate-180" : ""
                )}
              />
            </button>

            {expandedGroups.includes(group.title) && (
              <div className="space-y-1 mt-2">
                {group.items.map((item) => (
                  <Link key={item.label} href={item.href || "#"}>
                    <button
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors",
                        pathname === item.href
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>⚠️ Disclaimer:</strong> AI-assisted insights only. Not a substitute for legal advice.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
