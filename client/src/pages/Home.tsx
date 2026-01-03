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
    { label: "已完成", value: "5", total: "12", color: "text-green-600" },
    { label: "进行中", value: "2", total: "12", color: "text-blue-600" },
    { label: "待处理", value: "5", total: "12", color: "text-gray-400" },
  ];

  const recentActivity = [
    { action: "已部署", target: "身份验证系统", time: "2小时前", status: "success" },
    { action: "已修复", target: "登录跳转问题", time: "3小时前", status: "success" },
    { action: "已开始", target: "预约管理 API", time: "刚刚", status: "pending" },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-border pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">系统概览</h1>
          <p className="text-muted-foreground font-mono mt-2">餐厅预约管理系统 // 仪表板</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-2 border-green-800 font-bold px-3 py-1 rounded-none">
            系统在线
          </Badge>
          <Badge variant="outline" className="bg-accent text-accent-foreground border-2 border-border font-bold px-3 py-1 rounded-none">
            开发模式
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="neo-box rounded-none">
          <CardHeader className="border-b-2 border-border pb-2">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <ActivityIcon /> 总体进度
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-5xl font-black mb-4">{overallProgress}%</div>
            <Progress value={overallProgress} className="h-4 border-2 border-border rounded-none bg-muted [&>div]:bg-primary" />
            <p className="text-xs font-mono mt-2 text-muted-foreground">目标：MVP 发布（6-8 周）</p>
          </CardContent>
        </Card>

        <Card className="neo-box rounded-none md:col-span-2">
          <CardHeader className="border-b-2 border-border pb-2">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <ListIcon /> 模块状态
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
              <ServerIcon /> 系统健康
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <HealthItem label="前端服务" status="operational" />
            <HealthItem label="后端 API" status="operational" />
            <HealthItem label="数据库连接" status="operational" />
            <HealthItem label="认证服务" status="operational" />
          </CardContent>
        </Card>

        <Card className="neo-box rounded-none">
          <CardHeader className="border-b-2 border-border pb-2 bg-muted/20">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <HistoryIcon /> 最近活动
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
                  查看完整日志 <ArrowRight className="w-4 h-4" />
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
