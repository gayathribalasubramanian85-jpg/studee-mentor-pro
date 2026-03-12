import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardHeader({ title, userName = "Student" }) {
    return (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
            <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
                <div className="flex-1 min-w-0 ml-12 lg:ml-0">
                    <h1 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                    {/* Search - Hidden on mobile */}
                    <div className="hidden lg:flex relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input placeholder="Search..." className="pl-10 w-48 xl:w-64 bg-muted/50"/>
                    </div>

                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground"/>
                        <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-destructive"></span>
                    </Button>

                    {/* Profile */}
                    <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border">
                        <div className="hidden sm:block text-right">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-24 lg:max-w-none">
                                {userName}
                            </p>
                            <p className="text-xs text-muted-foreground hidden lg:block">Welcome back</p>
                        </div>
                        <div className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground"/>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
