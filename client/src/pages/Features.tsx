import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, Clock, AlertTriangle } from "lucide-react";

export default function Features() {
  const features = [
    {
      category: "基础设施与部署",
      status: "completed",
      items: [
        { name: "服务器部署 (Ubuntu + 宝塔面板)", status: "done" },
        { name: "Apache 反向代理", status: "done" },
        { name: "SSL 证书配置", status: "done" },
        { name: "Node.js 后端 (PM2)", status: "done" },
        { name: "前端静态部署", status: "done" }
      ]
    },
    {
      category: "身份验证系统",
      status: "completed",
      items: [
        { name: "登录页面设计", status: "done" },
        { name: "后端登录 API", status: "done" },
        { name: "JWT 令牌生成", status: "done" },
        { name: "令牌存储与验证", status: "done" },
        { name: "跳转逻辑修复", status: "done" },
        { name: "退出登录功能", status: "done" }
      ]
    },
    {
      category: "预约管理",
      status: "pending",
      items: [
        { name: "预约列表 (时间线视图)", status: "todo" },
        { name: "预约列表 (移动端视图)", status: "todo" },
        { name: "创建预约", status: "todo" },
        { name: "编辑/删除预约", status: "todo" },
        { name: "冲突检测算法", status: "todo" },
        { name: "搜索与筛选", status: "todo" }
      ]
    },
    {
      category: "桌位管理",
      status: "pending",
      items: [
        { name: "桌位列表视图", status: "todo" },
        { name: "创建/编辑桌位", status: "todo" },
        { name: "桌位容量设置", status: "todo" },
        { name: "可用性状态", status: "todo" }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-border pb-6">
        <h1 className="text-4xl font-black tracking-tighter uppercase">功能矩阵</h1>
        <p className="text-muted-foreground font-mono mt-2">追踪模块 // V.1.0</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((category, idx) => (
          <Card key={idx} className="neo-box rounded-none">
            <CardHeader className="border-b-2 border-border pb-3 bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="font-black text-lg uppercase">
                {category.category}
              </CardTitle>
              <StatusBadge status={category.status} />
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {category.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <div className="mt-0.5">
                      <ItemIcon status={item.status} />
                    </div>
                    <span className={`font-mono text-sm ${item.status === 'done' ? 'line-through text-muted-foreground decoration-2' : ''}`}>
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return <Badge className="bg-green-600 text-white hover:bg-green-700 border-2 border-black rounded-none">已完成</Badge>;
  }
  if (status === "pending") {
    return <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black rounded-none">待处理</Badge>;
  }
  return <Badge variant="outline" className="rounded-none border-2 border-black">未知</Badge>;
}

function ItemIcon({ status }: { status: string }) {
  if (status === "done") return <CheckSquare className="w-5 h-5 text-green-600" />;
  if (status === "in-progress") return <Clock className="w-5 h-5 text-blue-600" />;
  return <Square className="w-5 h-5 text-muted-foreground" />;
}
