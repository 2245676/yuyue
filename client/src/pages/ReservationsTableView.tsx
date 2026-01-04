import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, subDays, parseISO, startOfDay, endOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { logger } from "@/lib/logger";

export default function ReservationsTableView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickCell, setLastClickCell] = useState<string>("");

  const utils = trpc.useUtils();
  
  // 获取系统配置
  const { data: configs } = trpc.config.getAll.useQuery();
  const { data: tables } = trpc.table.listActive.useQuery();
  const { data: reservations } = trpc.reservation.getByDateRange.useQuery({
    startDate: startOfDay(selectedDate).toISOString(),
    endDate: endOfDay(selectedDate).toISOString(),
  });

  // 初始化默认配置
  const initDefaultsMutation = trpc.config.initDefaults.useMutation();

  useEffect(() => {
    if (configs && configs.length === 0) {
      initDefaultsMutation.mutate();
    }
  }, [configs]);

  // 从配置中获取参数（确保类型安全）
  const businessStartTime = String(configs?.find(c => c.configKey === "business_start_time")?.configValue || "09:00");
  const businessEndTime = String(configs?.find(c => c.configKey === "business_end_time")?.configValue || "23:00");
  const timeSlotMinutes = parseInt(String(configs?.find(c => c.configKey === "time_slot_minutes")?.configValue || "30"));
  const bufferMinutes = parseInt(String(configs?.find(c => c.configKey === "buffer_time_minutes")?.configValue || "30"));

  const createMutation = trpc.reservation.create.useMutation({
    onSuccess: () => {
      logger.info("预约创建成功", { component: "ReservationsTableView", action: "createReservation" });
      utils.reservation.getByDateRange.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("预约创建成功");
    },
    onError: (error) => {
      logger.error("预约创建失败", new Error(error.message), { component: "ReservationsTableView", action: "createReservation" });
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.reservation.update.useMutation({
    onSuccess: () => {
      logger.info("预约更新成功", { component: "ReservationsTableView", action: "updateReservation" });
      utils.reservation.getByDateRange.invalidate();
      setIsEditDialogOpen(false);
      setEditingReservation(null);
      toast.success("预约更新成功");
    },
    onError: (error) => {
      logger.error("预约更新失败", new Error(error.message), { component: "ReservationsTableView", action: "updateReservation" });
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.reservation.delete.useMutation({
    onSuccess: () => {
      logger.info("预约删除成功", { component: "ReservationsTableView", action: "deleteReservation" });
      utils.reservation.getByDateRange.invalidate();
      setIsEditDialogOpen(false);
      setEditingReservation(null);
      toast.success("预约已删除");
    },
    onError: (error) => {
      logger.error("预约删除失败", new Error(error.message), { component: "ReservationsTableView", action: "deleteReservation" });
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 生成时间槽
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const [startHour, startMinute] = String(businessStartTime).split(":").map(Number);
    const [endHour, endMinute] = String(businessEndTime).split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += timeSlotMinutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
    }
    
    return slots;
  }, [businessStartTime, businessEndTime, timeSlotMinutes]);

  const resetForm = () => {
    setSelectedTable(null);
    setSelectedTime("");
  };

  const handleCreateReservation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const tableId = parseInt(formData.get("tableId") as string);
    const time = formData.get("time") as string;
    const customerName = formData.get("customerName") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const partySize = parseInt(formData.get("partySize") as string);
    const duration = parseInt(formData.get("duration") as string);
    const notes = formData.get("notes") as string;

    const reservationTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${time}:00`);

    createMutation.mutate({
      tableId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      partySize,
      reservationTime: reservationTime.toISOString(),
      duration,
      notes: notes || undefined,
    });
  };

  const handleUpdateReservation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingReservation) return;

    const formData = new FormData(e.currentTarget);
    
    const tableId = parseInt(formData.get("tableId") as string);
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const customerName = formData.get("customerName") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const partySize = parseInt(formData.get("partySize") as string);
    const duration = parseInt(formData.get("duration") as string);
    const status = formData.get("status") as string;
    const notes = formData.get("notes") as string;

    // 如果没有填写日期，使用当前选中的日期
    const reservationDate = date || format(selectedDate, "yyyy-MM-dd");
    const reservationTime = new Date(`${reservationDate}T${time}:00`);

    updateMutation.mutate({
      id: editingReservation.id,
      tableId,
      customerName,
      customerPhone: customerPhone || undefined,
      partySize,
      reservationTime: reservationTime.toISOString(),
      duration,
      status,
      notes: notes || undefined,
    });
  };

  const handleDeleteReservation = () => {
    if (!editingReservation) return;
    if (confirm("确定要删除这个预约吗？")) {
      deleteMutation.mutate({ id: editingReservation.id });
    }
  };

  const handleCellClick = (tableId: number, time: string) => {
    const now = Date.now();
    const cellKey = `${tableId}-${time}`;
    
    // 双击检测：500ms内点击同一单元格两次
    if (now - lastClickTime < 500 && lastClickCell === cellKey) {
      // 双击：打开创建对话框并预填信息
      setSelectedTable(tableId);
      setSelectedTime(time);
      setIsCreateDialogOpen(true);
      setLastClickTime(0);
      setLastClickCell("");
    } else {
      // 单击：记录点击时间和位置
      setLastClickTime(now);
      setLastClickCell(cellKey);
    }
  };

  const handleReservationClick = (reservation: any) => {
    setEditingReservation(reservation);
    setIsEditDialogOpen(true);
  };

  // 计算预约卡片的位置和宽度
  const getReservationStyle = (reservation: any) => {
    const resTime = typeof reservation.reservationTime === 'string' 
      ? parseISO(reservation.reservationTime) 
      : new Date(reservation.reservationTime);
    const resHour = resTime.getHours();
    const resMinute = resTime.getMinutes();
    const resMinutes = resHour * 60 + resMinute;
    
    const [startHour, startMinute] = String(businessStartTime).split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    
    const offsetMinutes = resMinutes - startMinutes;
    const slotIndex = Math.floor(offsetMinutes / timeSlotMinutes);
    
    // 计算宽度（包含缓冲时间）
    const totalDuration = reservation.duration + bufferMinutes;
    const slotsSpanned = Math.ceil(totalDuration / timeSlotMinutes);
    
    return {
      slotIndex,
      slotsSpanned,
      totalDuration,
    };
  };

  // 获取预约的显示颜色
  const getReservationColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500 border-green-700 text-white";
      case "pending":
        return "bg-yellow-500 border-yellow-700 text-white";
      case "cancelled":
        return "bg-red-500 border-red-700 text-white";
      case "completed":
        return "bg-blue-500 border-blue-700 text-white";
      case "no_show":
        return "bg-gray-500 border-gray-700 text-white";
      default:
        return "bg-orange-500 border-orange-700 text-white";
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "已确认";
      case "pending":
        return "待确认";
      case "cancelled":
        return "已取消";
      case "completed":
        return "已完成";
      case "no_show":
        return "未到店";
      default:
        return status;
    }
  };

  if (!tables || !reservations) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="flex-none bg-white p-4 pb-0">
        {/* 日期横条（包含日期切换、统计信息、操作按钮） */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* 左侧：圆角日期导航 */}
          <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="h-8 w-8 rounded-full hover:bg-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <span className="text-base font-bold px-2">
              {format(selectedDate, "M月d日", { locale: zhCN })}
              <span className="ml-1 text-sm font-normal text-gray-600">
                ({format(selectedDate, "E", { locale: zhCN })})
              </span>
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="h-8 w-8 rounded-full hover:bg-gray-200"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* 中间：统计信息（紧凑版） */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <div className="flex items-center gap-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-3 py-1.5 border border-blue-200">
              <span className="text-xs text-blue-600 font-medium">总预约</span>
              <span className="text-lg font-bold text-blue-700">
                {reservations?.filter(r => {
                  const resDate = typeof r.reservationTime === 'string' 
                    ? parseISO(r.reservationTime) 
                    : r.reservationTime;
                  return format(resDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                }).length || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg px-3 py-1.5 border border-green-200">
              <span className="text-xs text-green-600 font-medium">已到店</span>
              <span className="text-lg font-bold text-green-700">
                {reservations?.filter(r => {
                  const resDate = typeof r.reservationTime === 'string' 
                    ? parseISO(r.reservationTime) 
                    : r.reservationTime;
                  return format(resDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && r.status === 'completed';
                }).length || 0}
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg px-3 py-1.5 border border-orange-200">
              <span className="text-xs text-orange-600 font-medium">未到店</span>
              <span className="text-lg font-bold text-orange-700">
                {reservations?.filter(r => {
                  const resDate = typeof r.reservationTime === 'string' 
                    ? parseISO(r.reservationTime) 
                    : r.reservationTime;
                  return format(resDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && ['pending', 'confirmed'].includes(r.status);
                }).length || 0}
              </span>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>


      </div>

      {/* 日历网格 */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* 时间轴（顶部） */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="grid" style={{ gridTemplateColumns: `100px repeat(${timeSlots.length}, minmax(100px, 1fr))` }}>
              <div className="border-r border-gray-200 p-3 font-medium bg-white text-center text-sm text-gray-600">
                桌号
              </div>
              {timeSlots.map((time) => {
                // 判断是否为整点
                const isFullHour = time.endsWith(':00');
                const borderClass = isFullHour 
                  ? 'border-r border-slate-300' 
                  : 'border-r border-slate-200';
                const borderOpacity = isFullHour ? 'border-opacity-60' : 'border-opacity-40';
                
                return (
                  <div
                    key={time}
                    className={`${borderClass} ${borderOpacity} p-2 text-center text-sm text-slate-700 font-medium`}
                  >
                    {time}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 桌位行 */}
          {tables.map((table) => {
            const tableReservations = reservations.filter(r => r.tableId === table.id);
            
            return (
              <div
                key={table.id}
                className="border-b border-gray-200"
                style={{ minHeight: "80px" }}
              >
                <div className="grid relative" style={{ 
                  gridTemplateColumns: `100px repeat(${timeSlots.length}, minmax(100px, 1fr))`,
                  minHeight: "80px"
                }}>
                  {/* 桌号列 */}
                  <div className="border-r border-gray-200 p-3 bg-white sticky left-0 z-5 flex flex-col justify-center">
                    <div className="font-bold text-base">{table.tableNumber}号桌</div>
                    <div className="text-xs text-gray-500">{table.capacity}人</div>
                  </div>

                  {/* 时间槽 */}
                  {timeSlots.map((time) => {
                    // 检查是否为非营业时间（这里假设16:00之前为非营业时间）
                    const [hour] = String(time).split(":").map(Number);
                    const isNonBusinessHour = hour < 16; // 根据实际营业时间调整
                    
                    return (
                      <div
                        key={time}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          isNonBusinessHour ? "bg-gray-50" : "bg-white"
                        } ${(() => {
                          const isFullHour = time.endsWith(':00');
                          const borderClass = isFullHour 
                            ? 'border-r border-slate-300' 
                            : 'border-r border-slate-200';
                          const borderOpacity = isFullHour ? 'border-opacity-60' : 'border-opacity-40';
                          return `${borderClass} ${borderOpacity}`;
                        })()}`}
                        onClick={() => handleCellClick(table.id, time)}
                      />
                    );
                  })}

                  {/* 当前时间指示线 (Now Line) */}
                  {(() => {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    
                    // 计算当前时间在时间轴上的位置
                    const startHour = parseInt(timeSlots[0].split(':')[0]);
                    const startMinute = parseInt(timeSlots[0].split(':')[1]);
                    const endHour = parseInt(timeSlots[timeSlots.length - 1].split(':')[0]);
                    const endMinute = parseInt(timeSlots[timeSlots.length - 1].split(':')[1]);
                    
                    const currentTotalMinutes = currentHour * 60 + currentMinute;
                    const startTotalMinutes = startHour * 60 + startMinute;
                    const endTotalMinutes = endHour * 60 + endMinute;
                    
                    // 只在当前时间在时间轴范围内时显示
                    if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
                      const totalDuration = endTotalMinutes - startTotalMinutes;
                      const currentOffset = currentTotalMinutes - startTotalMinutes;
                      const percentage = (currentOffset / totalDuration) * 100;
                      
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-40 z-10 pointer-events-none"
                          style={{
                            left: `calc(100px + ${percentage}%)`,
                          }}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* 预约卡片（绝对定位） */}
                  {tableReservations.map((reservation) => {
                    const { slotIndex, slotsSpanned } = getReservationStyle(reservation);
                    const colorClass = getReservationColor(reservation.status);
                    const resTime = typeof reservation.reservationTime === 'string' 
                      ? parseISO(reservation.reservationTime) 
                      : reservation.reservationTime;
                    
                    // 根据预约状态显示不同颜色
                    const getStatusColor = (status: string) => {
                      if (status === 'completed') {
                        // 已到店：绿色
                        return {
                          bg: 'bg-gradient-to-r from-green-400 to-green-300',
                          shadow: '0 2px 8px rgba(34,197,94,0.2)',
                        };
                      } else if (status === 'cancelled') {
                        // 已取消：灰色
                        return {
                          bg: 'bg-gradient-to-r from-gray-400 to-gray-300',
                          shadow: '0 2px 8px rgba(156,163,175,0.2)',
                        };
                      } else if (status === 'no_show') {
                        // 未到店/爽约：红色
                        return {
                          bg: 'bg-gradient-to-r from-red-400 to-red-300',
                          shadow: '0 2px 8px rgba(239,68,68,0.2)',
                        };
                      } else {
                        // 未到店（pending, confirmed）：橙色
                        return {
                          bg: 'bg-gradient-to-r from-orange-400 to-orange-300',
                          shadow: '0 2px 8px rgba(255,152,0,0.2)',
                        };
                      }
                    };
                    
                    const statusColor = getStatusColor(reservation.status);
                    
                    return (
                      <Tooltip key={reservation.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute ${statusColor.bg} rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all`}
                            style={{
                              left: `calc(100px + ${slotIndex * (100 / timeSlots.length)}%)`,
                              width: `calc(${slotsSpanned * (100 / timeSlots.length)}% - 8px)`,
                              top: "8px",
                              height: "calc(100% - 16px)",
                              zIndex: 1,
                              boxShadow: statusColor.shadow,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReservationClick(reservation);
                            }}
                          >
                            <div className="text-sm font-bold text-gray-800 truncate">{reservation.customerName}</div>
                            <div className="text-xs text-gray-700 mt-0.5">{reservation.partySize}人</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2">
                            <div className="font-bold text-base">{reservation.customerName}</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">桌号：</span>
                                <span className="font-medium">{tables.find(t => t.id === reservation.tableId)?.tableNumber}号桌</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">人数：</span>
                                <span className="font-medium">{reservation.partySize}人</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">时间：</span>
                                <span className="font-medium">{format(resTime, "HH:mm")}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">时长：</span>
                                <span className="font-medium">{reservation.duration}分钟</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">状态：</span>
                                <span className="font-medium">{getStatusText(reservation.status)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">电话：</span>
                                <span className="font-medium">{reservation.customerPhone}</span>
                              </div>
                            </div>
                            {reservation.customerEmail && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">邮箱：</span>
                                <span className="font-medium">{reservation.customerEmail}</span>
                              </div>
                            )}
                            {reservation.notes && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">备注：</span>
                                <span className="font-medium">{reservation.notes}</span>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 创建预约对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-black rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">新建预约</DialogTitle>
            <DialogDescription>
              填写预约信息并提交
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateReservation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tableId">桌位</Label>
                <Select name="tableId" defaultValue={selectedTable?.toString()} required>
                  <SelectTrigger className="border-2 border-black rounded-none">
                    <SelectValue placeholder="选择桌位" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables?.map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        {table.tableNumber}号桌 ({table.capacity}人)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time">预约时间</Label>
                <Select name="time" defaultValue={selectedTime} required>
                  <SelectTrigger className="border-2 border-black rounded-none">
                    <SelectValue placeholder="选择时间" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customerName">客户姓名</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  required
                  className="border-2 border-black rounded-none"
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">客户电话</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  required
                  className="border-2 border-black rounded-none"
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">客户邮箱（选填）</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  className="border-2 border-black rounded-none"
                />
              </div>

              <div>
                <Label htmlFor="partySize">用餐人数</Label>
                <Input
                  id="partySize"
                  name="partySize"
                  type="number"
                  min="1"
                  defaultValue="2"
                  required
                  className="border-2 border-black rounded-none"
                />
              </div>

              <div>
                <Label htmlFor="duration">预计时长（分钟）</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="30"
                  step="30"
                  defaultValue="120"
                  required
                  className="border-2 border-black rounded-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">备注（选填）</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                className="border-2 border-black rounded-none"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-2 border-black rounded-none"
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-black text-white hover:bg-gray-800 border-2 border-black rounded-none"
              >
                创建预约
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑预约对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-black rounded-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">编辑预约</DialogTitle>
            <DialogDescription>
              修改预约信息或删除预约
            </DialogDescription>
          </DialogHeader>

          {editingReservation && (
            <form onSubmit={handleUpdateReservation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tableId">桌位</Label>
                  <Select name="tableId" defaultValue={editingReservation.tableId.toString()} required>
                    <SelectTrigger className="border-2 border-black rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tables?.map((table) => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          {table.tableNumber}号桌 ({table.capacity}人)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-date">预约日期</Label>
                  <Input
                    id="edit-date"
                    name="date"
                    type="date"
                    defaultValue={format(
                      typeof editingReservation.reservationTime === 'string' 
                        ? parseISO(editingReservation.reservationTime) 
                        : new Date(editingReservation.reservationTime), 
                      "yyyy-MM-dd"
                    )}
                    className="border-2 border-black rounded-none"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-time">预约时间</Label>
                  <Select
                    name="time"
                    defaultValue={format(
                      typeof editingReservation.reservationTime === 'string' 
                        ? parseISO(editingReservation.reservationTime) 
                        : new Date(editingReservation.reservationTime), 
                      "HH:mm"
                    )}
                    required
                  >
                    <SelectTrigger className="border-2 border-black rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-customerName">客户姓名</Label>
                  <Input
                    id="edit-customerName"
                    name="customerName"
                    defaultValue={editingReservation.customerName}
                    required
                    className="border-2 border-black rounded-none"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-customerPhone">客户电话（可选）</Label>
                  <Input
                    id="edit-customerPhone"
                    name="customerPhone"
                    type="tel"
                    defaultValue={editingReservation.customerPhone || ""}
                    className="border-2 border-black rounded-none"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-partySize">用餐人数</Label>
                  <Input
                    id="edit-partySize"
                    name="partySize"
                    type="number"
                    min="1"
                    defaultValue={editingReservation.partySize}
                    required
                    className="border-2 border-black rounded-none"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-duration">预计时长（分钟）</Label>
                  <Input
                    id="edit-duration"
                    name="duration"
                    type="number"
                    min="30"
                    step="30"
                    defaultValue={editingReservation.duration}
                    required
                    className="border-2 border-black rounded-none"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-status">预约状态</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={['pending', 'confirmed'].includes(editingReservation.status) ? 'default' : 'outline'}
                      className={`flex-1 border-2 border-black rounded-none ${
                        ['pending', 'confirmed'].includes(editingReservation.status)
                          ? 'bg-gradient-to-r from-orange-400 to-orange-300 hover:from-orange-500 hover:to-orange-400 text-gray-800'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget.closest('form');
                        const statusInput = form?.querySelector('input[name="status"]') as HTMLInputElement;
                        if (statusInput) statusInput.value = 'confirmed';
                        setEditingReservation({ ...editingReservation, status: 'confirmed' });
                      }}
                    >
                      预约未到店
                    </Button>
                    <Button
                      type="button"
                      variant={editingReservation.status === 'completed' ? 'default' : 'outline'}
                      className={`flex-1 border-2 border-black rounded-none ${
                        editingReservation.status === 'completed'
                          ? 'bg-gradient-to-r from-green-400 to-green-300 hover:from-green-500 hover:to-green-400 text-gray-800'
                          : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget.closest('form');
                        const statusInput = form?.querySelector('input[name="status"]') as HTMLInputElement;
                        if (statusInput) statusInput.value = 'completed';
                        setEditingReservation({ ...editingReservation, status: 'completed' });
                      }}
                    >
                      预约已到店
                    </Button>
                  </div>
                  <input type="hidden" name="status" value={editingReservation.status} />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">备注</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  rows={3}
                  defaultValue={editingReservation.notes || ""}
                  className="border-2 border-black rounded-none"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteReservation}
                  className="border-2 border-black rounded-none"
                >
                  删除预约
                </Button>
                <div className="flex-1" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-2 border-black rounded-none"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black rounded-none"
                >
                  保存修改
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}
