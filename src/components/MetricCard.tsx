import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info";
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  className,
  icon,
  variant = "default"
}: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-gradient-to-br from-card to-success/5";
      case "warning":
        return "border-warning/20 bg-gradient-to-br from-card to-warning/5";
      case "info":
        return "border-info/20 bg-gradient-to-br from-card to-info/5";
      default:
        return "border-border bg-gradient-to-br from-card to-secondary/10";
    }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-lg", getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {getTrendIcon()}
            {trendValue && (
              <span className={cn(
                "font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-destructive"
              )}>
                {trendValue}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};