import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Flag } from "lucide-react";

export default function Roadmap() {
  const phases = [
    {
      id: "PHASE_01",
      title: "核心预约管理",
      duration: "第 1-3 周",
      status: "active",
      tasks: [
        { week: "第 1 周", items: ["预约增删改查 API", "冲突检测", "时间线界面"] },
        { week: "第 2 周", items: ["桌位管理 API", "客户管理 API", "可用性逻辑"] },
        { week: "第 3 周", items: ["搜索与筛选", "状态管理", "UI/UX 优化"] }
      ]
    },
    {
      id: "PHASE_02",
      title: "店铺与员工管理",
      duration: "第 4-5 周",
      status: "upcoming",
      tasks: [
        { week: "第 4 周", items: ["店铺设置 API", "员工角色与权限", "认证集成"] },
        { week: "第 5 周", items: ["员工排班", "绩效指标", "管理仪表板"] }
      ]
    },
    {
      id: "PHASE_03",
      title: "高级功能",
      duration: "第 6-8 周",
      status: "upcoming",
      tasks: [
        { week: "第 6 周", items: ["报表系统", "通知引擎", "邮件/短信集成"] },
        { week: "第 7 周", items: ["反馈系统", "黑名单管理", "移动端优化"] },
        { week: "第 8 周", items: ["最终测试", "部署上线", "项目移交"] }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-border pb-6">
        <h1 className="text-4xl font-black tracking-tighter uppercase">开发路线图</h1>
        <p className="text-muted-foreground font-mono mt-2">时间轴 // 里程碑</p>
      </div>

      <div className="relative border-l-4 border-border ml-4 md:ml-8 space-y-12 py-4">
        {phases.map((phase, idx) => (
          <div key={idx} className="relative pl-8 md:pl-12">
            {/* Timeline Node */}
            <div className={`absolute -left-[1.35rem] top-0 w-10 h-10 border-4 border-border flex items-center justify-center bg-background z-10 ${phase.status === 'active' ? 'bg-accent' : 'bg-background'}`}>
              <span className="font-black text-sm">{idx + 1}</span>
            </div>

            <Card className={`neo-box rounded-none ${phase.status === 'active' ? 'ring-4 ring-accent/30' : 'opacity-80'}`}>
              <CardHeader className="border-b-2 border-border pb-3 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black text-muted-foreground mb-1">{phase.id}</div>
                  <CardTitle className="font-black text-xl uppercase flex items-center gap-2">
                    {phase.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono border-2 border-border rounded-none bg-white">
                    <Calendar className="w-3 h-3 mr-2" /> {phase.duration}
                  </Badge>
                  <StatusBadge status={phase.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {phase.tasks.map((week, wIdx) => (
                    <div key={wIdx} className="border-2 border-border p-4 bg-background shadow-[4px_4px_0px_0px_var(--color-muted)]">
                      <div className="font-black text-sm border-b-2 border-border pb-2 mb-3 flex items-center justify-between">
                        {week.week}
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <ul className="space-y-2">
                        {week.items.map((item, i) => (
                          <li key={i} className="text-sm font-mono flex items-start gap-2">
                            <span className="text-accent-foreground/50 mt-1">›</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
        
        {/* End Node */}
        <div className="absolute -left-[0.9rem] bottom-0 w-6 h-6 bg-black border-2 border-border" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return <Badge className="bg-blue-600 text-white hover:bg-blue-700 border-2 border-black rounded-none animate-pulse">进行中</Badge>;
  }
  return <Badge variant="outline" className="bg-muted text-muted-foreground border-2 border-muted-foreground rounded-none">即将开始</Badge>;
}
