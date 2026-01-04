import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TABLE_COLUMN_WIDTH } from "@/config/layoutConfig";
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
    const time = formData.get("time") as string;
    const customerName = formData.get("customerName") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const partySize = parseInt(formData.get("partySize") as string);
    const duration = parseInt(formData.get("duration") as string);
    const status = formData.get("status") as string;
    const notes = formData.get("notes") as string;

    const reservationTime = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${time}:00`);

    updateMutation.mutate({
      id: editingReservation.id,
      tableId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
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
        {/* 日期选择器和操作按钮 */}
        <div className="flex items-center justify-between mb-4">
          {/* 圆角日期导航 */}
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

          {/* 右侧按钮 */}
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

        {/* 标签页切换 */}
        <div className="flex items-center gap-8 border-b border-gray-200">
          <button className="relative pb-3 text-orange-500 font-medium">
            タイムスケジュール
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
          </button>
          <button className="pb-3 text-gray-500 font-medium hover:text-gray-700">
            リスト
          </button>
        </div>
      </div>

      {/* 日历网格 */}
      <div className="flex-1 overflow-auto pb-32">
        <div className="min-w-max">
          {/* 时间轴（顶部） */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="grid" style={{ gridTemplateColumns: `${TABLE_COLUMN_WIDTH}px repeat(${timeSlots.length}, minmax(100px, 1fr))` }}>
              <div className="border-r border-gray-200 p-3 font-medium bg-white text-center text-sm text-gray-600">
                桌号
              </div>
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="border-r border-gray-200 p-2 text-center font-medium text-sm text-gray-700"
                >
                  {time}
                </div>
              ))}
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
                  gridTemplateColumns: `${TABLE_COLUMN_WIDTH}px repeat(${timeSlots.length}, minmax(100px, 1fr))`,
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
                        className={`border-r border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isNonBusinessHour ? "bg-gray-50" : "bg-white"
                        }`}
                        onClick={() => handleCellClick(table.id, time)}
                      />
                    );
                  })}

                  {/* 预约卡片（绝对定位） */}
                  {tableReservations.map((reservation) => {
                    const { slotIndex, slotsSpanned } = getReservationStyle(reservation);
                    const colorClass = getReservationColor(reservation.status);
                    const resTime = typeof reservation.reservationTime === 'string' 
                      ? parseISO(reservation.reservationTime) 
                      : reservation.reservationTime;
                    
                    return (
                      <Tooltip key={reservation.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute bg-gradient-to-r from-orange-400 to-orange-300 rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all"
                            style={{
                              left: `calc(${TABLE_COLUMN_WIDTH}px + ${slotIndex * (100 / timeSlots.length)}%)`,
                              width: `calc(${slotsSpanned * (100 / timeSlots.length)}% - 8px)`,
                              top: "8px",
                              height: "calc(100% - 16px)",
                              zIndex: 1,
                              boxShadow: "0 2px 8px rgba(255,152,0,0.2)",
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
                  <Label htmlFor="edit-customerPhone">客户电话</Label>
                  <Input
                    id="edit-customerPhone"
                    name="customerPhone"
                    type="tel"
                    defaultValue={editingReservation.customerPhone}
                    required
                    className="border-2 border-black rounded-none"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-customerEmail">客户邮箱</Label>
                  <Input
                    id="edit-customerEmail"
                    name="customerEmail"
                    type="email"
                    defaultValue={editingReservation.customerEmail || ""}
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
                  <Select name="status" defaultValue={editingReservation.status} required>
                    <SelectTrigger className="border-2 border-black rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">待确认</SelectItem>
                      <SelectItem value="confirmed">已确认</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                      <SelectItem value="no_show">未到店</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* 底部浮动按钮 */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
        <button className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          关闭今日预约
        </button>
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        {/* 顶部橙色指示条 */}
        <div className="absolute top-0 left-0 w-1/4 h-1 bg-orange-500"></div>
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center gap-1 px-4 py-2 text-orange-500 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">予約一覧</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className="text-xs font-medium">ブロック</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-700 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-xs font-medium">通知一覧</span>
            <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>
          
          <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-700 relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-xs font-medium">その他</span>
            <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
