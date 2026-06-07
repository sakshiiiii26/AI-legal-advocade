"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Lock, Share2 } from "lucide-react";

const integrations = [
  {
    id: 1,
    name: "Email Integration",
    description: "Sync emails to case conversations",
    icon: Mail,
    status: "Connected",
    connected: true,
  },
  {
    id: 2,
    name: "E-Signature",
    description: "DocuSign integration for document signing",
    icon: Share2,
    status: "Not Connected",
    connected: false,
  },
  {
    id: 3,
    name: "Document Security",
    description: "Blockchain verification for documents",
    icon: Lock,
    status: "Connected",
    connected: true,
  },
];

export default function IntegrationsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Connect external tools to enhance your workflow
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {integrations.map((integration) => {
          const IconComponent = integration.icon;
          return (
            <Card key={integration.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium ${
                        integration.connected
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {integration.connected && <CheckCircle2 className="w-4 h-4" />}
                      {integration.status}
                    </div>
                    <Button variant="outline" size="sm">
                      {integration.connected ? "Manage" : "Connect"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
