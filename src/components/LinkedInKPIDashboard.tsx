import { useState, useEffect } from "react";
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

interface NocoDBRecord {
  ID_LinkedIn: string;
  Nombre: string;
  Apellido: string;
  Final: string;
  URL_LinkedIn: string;
  Empresa: string;
  Sector: string;
  Status: string;
  Mensaje: string;
  Seguimiento_1: string;
  Seguimiento_2: string;
  '¿Respondió?': string;
}

interface CalculatedMetrics {
  totalProspects: number;
  contactedRate: number;
  responseRate: number;
  finalRate: number;
  totalCompanies: number;
  totalSectors: number;
  avgMessageLength: number;
  followUpRate: number;
  timeSaved: number;
  manualEffortSaved: number;
  roi: number;
  connectionsSent: number;
  responsesReceived: number;
}

export const LinkedInKPIDashboard = () => {
  const [data, setData] = useState<NocoDBRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CalculatedMetrics | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Conectando...");
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    const startTime = Date.now();
    
    try {
      setConnectionStatus("Conectando a NocoDB...");
      
      const baseURL = 'https://pmnocodb.perezmartinez.mx';
      const apiToken = 'idt1kfiu1V70l2zmUII_Rd_yKDM2GkOyzGxfsmdf';
      const projectName = 'PROSPECCIÓN';
      const tableName = 'PROSPECCIÓN LINKEDIN';
      
      const url = `${baseURL}/api/v1/db/data/noco/${encodeURIComponent(projectName)}/${encodeURIComponent(tableName)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'xc-token': apiToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      const dashboardData = result.list || result || [];
      
      setData(dashboardData);
      calculateLinkedInMetrics(dashboardData);
      
      const loadTime = Date.now() - startTime;
      setConnectionStatus(`🟢 Conectado a NocoDB (${dashboardData.length} registros)`);
      setLastUpdate(`Actualizado: ${new Date().toLocaleTimeString()} (${loadTime}ms)`);
      
    } catch (error) {
      console.error('Error conectando con NocoDB:', error);
      setConnectionStatus("🔴 Error de conexión");
      toast({
        title: "Error",
        description: "Error al cargar los datos desde NocoDB",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLinkedInMetrics = (dashboardData: NocoDBRecord[]) => {
    if (dashboardData.length === 0) {
      setMetrics(null);
      return;
    }

    const totalProspects = dashboardData.length;
    
    // 1. CONEXIONES ENVIADAS: Status = "ENVIADO"
    const connectionsSent = dashboardData.filter(item => 
      item.Status && 
      item.Status.trim().toUpperCase() === 'ENVIADO'
    ).length;
    
    // 2. RESPUESTAS RECIBIDAS: ¿Respondió? = "Recibió Respuesta"
    const responsesReceived = dashboardData.filter(item => 
      item['¿Respondió?'] && 
      item['¿Respondió?'].trim() === 'Recibió Respuesta'
    ).length;
    
    // 3. CONTACTED RATE: Prospectos con Status activo
    const contactedProspects = dashboardData.filter(item => 
      item.Status && 
      item.Status.trim() !== '' && 
      item.Status.toLowerCase() !== 'pendiente'
    ).length;
    const contactedRate = totalProspects > 0 ? (contactedProspects / totalProspects) * 100 : 0;
    
    // 4. RESPONSE RATE: Basado en respuestas recibidas
    const responseRate = connectionsSent > 0 ? (responsesReceived / connectionsSent) * 100 : 0;
    
    // 5. FINAL RATE: Prospectos que llegaron a status "Final"
    const finalProspects = dashboardData.filter(item => 
      item.Final && 
      (item.Final.toLowerCase() === 'si' || 
       item.Final.toLowerCase() === 'yes' || 
       item.Final === '1')
    ).length;
    const finalRate = totalProspects > 0 ? (finalProspects / totalProspects) * 100 : 0;

    // 6. COMPANIES & SECTORS ANALYSIS
    const uniqueCompanies = new Set(
      dashboardData.filter(item => item.Empresa && item.Empresa.trim() !== '')
                   .map(item => item.Empresa.trim())
    );
    const totalCompanies = uniqueCompanies.size;
    
    const uniqueSectors = new Set(
      dashboardData.filter(item => item.Sector && item.Sector.trim() !== '')
                   .map(item => item.Sector.trim())
    );
    const totalSectors = uniqueSectors.size;

    // 7. FOLLOW-UP ANALYSIS
    const followUpProspects = dashboardData.filter(item => 
      (item.Seguimiento_1 && item.Seguimiento_1.trim() !== '') ||
      (item.Seguimiento_2 && item.Seguimiento_2.trim() !== '')
    ).length;
    const followUpRate = totalProspects > 0 ? (followUpProspects / totalProspects) * 100 : 0;

    // 8. MESSAGE LENGTH ANALYSIS
    const validMessages = dashboardData.filter(item => item.Mensaje && item.Mensaje.trim() !== '');
    const avgMessageLength = validMessages.length > 0 
      ? validMessages.reduce((sum, item) => sum + item.Mensaje.length, 0) / validMessages.length 
      : 0;

    // TIME SAVINGS & ROI CALCULATION
    const avgManualTimePerProspect = 20; // minutos por prospecto manual
    const timeSaved = contactedProspects * avgManualTimePerProspect;
    const hourlyRate = 60; // $60 USD/hora
    const manualEffortSaved = Math.round((timeSaved / 60) * hourlyRate);
    
    // ROI calculation
    const avgDealSize = 20000;
    const closeRate = 0.15; // 15% tasa de cierre estimada
    const projectedRevenue = finalProspects * avgDealSize * closeRate;
    const systemCost = 1500; // Costo mensual estimado del sistema
    const roi = systemCost > 0 ? Math.max(0, ((projectedRevenue - systemCost) / systemCost) * 100) : 0;

    setMetrics({
      totalProspects,
      contactedRate,
      responseRate,
      finalRate,
      totalCompanies,
      totalSectors,
      avgMessageLength,
      followUpRate,
      timeSaved,
      manualEffortSaved,
      roi,
      connectionsSent,
      responsesReceived
    });
  };

  const getChartData = () => {
    return data.slice(0, 10).map((item, index) => ({
      name: `Prospecto ${index + 1}`,
      hasMessage: item.Mensaje && item.Mensaje.trim() !== '' ? 1 : 0,
      hasFollowUp: ((item.Seguimiento_1 && item.Seguimiento_1.trim() !== '') || 
                    (item.Seguimiento_2 && item.Seguimiento_2.trim() !== '')) ? 1 : 0,
      isFinal: (item.Final && (item.Final.toLowerCase() === 'si' || item.Final === '1')) ? 1 : 0
    }));
  };

  const getPieData = () => {
    if (!metrics) return [];
    
    return [
      { name: 'Contactados', value: metrics.contactedRate, color: 'hsl(var(--chart-1))' },
      { name: 'Pendientes', value: 100 - metrics.contactedRate, color: 'hsl(var(--chart-2))' }
    ];
  };

  const getSectorData = () => {
    const sectorCounts: { [key: string]: number } = {};
    data.forEach(item => {
      if (item.Sector && item.Sector.trim() !== '') {
        const sector = item.Sector.trim();
        sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
      }
    });
    
    return Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sector, count]) => ({
        name: sector,
        value: count,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }));
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
          <div className="flex justify-center gap-4 text-sm">
            <span className="text-muted-foreground">{connectionStatus}</span>
            <span className="text-muted-foreground">{lastUpdate}</span>
          </div>
        </div>

        {/* Primary Metrics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Métricas Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Total de Prospectos"
              value={metrics.totalProspects}
              icon={<Users className="h-4 w-4 text-primary" />}
              variant="info"
            />
            <MetricCard
              title="Conexiones Enviadas"
              value={metrics.connectionsSent}
              subtitle={`${metrics.totalProspects > 0 ? ((metrics.connectionsSent / metrics.totalProspects) * 100).toFixed(1) : 0}% del total`}
              icon={<UserCheck className="h-4 w-4 text-success" />}
              variant="success"
            />
            <MetricCard
              title="Respuestas Recibidas"
              value={metrics.responsesReceived}
              subtitle={`${metrics.connectionsSent > 0 ? ((metrics.responsesReceived / metrics.connectionsSent) * 100).toFixed(1) : 0}% de enviadas`}
              icon={<MessageSquare className="h-4 w-4 text-info" />}
              variant="default"
            />
            <MetricCard
              title="Tasa de Respuesta"
              value={`${metrics.responseRate.toFixed(1)}%`}
              trend={metrics.responseRate > 15 ? "up" : metrics.responseRate > 8 ? "neutral" : "down"}
              icon={<MessageSquare className="h-4 w-4 text-info" />}
              variant="default"
            />
            <MetricCard
              title="Tasa de Finalización"
              value={`${metrics.finalRate.toFixed(1)}%`}
              icon={<CheckCircle className="h-4 w-4 text-primary" />}
              variant="success"
            />
          </div>
        </section>

        {/* Business Metrics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Métricas de Negocio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Total de Empresas"
              value={metrics.totalCompanies.toLocaleString()}
              subtitle="Empresas únicas contactadas"
              icon={<Users className="h-4 w-4 text-info" />}
              variant="info"
            />
            <MetricCard
              title="Sectores Alcanzados"
              value={metrics.totalSectors.toLocaleString()}
              subtitle="Sectores únicos"
              icon={<Target className="h-4 w-4 text-success" />}
              variant="success"
            />
            <MetricCard
              title="ROI Estimado"
              value={`${metrics.roi.toFixed(1)}%`}
              trend={metrics.roi > 200 ? "up" : metrics.roi > 100 ? "neutral" : "down"}
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              variant="success"
            />
          </div>
        </section>

        {/* Communication Metrics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Métricas de Comunicación
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title="Tasa de Seguimiento"
              value={`${metrics.followUpRate.toFixed(1)}%`}
              trend={metrics.followUpRate > 60 ? "up" : metrics.followUpRate > 40 ? "neutral" : "down"}
              trendValue={metrics.followUpRate > 60 ? "Excelente seguimiento" : "Puede mejorar"}
              icon={<MessageSquare className="h-4 w-4 text-info" />}
              variant="info"
            />
            <MetricCard
              title="Long. Promedio de Mensaje"
              value={`${Math.round(metrics.avgMessageLength)} chars`}
              trend={metrics.avgMessageLength > 100 && metrics.avgMessageLength < 300 ? "up" : "neutral"}
              trendValue={metrics.avgMessageLength > 100 && metrics.avgMessageLength < 300 ? "Longitud óptima" : "Revisar extensión"}
              icon={<Clock className="h-4 w-4 text-warning" />}
              variant="warning"
            />
          </div>
        </section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Contactos</CardTitle>
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

          {/* Sector Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Sectores</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSectorData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--chart-1))"
                    name="Prospectos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ROI and Impact Summary */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Resumen de ROI e Impacto
          </h2>
          <Card className="bg-gradient-to-br from-primary/5 to-success/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Beneficios de la Automatización LinkedIn</CardTitle>
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
                  <Progress value={Math.min((metrics.timeSaved / 2000) * 100, 100)} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Valor en Ahorro</span>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      ${metrics.manualEffortSaved.toLocaleString()}
                    </Badge>
                  </div>
                  <Progress value={Math.min((metrics.manualEffortSaved / 10000) * 100, 100)} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ROI Estimado</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {metrics.roi.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={Math.min(metrics.roi / 5, 100)} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Insights Clave</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        Se contactaron <strong>{metrics.totalProspects}</strong> prospectos en <strong>{metrics.totalCompanies}</strong> empresas diferentes
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        Tasa de respuesta del <strong>{metrics.responseRate.toFixed(1)}%</strong> 
                        {metrics.responseRate > 10 ? " está por encima del promedio" : " puede mejorarse"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        <strong>{metrics.totalSectors}</strong> sectores alcanzados con una tasa de finalización del <strong>{metrics.finalRate.toFixed(1)}%</strong>
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