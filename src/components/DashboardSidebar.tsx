import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, Mail, Linkedin, TrendingUp, Users, BarChart3, PieChart, Activity } from "lucide-react";
interface DashboardSidebarProps {
  selectedDashboard: "linkedin" | "email";
  onDashboardChange: (dashboard: "linkedin" | "email") => void;
  className?: string;
}
export const DashboardSidebar = ({
  selectedDashboard,
  onDashboardChange,
  className
}: DashboardSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const dashboardOptions = [{
    id: "linkedin" as const,
    title: "LinkedIn KPIs",
    subtitle: "Automatización de conexiones",
    icon: <Linkedin className="h-5 w-5" />,
    metrics: ["Invitaciones", "Tasa de Aceptación", "Tiempo Promedio"],
    color: "text-info",
    bgColor: "bg-info/5 border-info/20"
  }, {
    id: "email" as const,
    title: "Email KPIs",
    subtitle: "Campañas de automatización",
    icon: <Mail className="h-5 w-5" />,
    metrics: ["Emails Enviados", "Respuestas", "ROI"],
    color: "text-success",
    bgColor: "bg-success/5 border-success/20"
  }];
  const filteredOptions = dashboardOptions.filter(option => option.title.toLowerCase().includes(searchQuery.toLowerCase()) || option.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className={cn("w-80 h-full bg-card border-r border-border p-4 space-y-4", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard Navigator</h2>
          <p className="text-sm text-muted-foreground">Accede a diferentes KPIs</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar dashboard..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Dashboard Options */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Dashboards Disponibles
        </h3>
        
        {filteredOptions.map(option => <Card key={option.id} className={cn("cursor-pointer transition-all duration-200 hover:shadow-md", selectedDashboard === option.id ? option.bgColor : "hover:bg-secondary/50", selectedDashboard === option.id && "ring-2 ring-primary/20")} onClick={() => onDashboardChange(option.id)}>
            <CardContent className="p-4 bg-slate-900">
              <div className="flex items-start space-x-3">
                <div className={cn("flex-shrink-0 p-2 rounded-lg", selectedDashboard === option.id ? option.bgColor : "bg-secondary")}>
                  <div className={selectedDashboard === option.id ? option.color : "text-muted-foreground"}>
                    {option.icon}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {option.title}
                    </h4>
                    {selectedDashboard === option.id && <Badge variant="secondary" className="ml-2">
                        Activo
                      </Badge>}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {option.subtitle}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {option.metrics.map((metric, index) => <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                        {metric}
                      </Badge>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Quick Stats */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Vista Rápida
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <Activity className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-sm font-medium">2</div>
            <div className="text-xs text-muted-foreground">Dashboards</div>
          </div>
          
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <BarChart3 className="h-4 w-4 mx-auto text-success mb-1" />
            <div className="text-sm font-medium">Live</div>
            <div className="text-xs text-muted-foreground">Tiempo Real</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Automatización con IA
          </p>
          <Badge variant="outline" className="mt-1 text-xs">
            v2.0
          </Badge>
        </div>
      </div>
    </div>;
};