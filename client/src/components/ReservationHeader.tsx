import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ReservationHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onCreateClick: () => void;
  reservations: any[];
}

export function ReservationHeader({
  selectedDate,
  onDateChange,
  onCreateClick,
  reservations
}: ReservationHeaderProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // 计算统计数据
  const totalReservations = reservations?.filter(r => {
    const resDate = typeof r.reservationTime === 'string' 
      ? parseISO(r.reservationTime) 
      : r.reservationTime;
    return format(resDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  }).length || 0;

  const completedReservations = reservations?.filter(r => {
    const resDate = typeof r.reservationTime === 'string' 
      ? parseISO(r.reservationTime) 
      : r.reservationTime;
    return format(resDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && r.status === 'completed';
  }).length || 0;

  const pendingReservations = reservations?.filter(r => {
    const resDate = typeof r.reservationTime === 'string' 
      ? parseISO(r.reservationTime) 
      : r.reservationTime;
    return format(resDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && ['pending', 'confirmed'].includes(r.status);
  }).length || 0;

  return (
    <div className="flex-none bg-white border-b border-gray-200">
      {/* 标题行：包含标题和统计信息 */}
      <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">餐厅预约系统</h1>
        
        {/* 统计信息：移动端居中换行，桌面端水平排列 */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg px-2.5 py-1.5 border border-blue-200">
            <span className="text-xs text-blue-600 font-medium whitespace-nowrap">总预约</span>
            <span className="text-base font-bold text-blue-700">{totalReservations}</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg px-2.5 py-1.5 border border-green-200">
            <span className="text-xs text-green-600 font-medium whitespace-nowrap">已到店</span>
            <span className="text-base font-bold text-green-700">{completedReservations}</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg px-2.5 py-1.5 border border-orange-200">
            <span className="text-xs text-orange-600 font-medium whitespace-nowrap">未到店</span>
            <span className="text-base font-bold text-orange-700">{pendingReservations}</span>
          </div>
        </div>
      </div>

      {/* 日期横条：日期切换 + 新建按钮 */}
      <div className="px-4 py-3 flex items-center justify-between gap-4 border-t border-gray-100">
        {/* 左侧：圆角日期导航 */}
        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDateChange(subDays(selectedDate, 1))}
            className="h-8 w-8 rounded-full hover:bg-gray-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="text-base font-bold px-2 hover:bg-gray-200 rounded-full"
              >
                {format(selectedDate, "M月d日", { locale: zhCN })}
                <span className="ml-1 text-sm font-normal text-gray-600">
                  ({format(selectedDate, "E", { locale: zhCN })})
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(date);
                    setIsDatePickerOpen(false);
                  }
                }}
                locale={zhCN}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDateChange(addDays(selectedDate, 1))}
            className="h-8 w-8 rounded-full hover:bg-gray-200"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* 右侧：新建按钮 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onCreateClick}
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full hover:bg-gray-100"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
