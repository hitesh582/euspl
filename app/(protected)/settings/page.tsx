"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Account and system settings</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 text-xl">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {user?.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-muted-foreground">System</span>
              <span className="font-medium text-sm">EUSPL Management System</span>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-muted-foreground">Work Hours Standard</span>
              <span className="font-medium text-sm">8 hours/day</span>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-muted-foreground">Duplicate Scan Prevention</span>
              <span className="font-medium text-sm">30-second cooldown</span>
            </div>
            <Separator />
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-muted-foreground">Auto-close Time</span>
              <span className="font-medium text-sm">10:00 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={logout} className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out of all sessions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
