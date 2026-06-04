"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Phone, MapPin, Loader, AlertCircle, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  created_at: string;
}

interface ClientWithCases extends Client {
  caseCount: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithCases[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await apiFetch("/clients");

      // TODO: In future, fetch case count per client from /cases
      const clientsWithCases = data.map((c: Client) => ({
        ...c,
        caseCount: 0,
      }));
      setClients(clientsWithCases);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newClient = await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setClients((prev) => [{ ...newClient, caseCount: 0 }, ...prev]);
      setFormData({ name: "", email: "", phone: "", company: "" });
      setShowAddForm(false);
      import("sonner").then(({ toast }) => toast.success("Client added successfully"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: number, hard: boolean) => {
    if (!confirm(`Are you sure you want to ${hard ? "HARD DELETE (permanently remove)" : "soft delete"} this client?`)) return;
    
    try {
      await apiFetch(`/clients/${id}?hard=${hard}`, {
        method: "DELETE",
      });
      fetchClients();
      import("sonner").then(({ toast }) => toast.success(`Client ${hard ? "permanently deleted" : "archived"}`));
    } catch (err) {
      // error handled globally
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage client relationships and communications
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 gap-2 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Client Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Phone (Optional)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  placeholder="Company (Optional)"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting || !formData.name || !formData.email}
                >
                  {isSubmitting ? "Creating..." : "Create Client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Input
          placeholder="Search clients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading clients...</span>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Error</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Clients Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">No clients found</p>
              </CardContent>
            </Card>
          ) : (
             filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {client.name}
                      </h3>
                      {client.company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {client.company}
                        </p>
                      )}

                      <div className="flex flex-col gap-2 mt-3 text-sm">
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </a>
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {client.caseCount}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {client.caseCount === 1 ? "case" : "cases"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClient(client.id, false)}>
                          Archive
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteClient(client.id, true)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
