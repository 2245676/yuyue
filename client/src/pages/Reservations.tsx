import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, subDays, startOfDay, endOfDay, setHours, setMinutes, isSameDay, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useSwipeable } from "react-swipeable";

export default function Reservations() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any>(null);

  const utils = trpc.useUtils();

  const createMutation = trpc.reservation.create.useMutation({
    onSuccess: () => {
      utils.reservation.getByDateRange.invalidate();
      setShowCreateDialog(false);
      toast.success("预约创建成功");
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.reservation.update.useMutation({
    onSuccess: () => {
      utils.reservation.getByDateRange.invalidate();
      setShowEditDialog(false);
      setEditingReservation(null);
      toast.success("预约更新成功");
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.reservation.delete.useMutation({
    onSuccess: () => {
      utils.reservation.getByDateRange.invalidate();
      toast.success("预约已删除");
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const reservationTime = new Date(`${date}T${time}`);
    
    createMutation.mutate({
      tableId: parseInt(formData.get("tableId") as string),
      customerName: formData.get("customerName") as string,
      customerPhone: formData.get("customerPhone") as string,
      customerEmail: formData.get("customerEmail") as string || undefined,
      partySize: parseInt(formData.get("partySize") as string),
      reservationTime: reservationTime.toISOString(),
      duration: parseInt(formData.get("duration") as string),
      status: formData.get("status") as string,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const reservationTime = new Date(`${date}T${time}`);
    
    updateMutation.mutate({
      id: editingReservation.id,
      tableId: parseInt(formData.get("tableId") as string),
      customerName: formData.get("customerName") as string,
      customerPhone: formData.get("customerPhone") as string,
      customerEmail: formData.get("customerEmail") as string || undefined,
      partySize: parseInt(formData.get("partySize") as string),
      reservationTime: reservationTime.toISOString(),
      duration: parseInt(formData.get("duration") as string),
      status: formData.get("status") as string,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个预约吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleReservationClick = (reservation: any) => {
    setEditingReservation(reservation);
    setShowEditDialog(true);
  };

  // 获取当天的预约数据
  const { data: reservations, isLoading } = trpc.reservation.getByDateRange.useQuery({
    startDate: startOfDay(selectedDate).toISOString(),
    endDate: endOfDay(selectedDate).toISOString(),
  });

  // 获取所有桌位
  const { data: tables } = trpc.table.listActive.useQuery();

  // 手势操作：左滑下一天，右滑上一天
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setSelectedDate(addDays(selectedDate, 1)),
    onSwipedRight: () => setSelectedDate(subDays(selectedDate, 1)),
    trackMouse: false,
  });

  // 生成时间轴（9:00 - 23:00）
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour <= 23; hour++) {
      slots.push({
        hour,
        label: `${hour.toString().padStart(2, "0")}:00`,
      });
    }
    return slots;
  }, []);

  // 按桌位分组预约
  const reservationsByTable = useMemo(() => {
    if (!reservations || !tables) return {};

    const grouped: Record<number, typeof reservations> = {};
    
    tables.forEach((table) => {
      grouped[table.id] = reservations.filter((r) => r.tableId === table.id);
    });

    return grouped;
  }, [reservations, tables]);

  // 计算预约卡片的位置
  const getReservationPosition = (reservationTime: Date | string, duration: number) => {
    const time = typeof reservationTime === "string" ? parseISO(reservationTime) : reservationTime;
    const hour = time.getHours();
    const minute = time.getMinutes();
    
    // 计算距离9:00的偏移量（以小时为单位）
    const offsetHours = hour - 9 + minute / 60;
    const top = offsetHours * 80; // 每小时80px
    
    // 计算高度
    const height = (duration / 60) * 80;
    
    return { top, height };
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500 border-green-700";
      case "pending":
        return "bg-yellow-500 border-yellow-700";
      case "cancelled":
        return "bg-red-500 border-red-700";
      case "completed":
        return "bg-blue-500 border-blue-700";
      case "no_show":
        return "bg-gray-500 border-gray-700";
      default:
        return "bg-orange-500 border-orange-700";
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

  const goToPreviousDay = () => {
    setSelectedDate((prev) => addDays(prev, -1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" {...swipeHandlers}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-border pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">预约管理</h1>
          <p className="text-muted-foreground font-mono mt-2">查看和管理餐厅预约</p>
        </div>
        <Button className="neo-box rounded-none font-bold" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建预约
        </Button>
      </div>

      {/* Date Navigation */}
      <Card className="neo-box rounded-none p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            className="rounded-none border-2"
            onClick={goToPreviousDay}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-black">
                {format(selectedDate, "yyyy年MM月dd日", { locale: zhCN })}
              </div>
              <div className="text-sm text-muted-foreground font-mono">
                {format(selectedDate, "EEEE", { locale: zhCN })}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-2 font-bold"
              onClick={goToToday}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              今天
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="rounded-none border-2"
            onClick={goToNextDay}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Calendar View */}
      <Card className="neo-box rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          {/* Table Headers */}
          <div className="flex border-b-2 border-border bg-background">
            <div className="w-16 md:w-20 flex-shrink-0 border-r-2 border-border p-1 md:p-2">
              <div className="text-xs font-black text-center">时间</div>
            </div>
            <div className="flex-1 flex">
              {tables?.map((table) => (
                <div
                  key={table.id}
                  className="flex-1 min-w-[100px] md:min-w-[120px] border-r-2 border-border p-1 md:p-2 bg-muted">
                  <div className="text-xs md:text-sm font-black text-center">{table.tableNumber}</div>
                  <div className="text-xs text-muted-foreground text-center font-mono">
                    {table.capacity}人
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Slots and Reservations */}
          <div className="flex relative">
            {/* Time Column */}
            <div className="w-16 md:w-20 flex-shrink-0 border-r-2 border-border">
              {timeSlots.map((slot) => (
                <div
                  key={slot.hour}
                  className="h-16 md:h-20 border-b border-border flex items-center justify-center">
                  <div className="text-xs font-mono font-bold">{slot.label}</div>
                </div>
              ))}
            </div>

            {/* Reservation Columns */}
            <div className="flex-1 flex relative">
              {tables?.map((table) => {
                const slotHeight = typeof window !== 'undefined' && window.innerWidth < 768 ? 64 : 80;
                return (
                <div
                  key={table.id}
                  className="flex-1 min-w-[100px] md:min-w-[120px] border-r-2 border-border relative"
                  style={{ height: `${timeSlots.length * slotHeight}px` }}>
                  {/* Hour Lines */}
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.hour}
                      className="absolute left-0 right-0 h-20 border-b border-border"
                      style={{ top: `${(slot.hour - 9) * 80}px` }}
                    />
                  ))}

                  {/* Reservations */}
                  {reservationsByTable[table.id]?.map((reservation) => {
                    const { top, height } = getReservationPosition(
                      reservation.reservationTime,
                      reservation.duration
                    );
                    const time = typeof reservation.reservationTime === "string" 
                      ? parseISO(reservation.reservationTime) 
                      : reservation.reservationTime;

                    return (
                      <div
                        key={reservation.id}
                        className={`absolute left-1 right-1 p-2 border-2 ${getStatusColor(
                          reservation.status
                        )} text-white rounded-sm cursor-pointer hover:opacity-80 transition-opacity overflow-hidden`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        title={`${reservation.customerName} - ${reservation.partySize}人`}
                        onClick={() => handleReservationClick(reservation)}
                      >
                        <div className="text-xs font-bold truncate">
                          {format(time, "HH:mm")}
                        </div>
                        <div className="text-sm font-black truncate">
                          {reservation.customerName}
                        </div>
                        <div className="text-xs font-mono truncate">
                          {reservation.partySize}人 · {getStatusText(reservation.status)}
                        </div>
                        {reservation.notes && (
                          <div className="text-xs truncate opacity-80 mt-1">
                            {reservation.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {(!tables || tables.length === 0) && (
        <Card className="neo-box rounded-none p-12 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-black text-xl mb-2">还没有桌位</h3>
          <p className="text-muted-foreground font-mono mb-4">
            请先在桌位管理中添加桌位
          </p>
        </Card>
      )}

      {/* Create Reservation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="neo-box rounded-none max-w-md md:max-w-md w-full md:w-auto h-full md:h-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl">新建预约</DialogTitle>
            <DialogDescription className="font-mono">
              填写预约信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tableId" className="font-bold">桌位</Label>
                <Select name="tableId" required>
                  <SelectTrigger className="rounded-none border-2">
                    <SelectValue placeholder="选择桌位" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables?.map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        {table.tableNumber} - {table.capacity}人
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="font-bold">日期</Label>
                  <Input
                    type="date"
                    name="date"
                    required
                    defaultValue={format(selectedDate, "yyyy-MM-dd")}
                    className="rounded-none border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="font-bold">时间</Label>
                  <Input
                    type="time"
                    name="time"
                    required
                    className="rounded-none border-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName" className="font-bold">客户姓名</Label>
                <Input
                  name="customerName"
                  required
                  className="rounded-none border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="font-bold">联系电话</Label>
                <Input
                  name="customerPhone"
                  required
                  className="rounded-none border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="font-bold">邮箱（可选）</Label>
                <Input
                  type="email"
                  name="customerEmail"
                  className="rounded-none border-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partySize" className="font-bold">人数</Label>
                  <Input
                    type="number"
                    name="partySize"
                    required
                    min="1"
                    defaultValue="2"
                    className="rounded-none border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-bold">时长（分钟）</Label>
                  <Input
                    type="number"
                    name="duration"
                    required
                    min="30"
                    step="30"
                    defaultValue="120"
                    className="rounded-none border-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="font-bold">状态</Label>
                <Select name="status" defaultValue="pending">
                  <SelectTrigger className="rounded-none border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待确认</SelectItem>
                    <SelectItem value="confirmed">已确认</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="font-bold">备注（可选）</Label>
                <Textarea
                  name="notes"
                  className="rounded-none border-2"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-2"
                onClick={() => setShowCreateDialog(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="neo-box rounded-none font-bold"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "创建中..." : "创建预约"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Reservation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="neo-box rounded-none max-w-md md:max-w-md w-full md:w-auto h-full md:h-auto overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl">编辑预约</DialogTitle>
            <DialogDescription className="font-mono">
              修改预约信息
            </DialogDescription>
          </DialogHeader>
          {editingReservation && (
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tableId" className="font-bold">桌位</Label>
                  <Select name="tableId" defaultValue={editingReservation.tableId.toString()}>
                    <SelectTrigger className="rounded-none border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tables?.map((table) => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          {table.tableNumber} - {table.capacity}人
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="font-bold">日期</Label>
                    <Input
                      type="date"
                      name="date"
                      required
                      defaultValue={format(
                        typeof editingReservation.reservationTime === "string"
                          ? parseISO(editingReservation.reservationTime)
                          : editingReservation.reservationTime,
                        "yyyy-MM-dd"
                      )}
                      className="rounded-none border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="font-bold">时间</Label>
                    <Input
                      type="time"
                      name="time"
                      required
                      defaultValue={format(
                        typeof editingReservation.reservationTime === "string"
                          ? parseISO(editingReservation.reservationTime)
                          : editingReservation.reservationTime,
                        "HH:mm"
                      )}
                      className="rounded-none border-2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="font-bold">客户姓名</Label>
                  <Input
                    name="customerName"
                    required
                    defaultValue={editingReservation.customerName}
                    className="rounded-none border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="font-bold">联系电话</Label>
                  <Input
                    name="customerPhone"
                    required
                    defaultValue={editingReservation.customerPhone}
                    className="rounded-none border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="font-bold">邮箱（可选）</Label>
                  <Input
                    type="email"
                    name="customerEmail"
                    defaultValue={editingReservation.customerEmail || ""}
                    className="rounded-none border-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partySize" className="font-bold">人数</Label>
                    <Input
                      type="number"
                      name="partySize"
                      required
                      min="1"
                      defaultValue={editingReservation.partySize}
                      className="rounded-none border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="font-bold">时长（分钟）</Label>
                    <Input
                      type="number"
                      name="duration"
                      required
                      min="30"
                      step="30"
                      defaultValue={editingReservation.duration}
                      className="rounded-none border-2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="font-bold">状态</Label>
                  <Select name="status" defaultValue={editingReservation.status}>
                    <SelectTrigger className="rounded-none border-2">
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
                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-bold">备注（可选）</Label>
                  <Textarea
                    name="notes"
                    defaultValue={editingReservation.notes || ""}
                    className="rounded-none border-2"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-none border-2 font-bold"
                  onClick={() => {
                    handleDelete(editingReservation.id);
                    setShowEditDialog(false);
                  }}
                >
                  删除
                </Button>
                <div className="flex gap-2 flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-none border-2 flex-1"
                    onClick={() => setShowEditDialog(false)}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="neo-box rounded-none font-bold flex-1"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "更新中..." : "保存"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
