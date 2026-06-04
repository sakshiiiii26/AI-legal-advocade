"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Lock, User, Loader } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiFetch("/me");
      setProfile({ name: data.name, email: data.email });
    } catch (err) {
      // handled globally
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await apiFetch("/me", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      import("sonner").then(({ toast }) => toast.success("Profile updated successfully"));
    } catch (err) {
      // handled globally
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      import("sonner").then(({ toast }) => toast.error("New passwords do not match"));
      return;
    }
    
    setIsSavingPassword(true);
    try {
      await apiFetch("/me/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: passwords.current,
          new_password: passwords.newPass
        }),
      });
      import("sonner").then(({ toast }) => toast.success("Password updated successfully"));
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      // handled globally
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <CardTitle>Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Full Name
                </label>
                <Input 
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Email
                </label>
                <Input 
                  type="email" 
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={isSavingProfile} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Current Password
                </label>
                <Input 
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  New Password
                </label>
                <Input 
                  type="password"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Confirm Password
                </label>
                <Input 
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" disabled={isSavingPassword} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSavingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Email notifications", checked: true },
              { label: "Case updates", checked: true },
              { label: "Hearing reminders", checked: true },
            ].map((item, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input type="checkbox" defaultChecked={item.checked} className="rounded border-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
