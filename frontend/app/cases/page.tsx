"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, MoreVertical, Clock, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { API_BASE_URL, getAuthHeaders, apiFetch } from "@/lib/api";

interface Case {
  id: number;
  title: string;
  description: string;
  status: string;
  risk_level: string;
  created_at: string;
  updated_at: string;
  summary?: string;
  case_number?: string;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "High":
      return "text-red-600 bg-red-50 dark:bg-red-900/20";
    case "Medium":
      return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
    case "Low":
      return "text-green-600 bg-green-50 dark:bg-green-900/20";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getStatusIcon = (status: string) => {
  if (status === "Active") return <Clock className="w-4 h-4" />;
  if (status === "Closed") return <CheckCircle2 className="w-4 h-4" />;
  return <AlertCircle className="w-4 h-4" />;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await apiFetch("/cases");
        setCases(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error fetching cases:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, []);

  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cases</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and analyze your legal cases
          </p>
        </div>
        <Link href="/cases/new">
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search cases by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading cases...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="py-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Cases Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4">
          {filteredCases.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📁</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No cases found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search or create a new case.
                </p>
                <Link href="/cases/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Case
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredCases.map((caseItem) => (
              <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {caseItem.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {caseItem.description}
                        </p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Status</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={caseItem.status === "Active" ? "text-blue-600" : "text-green-600"}>
                            {getStatusIcon(caseItem.status)}
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">{caseItem.status}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Risk</p>
                        <p className={`font-medium px-2 py-1 rounded text-xs w-fit mt-1 ${getRiskColor(caseItem.risk_level)}`}>
                          {caseItem.risk_level}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Case #</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {caseItem.case_number || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Updated</p>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {formatDate(caseItem.updated_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
