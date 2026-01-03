import { trpc } from "@/lib/trpc";
import Reservations from "./Reservations";
import ReservationsTableView from "./ReservationsTableView";

export default function ReservationsWrapper() {
  const { data: configs, isLoading } = trpc.config.getAll.useQuery();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }
  
  const viewStyle = configs?.find(c => c.configKey === "reservation_view_style")?.configValue || "table";
  
  // 根据配置选择视图
  if (viewStyle === "timeline") {
    return <Reservations />;
  }
  
  return <ReservationsTableView />;
}
