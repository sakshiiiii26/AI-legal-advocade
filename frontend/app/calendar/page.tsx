"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, CheckCircle2, Circle, Loader, AlertCircle, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  case_id?: number;
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", due_date: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await apiFetch("/tasks");
      setTasks(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;
    
    setIsSubmitting(true);
    try {
      const createdTask = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || undefined,
          due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : undefined,
          status: "Open"
        })
      });
      setTasks(prev => [createdTask, ...prev]);
      setNewTask({ title: "", description: "", due_date: "" });
      setShowAddForm(false);
      import("sonner").then(({ toast }) => toast.success("Task created"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      import("sonner").then(({ toast }) => toast.error(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "Completed" ? "Open" : "Completed";
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      await apiFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: task.title,
          status: newStatus
        })
      });
    } catch (err) {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      import("sonner").then(({ toast }) => toast.error("Failed to update task"));
    }
  };

  const upcomingTasks = tasks.filter(t => t.status !== "Completed");
  const completedTasks = tasks.filter(t => t.status === "Completed");

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar & Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your legal tasks and deadlines
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>
      
      {showAddForm && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Task Title *</label>
                  <Input 
                    value={newTask.title} 
                    onChange={e => setNewTask({...newTask, title: e.target.value})} 
                    placeholder="E.g. Draft response" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <Input 
                    type="date"
                    value={newTask.due_date} 
                    onChange={e => setNewTask({...newTask, due_date: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newTask.description} 
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" 
                  rows={3} 
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" disabled={!newTask.title || isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSubmitting ? "Saving..." : "Save Task"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Tasks</h2>
              {upcomingTasks.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-gray-500">No upcoming tasks.</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <Card key={task.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4 flex items-start gap-4">
                        <button onClick={() => toggleTaskStatus(task)} className="mt-1 flex-shrink-0 text-gray-400 hover:text-green-500 transition-colors">
                          <Circle className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Completed</h2>
                <div className="space-y-3 opacity-70">
                  {completedTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4 flex items-start gap-4">
                        <button onClick={() => toggleTaskStatus(task)} className="mt-1 flex-shrink-0 text-green-500 hover:text-gray-400 transition-colors">
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white line-through">{task.title}</h3>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Total Tasks</span>
                  <span className="font-bold">{tasks.length}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Pending</span>
                  <span className="font-bold text-blue-600">{upcomingTasks.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="font-bold text-green-600">{completedTasks.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
