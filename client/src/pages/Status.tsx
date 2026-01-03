import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Server, Database, Shield, Globe } from "lucide-react";

export default function Status() {
  // Mock data for charts
  const progressData = [
    { name: '认证', completed: 100, remaining: 0 },
    { name: '仪表板', completed: 50, remaining: 50 },
    { name: '预约', completed: 0, remaining: 100 },
    { name: '桌位', completed: 0, remaining: 100 },
    { name: '客户', completed: 0, remaining: 100 },
  ];

  const priorityData = [
    { name: '高优先级', value: 4, color: '#FF3333' },
    { name: '中优先级', value: 4, color: '#FFE600' },
    { name: '低优先级', value: 4, color: '#00CC00' },
  ];

  const services = [
    { name: "前端服务器", status: "online", uptime: "99.9%", latency: "45ms", icon: Globe },
    { name: "后端 API", status: "online", uptime: "99.8%", latency: "120ms", icon: Server },
    { name: "数据库 (PostgreSQL)", status: "online", uptime: "100%", latency: "15ms", icon: Database },
    { name: "认证服务", status: "online", uptime: "99.9%", latency: "50ms", icon: Shield },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-border pb-6">
        <h1 className="text-4xl font-black tracking-tighter uppercase">系统状态</h1>
        <p className="text-muted-foreground font-mono mt-2">实时监控 // 数据分析</p>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service, idx) => (
          <Card key={idx} className="neo-box rounded-none border-2 border-border">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-muted border-2 border-border">
                  <service.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 border border-black animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase text-green-600">在线</span>
                </div>
              </div>
              <div className="font-black text-sm mb-1">{service.name}</div>
              <div className="flex justify-between text-xs font-mono text-muted-foreground mt-4 pt-4 border-t-2 border-border border-dashed">
                <span>运行: {service.uptime}</span>
                <span>延迟: {service.latency}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="neo-box rounded-none">
          <CardHeader className="border-b-2 border-border pb-2">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" /> 模块完成度
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }} />
                <Tooltip 
                  contentStyle={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="completed" stackId="a" fill="var(--chart-1)" barSize={20} />
                <Bar dataKey="remaining" stackId="a" fill="#f0f0f0" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="neo-box rounded-none">
          <CardHeader className="border-b-2 border-border pb-2">
            <CardTitle className="font-black text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" /> 任务分布
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="black" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ border: '2px solid black', borderRadius: '0px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col gap-2 ml-8">
              {priorityData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-black" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs font-mono font-bold">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
