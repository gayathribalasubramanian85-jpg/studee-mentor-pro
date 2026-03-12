
import { useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CalendarClock, UserX, TrendingUp } from "lucide-react";
import authApi from "@/api/authApi";

export default function AdminRetests() {
  const currentUser = authApi.getCurrentUser();
  
  // Placeholder state - fully implementing retest logic requires complex backend changes
  // which are out of scope for the current "frontend integration" task without 
  // significant backend development first.
  const [stats] = useState({
    totalFailed: 0,
    pending: 0,
    scheduled: 0,
    completed: 0,
    passedRetest: 0,
    notNotified: 0,
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="admin" />

      <div className="lg:ml-64">
        <DashboardHeader title="Retest Management" userName={`${currentUser?.department || 'Admin'} Admin`} />

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <UserX className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalFailed}</p>
                    <p className="text-xs text-muted-foreground">Failed Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-warning">{stats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-success">{stats.passedRetest}</p>
                    <p className="text-xs text-muted-foreground">Passed Retest</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-[300px] sm:min-h-[400px] flex items-center justify-center border-dashed">
            <div className="text-center space-y-4 p-4">
              <div className="p-4 rounded-full bg-muted inline-block">
                <CalendarClock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold">Retest Management module coming soon</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                The backend infrastructure for automatic retest scheduling and management is currently being provisioned.
              </p>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
