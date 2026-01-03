import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Database,
  Server,
  Layout
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  // Mock data based on system_status_and_plan.md
  const overallProgress = 11;
  
  const stats = [
    { label: "COMPLETED", value: "5", total: "12", color: "text-green-600" },
    { label: "IN_PROGRESS", value: "2", total: "12", color: "text-blue-600" },
    { label: "PENDING", value: "5", total: "12", color: "text-gray-400" },
  ];

  const recentActivity = [
    { action: "DEPLOYED", target: "Authentication System", time: "2h ago", status: "success" },
    { action: "FIXED", target: "Login Redirect Issue", time: "3h ago", status: "success" },
    { action: "STARTED", target: "Reservation API", time: "Just now", status: "pending" },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-border pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">System Overview</h1>
          <p className="text-muted-foreground font-mono mt-2">RESTAURANT_BOOKING_SYSTEM // DASHBOARD</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-2 border-green-800 font-bold px-3 py-1 rounded-none">
            SYSTEM_ONLINE
          </Badge>
          <Badge variant="outline" className="bg-accent text-accent-foreground border-2 border-border font-bold px-3 py-1 rounded-none">
            DEV_MODE
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="neo-box rounded-none">
          <CardHeader className="border-b-2 border-border pb-2">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <ActivityIcon /> OVERALL_PROGRESS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-5xl font-black mb-4">{overallProgress}%</div>
            <Progress value={overallProgress} className="h-4 border-2 border-border rounded-none bg-muted [&>div]:bg-primary" />
            <p className="text-xs font-mono mt-2 text-muted-foreground">TARGET: MVP LAUNCH (6-8 WEEKS)</p>
          </CardContent>
        </Card>

        <Card className="neo-box rounded-none md:col-span-2">
          <CardHeader className="border-b-2 border-border pb-2">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <ListIcon /> MODULE_STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 border-2 border-border bg-muted/30">
                <div className="text-xs font-bold text-muted-foreground mb-1">{stat.label}</div>
                <div className={`text-3xl font-black ${stat.color}`}>
                  {stat.value}<span className="text-lg text-muted-foreground">/{stat.total}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Health & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="neo-box rounded-none">
          <CardHeader className="border-b-2 border-border pb-2 bg-muted/20">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <ServerIcon /> SYSTEM_HEALTH
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <HealthItem label="FRONTEND_SVC" status="operational" />
            <HealthItem label="BACKEND_API" status="operational" />
            <HealthItem label="DATABASE_CONN" status="operational" />
            <HealthItem label="AUTH_SERVICE" status="operational" />
          </CardContent>
        </Card>

        <Card className="neo-box rounded-none">
          <CardHeader className="border-b-2 border-border pb-2 bg-muted/20">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <HistoryIcon /> RECENT_ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y-2 divide-border">
              {recentActivity.map((item, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={item.status} />
                    <div>
                      <div className="font-bold text-sm">{item.action}</div>
                      <div className="text-xs text-muted-foreground">{item.target}</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs bg-muted px-2 py-1 border border-border">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-2 border-t-2 border-dashed border-border text-center">
              <Link href="/status">
                <span className="text-sm font-bold hover:underline cursor-pointer flex items-center justify-center gap-1">
                  VIEW_FULL_LOG <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HealthItem({ label, status }: { label: string, status: "operational" | "degraded" | "down" }) {
  const colors = {
    operational: "bg-green-500",
    degraded: "bg-yellow-500",
    down: "bg-red-500"
  };
  
  return (
    <div className="flex items-center justify-between p-2 border border-border bg-card shadow-[2px_2px_0px_0px_var(--color-border)]">
      <span className="font-mono font-bold text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase">{status}</span>
        <div className={`w-3 h-3 border border-black ${colors[status]}`} />
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  if (status === "pending") return <Clock className="w-5 h-5 text-blue-600" />;
  return <AlertCircle className="w-5 h-5 text-red-600" />;
}

function ActivityIcon() { return <Activity className="w-5 h-5" />; }
function ListIcon() { return <Layout className="w-5 h-5" />; }
function ServerIcon() { return <Server className="w-5 h-5" />; }
function HistoryIcon() { return <Clock className="w-5 h-5" />; }
import { Activity } from "lucide-react";
