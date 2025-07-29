import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  MessageSquare, 
  AlertTriangle,
  Target,
  Timer,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardData {
  id: number;
  followUpCount: number;
  connectionsCount: number;
  messageError: string;
  responseReceived: string;
  invitationDate: string;
  requestAccepted: string;
  acceptanceDate: string;
  timeToAccept: string;
}

interface CalculatedMetrics {
  totalInvitations: number;
  acceptanceRate: number;
  avgTimeToAccept: number;
  totalConnections: number;
  totalNetworkConnections: number;
  avgFollowUpCount: number;
  responseRate: number;
  errorRate: number;
  timeSaved: number;
  manualEffortSaved: number;
}

export const LinkedInKPIDashboard = () => {
  const [data, setData] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CalculatedMetrics | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: dashboardData, error } = await supabase
        .from('LinkedIn Dashboards')
        .select('*');

      if (error) {
        toast({
          title: "Error al obtener datos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setData(dashboardData || []);
      calculateMetrics(dashboardData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los datos del panel",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (dashboardData: DashboardData[]) => {
    if (dashboardData.length === 0) {
      setMetrics(null);
      return;
    }

    const totalInvitations = dashboardData.length;
    
    // 1. ACCEPTANCE RATE: (requestAccepted = "YES") / (Total registros) × 100
    const acceptedInvitations = dashboardData.filter(item => 
      item.requestAccepted && item.requestAccepted.trim().toUpperCase() === 'YES'
    ).length;
    const acceptanceRate = totalInvitations > 0 ? (acceptedInvitations / totalInvitations) * 100 : 0;
    
    // 2. RESPONSE RATE: (acceptanceDate no vacío) / (Total registros) × 100
    const responsesReceived = dashboardData.filter(item => 
      item.acceptanceDate && item.acceptanceDate.trim() !== '' && item.acceptanceDate.trim() !== 'null'
    ).length;
    const responseRate = totalInvitations > 0 ? (responsesReceived / totalInvitations) * 100 : 0;
    
    // 3. AVERAGE TIME TO ACCEPT: Solo para registros aceptados
    const acceptedRecords = dashboardData.filter(item => 
      item.requestAccepted && item.requestAccepted.trim().toUpperCase() === 'YES'
    );
    
    const validTimeToAccept = acceptedRecords
      .map(item => parseFloat(item.timeToAccept))
      .filter(time => !isNaN(time) && time > 0);
    
    const avgTimeToAccept = validTimeToAccept.length > 0 
      ? validTimeToAccept.reduce((sum, time) => sum + time, 0) / validTimeToAccept.length 
      : 0;

    // 4. TOTAL CONNECTIONS: COUNT de registros donde requestAccepted = "YES"
    const totalConnections = acceptedInvitations;

    // 5. FOLLOW-UP EFFICIENCY: Promedio de followUpCount para registros aceptados
    const followUpCounts = acceptedRecords
      .map(item => Number(item.followUpCount))
      .filter(count => !isNaN(count) && count >= 0);
    
    const avgFollowUpCount = followUpCounts.length > 0
      ? followUpCounts.reduce((sum, count) => sum + count, 0) / followUpCounts.length
      : 0;

    // 6. MESSAGE ERROR RATE: (messageError no vacío) / (Total registros) × 100
    const errorsCount = dashboardData.filter(item => 
      item.messageError && 
      item.messageError.trim() !== '' && 
      item.messageError.trim().toLowerCase() !== 'null' &&
      item.messageError.trim().toLowerCase() !== 'undefined'
    ).length;
    const errorRate = totalInvitations > 0 ? (errorsCount / totalInvitations) * 100 : 0;

    // Total network connections (sum of all connectionsCount)
    const totalNetworkConnections = dashboardData.reduce((sum, item) => 
      sum + (Number(item.connectionsCount) || 0), 0
    );

    // Time savings calculation (estimated)
    const avgManualTimePerConnection = 15; // minutes
    const timeSaved = totalConnections * avgManualTimePerConnection;
    const manualEffortSaved = totalConnections * 10; // estimated cost per manual connection

    setMetrics({
      totalInvitations,
      acceptanceRate,
      avgTimeToAccept,
      totalConnections,
      totalNetworkConnections,
      avgFollowUpCount,
      responseRate,
      errorRate,
      timeSaved,
      manualEffortSaved
    });
  };

  const getChartData = () => {
    return data.slice(0, 10).map((item, index) => ({
      name: `Conexión ${index + 1}`,
      followUps: Number(item.followUpCount) || 0,
      timeToAccept: parseFloat(item.timeToAccept) || 0,
      accepted: item.requestAccepted === 'Yes' ? 1 : 0
    }));
  };

  const getPieData = () => {
    if (!metrics) return [];
    
    return [
      { name: 'Aceptadas', value: metrics.acceptanceRate, color: 'hsl(var(--chart-1))' },
      { name: 'Pendientes/Rechazadas', value: 100 - metrics.acceptanceRate, color: 'hsl(var(--chart-2))' }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No hay datos disponibles</h2>
          <p className="text-muted-foreground">No se encontraron datos de automatización de LinkedIn en la base de datos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Panel de KPIs de Automatización LinkedIn
          </h1>
          <p className="text-muted-foreground">
            Análisis integral de tu automatización de outreach en LinkedIn
          </p>
        </div>

        {/* Conversion Metrics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Métricas de Conversión
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total de Invitaciones"
              value={metrics.totalInvitations}
              icon={<Users className="h-4 w-4 text-primary" />}
              variant="info"
            />
            <MetricCard
              title="Tasa de Aceptación"
              value={`${metrics.acceptanceRate.toFixed(1)}%`}
              trend={metrics.acceptanceRate > 30 ? "up" : metrics.acceptanceRate > 15 ? "neutral" : "down"}
              trendValue={metrics.acceptanceRate > 30 ? "Excelente" : metrics.acceptanceRate > 15 ? "Bueno" : "Necesita mejora"}
              icon={<UserCheck className="h-4 w-4 text-success" />}
              variant="success"
            />
            <MetricCard
              title="Tiempo Promedio de Aceptación"
              value={`${metrics.avgTimeToAccept.toFixed(1)} días`}
              trend={metrics.avgTimeToAccept < 7 ? "up" : metrics.avgTimeToAccept < 14 ? "neutral" : "down"}
              icon={<Clock className="h-4 w-4 text-info" />}
              variant="default"
            />
            <MetricCard
              title="Total de Conexiones"
              value={metrics.totalConnections}
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              variant="success"
            />
          </div>
        </section>

        {/* Network Metrics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Métricas de Red
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Total Conexiones de Red"
              value={metrics.totalNetworkConnections.toLocaleString()}
              subtitle="Suma de todas las conexiones de prospectos"
              icon={<Users className="h-4 w-4 text-info" />}
              variant="info"
            />
            <MetricCard
              title="Tasa de Respuesta"
              value={`${metrics.responseRate.toFixed(1)}%`}
              trend={metrics.responseRate > 20 ? "up" : metrics.responseRate > 10 ? "neutral" : "down"}
              trendValue={metrics.responseRate > 20 ? "Excelente" : metrics.responseRate > 10 ? "Bueno" : "Necesita mejora"}
              icon={<CheckCircle className="h-4 w-4 text-success" />}
              variant="success"
            />
          </div>
        </section>

        {/* Follow-up Efficiency */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Eficiencia de Seguimiento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Prom. Seguimientos por Conexión"
              value={metrics.avgFollowUpCount.toFixed(1)}
              trend={metrics.avgFollowUpCount < 3 ? "up" : metrics.avgFollowUpCount < 5 ? "neutral" : "down"}
              trendValue={metrics.avgFollowUpCount < 3 ? "Eficiente" : "Alto esfuerzo"}
              icon={<MessageSquare className="h-4 w-4 text-info" />}
              variant="info"
            />
            <MetricCard
              title="Tasa de Error de Mensajes"
              value={`${metrics.errorRate.toFixed(1)}%`}
              trend={metrics.errorRate < 5 ? "up" : metrics.errorRate < 10 ? "neutral" : "down"}
              trendValue={metrics.errorRate < 5 ? "Pocos errores" : "Necesita atención"}
              icon={<XCircle className="h-4 w-4 text-destructive" />}
              variant="warning"
            />
          </div>
        </section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acceptance Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Tasa de Aceptación</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Follow-up Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Seguimientos vs Tiempo de Aceptación</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="followUps" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Seguimientos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="timeToAccept" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Tiempo de Aceptación (días)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Time Impact Summary */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Resumen de Impacto de Tiempo
          </h2>
          <Card className="bg-gradient-to-br from-primary/5 to-success/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Beneficios de la Automatización</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tiempo Ahorrado</span>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {Math.floor(metrics.timeSaved / 60)}h {metrics.timeSaved % 60}m
                    </Badge>
                  </div>
                  <Progress value={Math.min((metrics.timeSaved / 1000) * 100, 100)} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Esfuerzo Manual Ahorrado</span>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      ${metrics.manualEffortSaved}
                    </Badge>
                  </div>
                  <Progress value={Math.min((metrics.manualEffortSaved / 500) * 100, 100)} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Insights Clave</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        La automatización ha ahorrado aproximadamente <strong>{Math.floor(metrics.timeSaved / 60)} horas</strong> comparado con outreach manual
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        La tasa de aceptación actual del <strong>{metrics.acceptanceRate.toFixed(1)}%</strong> 
                        {metrics.acceptanceRate > 20 ? " está por encima del promedio de la industria" : " puede mejorarse con mejor targeting"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        Eficiencia promedio de seguimiento de <strong>{metrics.avgFollowUpCount.toFixed(1)} mensajes por conexión</strong>
                        {metrics.avgFollowUpCount < 3 ? " muestra excelente targeting" : " sugiere oportunidades de optimización"}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};