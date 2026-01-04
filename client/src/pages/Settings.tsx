import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Settings as SettingsIcon, Save, Home } from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { data: configs, isLoading } = trpc.config.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const upsertMutation = trpc.config.upsert.useMutation({
    onSuccess: () => {
      utils.config.getAll.invalidate();
      toast.success("配置已保存");
    },
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  const getConfigValue = (key: string, defaultValue: string = "") => {
    return configs?.find(c => c.configKey === key)?.configValue || defaultValue;
  };

  const handleSave = (key: string, value: string, description: string) => {
    upsertMutation.mutate({ key, value, description });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          首页
        </Button>
        <div className="h-6 w-px bg-border" />
        <SettingsIcon className="w-8 h-8" />
        <h1 className="text-3xl font-black">系统设置</h1>
      </div>

      <div className="grid gap-6">
        {/* 营业时间设置 */}
        <Card className="neo-box rounded-none">
          <CardHeader>
            <CardTitle className="font-black text-xl">营业时间</CardTitle>
            <CardDescription>设置餐厅的营业开始和结束时间</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="business_start_time" className="font-bold">开始时间</Label>
              <div className="flex gap-2">
                <Input
                  id="business_start_time"
                  type="time"
                  defaultValue={getConfigValue("business_start_time", "09:00")}
                  className="rounded-none border-2"
                />
                <Button
                  onClick={(e) => {
                    const input = document.getElementById("business_start_time") as HTMLInputElement;
                    handleSave("business_start_time", input.value, "营业开始时间（HH:mm格式）");
                  }}
                  className="neo-box rounded-none font-bold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business_end_time" className="font-bold">结束时间</Label>
              <div className="flex gap-2">
                <Input
                  id="business_end_time"
                  type="time"
                  defaultValue={getConfigValue("business_end_time", "23:00")}
                  className="rounded-none border-2"
                />
                <Button
                  onClick={(e) => {
                    const input = document.getElementById("business_end_time") as HTMLInputElement;
                    handleSave("business_end_time", input.value, "营业结束时间（HH:mm格式）");
                  }}
                  className="neo-box rounded-none font-bold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 预约设置 */}
        <Card className="neo-box rounded-none">
          <CardHeader>
            <CardTitle className="font-black text-xl">预约设置</CardTitle>
            <CardDescription>设置预约相关的时间参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="time_slot_minutes" className="font-bold">时间槽间隔（分钟）</Label>
              <div className="flex gap-2">
                <Input
                  id="time_slot_minutes"
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  defaultValue={getConfigValue("time_slot_minutes", "30")}
                  className="rounded-none border-2"
                />
                <Button
                  onClick={(e) => {
                    const input = document.getElementById("time_slot_minutes") as HTMLInputElement;
                    handleSave("time_slot_minutes", input.value, "时间槽间隔（分钟）");
                  }}
                  className="neo-box rounded-none font-bold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">日历视图中每个时间槽的间隔</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="buffer_time_minutes" className="font-bold">缓冲时间（分钟）</Label>
              <div className="flex gap-2">
                <Input
                  id="buffer_time_minutes"
                  type="number"
                  min="0"
                  max="120"
                  step="5"
                  defaultValue={getConfigValue("buffer_time_minutes", "30")}
                  className="rounded-none border-2"
                />
                <Button
                  onClick={(e) => {
                    const input = document.getElementById("buffer_time_minutes") as HTMLInputElement;
                    handleSave("buffer_time_minutes", input.value, "预约后的缓冲时间（分钟）");
                  }}
                  className="neo-box rounded-none font-bold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">预约结束后自动添加的缓冲时间，用于清理桌位</p>
            </div>
          </CardContent>
        </Card>

        {/* 界面设置 */}
        <Card className="neo-box rounded-none">
          <CardHeader>
            <CardTitle className="font-black text-xl">界面设置</CardTitle>
            <CardDescription>自定义系统界面的显示方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="reservation_view_style" className="font-bold">预约视图风格</Label>
              <div className="flex gap-2">
                <Select
                  defaultValue={getConfigValue("reservation_view_style", "table")}
                  onValueChange={(value) => {
                    handleSave("reservation_view_style", value, "预约视图风格（table=桌位在左侧, timeline=时间在左侧）");
                  }}
                >
                  <SelectTrigger className="rounded-none border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">表格视图（桌位在左侧）</SelectItem>
                    <SelectItem value="timeline">时间轴视图（时间在左侧）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">切换预约管理页面的显示风格</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
