import { Card, CardContent } from "@/components/ui/card";
export default function StatsCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }) {
  const variantStyles = {
    default: "bg-card",
    primary: "gradient-primary text-primary-foreground",
    secondary: "gradient-secondary text-secondary-foreground",
    accent: "gradient-accent text-accent-foreground",
    success: "bg-success text-success-foreground",
    destructive: "bg-destructive text-destructive-foreground",
  };
  const iconBgStyles = {
    default: "bg-primary/10 text-primary",
    primary: "bg-primary-foreground/20 text-primary-foreground",
    secondary: "bg-secondary-foreground/20 text-secondary-foreground",
    accent: "bg-accent-foreground/20 text-accent-foreground",
    success: "bg-success-foreground/20 text-success-foreground",
    destructive: "bg-destructive-foreground/20 text-destructive-foreground",
  };
  return (<Card className={`${variantStyles[variant]} border-0 shadow-sm hover:shadow-lg transition-all duration-300`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className={`text-sm font-medium ${variant === "default" ? "text-muted-foreground" : "opacity-80"}`}>
            {title}
          </p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {subtitle && (<p className={`text-sm ${variant === "default" ? "text-muted-foreground" : "opacity-70"}`}>
            {subtitle}
          </p>)}
          {trend !== undefined && (<p className={`text-sm font-medium ${trend > 0 ? "text-success" : "text-destructive"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last week
          </p>)}
        </div>
        <div className={`p-3 rounded-xl ${iconBgStyles[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>);
}
