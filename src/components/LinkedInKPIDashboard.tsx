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
          title: "Error fetching data",
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
        description: "Failed to fetch dashboard data",
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
    const acceptedInvitations = dashboardData.filter(item => 
      item.requestAccepted === 'Yes' || item.requestAccepted === 'yes' || item.requestAccepted === '1'
    ).length;
    
    const acceptanceRate = totalInvitations > 0 ? (acceptedInvitations / totalInvitations) * 100 : 0;
    
    const validTimeToAccept = dashboardData
      .map(item => parseFloat(item.timeToAccept))
      .filter(time => !isNaN(time) && time > 0);
    
    const avgTimeToAccept = validTimeToAccept.length > 0 
      ? validTimeToAccept.reduce((sum, time) => sum + time, 0) / validTimeToAccept.length 
      : 0;

    const totalConnections = dashboardData.reduce((sum, item) => 
      sum + (Number(item.connectionsCount) || 0), 0
    );

    const validFollowUps = dashboardData
      .map(item => Number(item.followUpCount))
      .filter(count => !isNaN(count));
    
    const avgFollowUpCount = validFollowUps.length > 0
      ? validFollowUps.reduce((sum, count) => sum + count, 0) / validFollowUps.length
      : 0;

    const responsesReceived = dashboardData.filter(item => 
      item.responseReceived === 'Yes' || item.responseReceived === 'yes' || item.responseReceived === '1'
    ).length;
    
    const responseRate = totalInvitations > 0 ? (responsesReceived / totalInvitations) * 100 : 0;

    const errorsCount = dashboardData.filter(item => 
      item.messageError && item.messageError.trim() !== '' && item.messageError !== 'null'
    ).length;
    
    const errorRate = totalInvitations > 0 ? (errorsCount / totalInvitations) * 100 : 0;

    // Time savings calculation (estimated)
    const avgManualTimePerConnection = 15; // minutes
    const timeSaved = totalConnections * avgManualTimePerConnection;
    const manualEffortSaved = totalConnections * 10; // estimated cost per manual connection

    setMetrics({
      totalInvitations,
      acceptanceRate,
      avgTimeToAccept,
      totalConnections,
      avgFollowUpCount,
      responseRate,
      errorRate,
      timeSaved,
      manualEffortSaved
    });
  };

  const getChartData = () => {
    return data.slice(0, 10).map((item, index) => ({
      name: `Connection ${index + 1}`,
      followUps: Number(item.followUpCount) || 0,
      timeToAccept: parseFloat(item.timeToAccept) || 0,
      accepted: item.requestAccepted === 'Yes' ? 1 : 0
    }));
  };

  const getPieData = () => {
    if (!metrics) return [];
    
    return [
      { name: 'Accepted', value: metrics.acceptanceRate, color: 'hsl(var(--chart-1))' },
      { name: 'Pending/Rejected', value: 100 - metrics.acceptanceRate, color: 'hsl(var(--chart-2))' }
    ];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-muted-foreground">No LinkedIn automation data found in the database.</p>
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
            LinkedIn Automation KPI Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive analytics for your LinkedIn outreach automation
          </p>
        </div>

        {/* Conversion Metrics */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Conversion Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Invitations"
              value={metrics.totalInvitations}
              icon={<Users className="h-4 w-4 text-primary" />}
              variant="info"
            />
            <MetricCard
              title="Acceptance Rate"
              value={`${metrics.acceptanceRate.toFixed(1)}%`}
              trend={metrics.acceptanceRate > 30 ? "up" : metrics.acceptanceRate > 15 ? "neutral" : "down"}
              trendValue={metrics.acceptanceRate > 30 ? "Excellent" : metrics.acceptanceRate > 15 ? "Good" : "Needs improvement"}
              icon={<UserCheck className="h-4 w-4 text-success" />}
              variant="success"
            />
            <MetricCard
              title="Avg. Time to Accept"
              value={`${metrics.avgTimeToAccept.toFixed(1)} days`}
              trend={metrics.avgTimeToAccept < 7 ? "up" : metrics.avgTimeToAccept < 14 ? "neutral" : "down"}
              icon={<Clock className="h-4 w-4 text-info" />}
              variant="default"
            />
            <MetricCard
              title="Total Connections"
              value={metrics.totalConnections}
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              variant="success"
            />
          </div>
        </section>

        {/* Follow-up Efficiency */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Follow-up Efficiency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Avg. Follow-ups per Connection"
              value={metrics.avgFollowUpCount.toFixed(1)}
              trend={metrics.avgFollowUpCount < 3 ? "up" : metrics.avgFollowUpCount < 5 ? "neutral" : "down"}
              trendValue={metrics.avgFollowUpCount < 3 ? "Efficient" : "High effort"}
              icon={<MessageSquare className="h-4 w-4 text-info" />}
              variant="info"
            />
            <MetricCard
              title="Response Rate"
              value={`${metrics.responseRate.toFixed(1)}%`}
              trend={metrics.responseRate > 20 ? "up" : metrics.responseRate > 10 ? "neutral" : "down"}
              icon={<CheckCircle className="h-4 w-4 text-success" />}
              variant="success"
            />
            <MetricCard
              title="Message Error Rate"
              value={`${metrics.errorRate.toFixed(1)}%`}
              trend={metrics.errorRate < 5 ? "up" : metrics.errorRate < 10 ? "neutral" : "down"}
              trendValue={metrics.errorRate < 5 ? "Low errors" : "Needs attention"}
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
              <CardTitle>Acceptance Rate Distribution</CardTitle>
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
              <CardTitle>Follow-up vs Time to Accept</CardTitle>
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
                    name="Follow-ups"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="timeToAccept" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Time to Accept (days)"
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
            Time Impact Summary
          </h2>
          <Card className="bg-gradient-to-br from-primary/5 to-success/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Automation Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Time Saved</span>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {Math.floor(metrics.timeSaved / 60)}h {metrics.timeSaved % 60}m
                    </Badge>
                  </div>
                  <Progress value={Math.min((metrics.timeSaved / 1000) * 100, 100)} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Manual Effort Saved</span>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      ${metrics.manualEffortSaved}
                    </Badge>
                  </div>
                  <Progress value={Math.min((metrics.manualEffortSaved / 500) * 100, 100)} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Key Insights</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        Automation has saved approximately <strong>{Math.floor(metrics.timeSaved / 60)} hours</strong> compared to manual outreach
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        Current acceptance rate of <strong>{metrics.acceptanceRate.toFixed(1)}%</strong> 
                        {metrics.acceptanceRate > 20 ? " is above industry average" : " can be improved with better targeting"}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>
                        Average follow-up efficiency of <strong>{metrics.avgFollowUpCount.toFixed(1)} messages per connection</strong>
                        {metrics.avgFollowUpCount < 3 ? " shows excellent targeting" : " suggests room for optimization"}
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