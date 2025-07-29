import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import { 
  Mail, 
  MailOpen, 
  Users, 
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Building,
  UserCheck
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmailDashboardData {
  id: number;
  created_at: string;
  Seguimiento_2: string | null;
  "ID LinkedIn": string | null;
  Nombre: string | null;
  Apellido: string | null;
  Final: string | null;
  URL_LinkedIn: string | null;
  Empresa: string | null;
  Mensaje: string | null;
  Status: string | null;
  Seguimiento_1: string | null;
}

interface EmailCalculatedMetrics {
  totalLeads: number;
  emailsSent: number;
  totalResponses: number;
  meetingsBooked: number;
  replyRate: number;
  meetingRate: number;
  responseToMeetingConversion: number;
  hoursSaved: number;
  moneySaved: number;
  projectedRevenue: number;
  roi: number;
  industriesData: Array<{ name: string; value: number; color: string }>;
  jobTitleResponses: Array<{ name: string; responses: number }>;
  funnelData: Array<{ name: string; value: number; fill: string }>;
}

export const EmailKPIDashboard = () => {
  const [data, setData] = useState<EmailDashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<EmailCalculatedMetrics | null>(null);

  useEffect(() => {
    fetchEmailDashboardData();
  }, []);

  const fetchEmailDashboardData = async () => {
    try {
      setLoading(true);
      const { data: emailData, error } = await supabase
        .from('Email Dashboards' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching email dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch email dashboard data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (emailData) {
        const typedData = emailData as unknown as EmailDashboardData[];
        setData(typedData);
        const calculatedMetrics = calculateEmailMetrics(typedData);
        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateEmailMetrics = (emailData: EmailDashboardData[]): EmailCalculatedMetrics => {
    const totalLeads = emailData.length;
    const emailsSent = emailData.filter(item => item.Status === 'Enviado' || item.Status === 'sent').length;
    const totalResponses = emailData.filter(item => item.Seguimiento_1 === 'Respondió' || item.Final === 'Respondió').length;
    const meetingsBooked = emailData.filter(item => item.Final === 'Reunión agendada' || item.Final === 'Meeting').length;
    
    const replyRate = emailsSent > 0 ? (totalResponses / emailsSent) * 100 : 0;
    const meetingRate = emailsSent > 0 ? (meetingsBooked / emailsSent) * 100 : 0;
    const responseToMeetingConversion = totalResponses > 0 ? (meetingsBooked / totalResponses) * 100 : 0;
    
    // ROI Calculations (configurable business metrics)
    const hoursPerManualLead = 0.5;
    const hoursSaved = emailsSent * hoursPerManualLead;
    const hourlyCost = 60;
    const moneySaved = hoursSaved * hourlyCost;
    
    const averageDealSize = 15000;
    const closeRate = 0.25;
    const projectedRevenue = meetingsBooked * averageDealSize * closeRate;
    const investmentCost = 1000;
    
    const roi = investmentCost > 0 ? ((projectedRevenue - investmentCost) / investmentCost) * 100 : 0;

    // Company distribution (using Empresa as industry)
    const industryCount = emailData.reduce((acc, item) => {
      if (item.Empresa) {
        acc[item.Empresa] = (acc[item.Empresa] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
    
    const industriesData = Object.entries(industryCount)
      .map(([name, value], index) => ({
        name,
        value,
        color: chartColors[index % chartColors.length]
      }))
      .slice(0, 5);

    // Contact name responses (using Nombre as job title substitute)
    const respondedData = emailData.filter(item => item.Seguimiento_1 === 'Respondió' || item.Final === 'Respondió');
    const jobTitleCount = respondedData.reduce((acc, item) => {
      const fullName = `${item.Nombre || ''} ${item.Apellido || ''}`.trim();
      if (fullName) {
        acc[fullName] = (acc[fullName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const jobTitleResponses = Object.entries(jobTitleCount)
      .map(([name, responses]) => ({ name, responses }))
      .sort((a, b) => b.responses - a.responses)
      .slice(0, 5);

    // Funnel data
    const funnelData = [
      { name: 'Leads', value: totalLeads, fill: 'hsl(var(--chart-1))' },
      { name: 'Emails Enviados', value: emailsSent, fill: 'hsl(var(--chart-2))' },
      { name: 'Respuestas', value: totalResponses, fill: 'hsl(var(--chart-3))' },
      { name: 'Reuniones', value: meetingsBooked, fill: 'hsl(var(--chart-4))' }
    ];

    return {
      totalLeads,
      emailsSent,
      totalResponses,
      meetingsBooked,
      replyRate,
      meetingRate,
      responseToMeetingConversion,
      hoursSaved,
      moneySaved,
      projectedRevenue,
      roi,
      industriesData,
      jobTitleResponses,
      funnelData
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-foreground">No Email Data Available</h1>
          <p className="text-muted-foreground mt-2">No email campaign data found in the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-info to-warning bg-clip-text text-transparent">
            Dashboard de Automatización con IA
          </h1>
          <p className="text-xl text-muted-foreground">
            Análisis de Campañas de Email, Conversión y ROI de {metrics.roi.toFixed(1)}%
          </p>
          <Badge variant="outline" className="text-sm">
            Última actualización: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Leads Totales"
            value={metrics.totalLeads.toLocaleString()}
            icon={<Users className="h-5 w-5 text-primary" />}
            variant="default"
          />
          <MetricCard
            title="Emails Enviados"
            value={metrics.emailsSent.toLocaleString()}
            icon={<Mail className="h-5 w-5 text-info" />}
            variant="info"
          />
          <MetricCard
            title="Respuestas"
            value={metrics.totalResponses.toLocaleString()}
            subtitle={`${metrics.replyRate.toFixed(1)}% reply rate`}
            icon={<MailOpen className="h-5 w-5 text-success" />}
            variant="success"
          />
          <MetricCard
            title="Reuniones Agendadas"
            value={metrics.meetingsBooked.toLocaleString()}
            subtitle={`${metrics.meetingRate.toFixed(1)}% meeting rate`}
            icon={<Calendar className="h-5 w-5 text-warning" />}
            variant="warning"
          />
          <MetricCard
            title="ROI Obtenido"
            value={`${metrics.roi.toFixed(1)}%`}
            icon={<DollarSign className="h-5 w-5 text-success" />}
            variant="success"
            className="animate-pulse"
          />
          <MetricCard
            title="Meeting Rate"
            value={`${metrics.meetingRate.toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            variant="default"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Industry Distribution Pie Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Distribución por Industria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.industriesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {metrics.industriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Funnel Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Funnel de Conversión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.funnelData.map((stage, index) => {
                  const percentage = index === 0 ? 100 : (stage.value / metrics.funnelData[0].value) * 100;
                  return (
                    <div key={stage.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{stage.name}</span>
                        <span className="font-medium">{stage.value.toLocaleString()}</span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Job Titles Response Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Top Job Titles por Respuesta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.jobTitleResponses} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="responses" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI and Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardHeader>
              <CardTitle className="text-warning">ROI Generado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{metrics.roi.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground mt-2">
                Revenue proyectado: ${metrics.projectedRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardHeader>
              <CardTitle className="text-success">Horas Ahorradas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{metrics.hoursSaved.toFixed(1)}h</div>
              <p className="text-sm text-muted-foreground mt-2">
                Equivalente a ${metrics.moneySaved.toLocaleString()} USD
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
            <CardHeader>
              <CardTitle className="text-info">Conversión Respuesta→Reunión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-info">{metrics.responseToMeetingConversion.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground mt-2">
                De {metrics.totalResponses} respuestas a {metrics.meetingsBooked} reuniones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Benefits Summary */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Beneficios de la Automatización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <h4 className="font-semibold text-primary">Escalabilidad</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  De contactos manuales a {metrics.emailsSent} automatizados
                </p>
              </div>
              <div className="text-center p-4">
                <h4 className="font-semibold text-success">Ahorro de Tiempo</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.hoursSaved.toFixed(1)} horas = ${metrics.moneySaved.toLocaleString()} USD mensual
                </p>
              </div>
              <div className="text-center p-4">
                <h4 className="font-semibold text-info">Precisión IA</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Personalización por industria y cargo
                </p>
              </div>
              <div className="text-center p-4">
                <h4 className="font-semibold text-warning">ROI Comprobado</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Revenue proyectado de ${metrics.projectedRevenue.toLocaleString()} USD/mes
                </p>
              </div>
            </div>
            <div className="text-center mt-6 p-4 bg-gradient-to-r from-primary/10 to-success/10 rounded-lg border border-primary/20">
              <p className="text-lg font-semibold">
                Por cada $1 USD invertido en automatización, se obtienen ${(metrics.roi/100).toFixed(2)} USD en retorno directo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};