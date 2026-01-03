import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export default function Tables() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: tables, isLoading } = trpc.table.listActive.useQuery();

  const createMutation = trpc.table.create.useMutation({
    onSuccess: () => {
      utils.table.listActive.invalidate();
      setIsCreateDialogOpen(false);
      toast.success("桌位创建成功");
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.table.update.useMutation({
    onSuccess: () => {
      utils.table.listActive.invalidate();
      setIsEditDialogOpen(false);
      setEditingTable(null);
      toast.success("桌位更新成功");
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.table.delete.useMutation({
    onSuccess: () => {
      utils.table.listActive.invalidate();
      toast.success("桌位已删除");
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const area = formData.get("area") as string;
    const type = formData.get("type") as string;
    const notes = formData.get("notes") as string;
    
    createMutation.mutate({
      tableNumber: formData.get("tableNumber") as string,
      capacity: parseInt(formData.get("capacity") as string),
      ...(area && { area }),
      ...(type && { type }),
      ...(notes && { notes }),
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const area = formData.get("area") as string;
    const type = formData.get("type") as string;
    const notes = formData.get("notes") as string;
    
    updateMutation.mutate({
      id: editingTable.id,
      tableNumber: formData.get("tableNumber") as string,
      capacity: parseInt(formData.get("capacity") as string),
      ...(area && { area }),
      ...(type && { type }),
      ...(notes && { notes }),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个桌位吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-border pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">桌位管理</h1>
          <p className="text-muted-foreground font-mono mt-2">管理餐厅的所有桌位信息</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="neo-box rounded-none font-bold">
              <Plus className="w-4 h-4 mr-2" />
              添加桌位
            </Button>
          </DialogTrigger>
          <DialogContent className="neo-box rounded-none">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="font-black text-2xl">创建新桌位</DialogTitle>
                <DialogDescription className="font-mono">
                  填写桌位的基本信息
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tableNumber" className="font-bold">桌号 *</Label>
                  <Input
                    id="tableNumber"
                    name="tableNumber"
                    placeholder="例如: A1, B2, VIP1"
                    required
                    className="rounded-none border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity" className="font-bold">容纳人数 *</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="例如: 4"
                    required
                    className="rounded-none border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="area" className="font-bold">区域</Label>
                  <Input
                    id="area"
                    name="area"
                    placeholder="例如: 大厅, 包间, 靠窗"
                    className="rounded-none border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type" className="font-bold">类型</Label>
                  <Input
                    id="type"
                    name="type"
                    placeholder="例如: 普通桌, VIP桌"
                    className="rounded-none border-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="font-bold">备注</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="其他说明..."
                    className="rounded-none border-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="neo-box rounded-none font-bold" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "创建中..." : "创建"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables?.map((table) => (
          <Card key={table.id} className="neo-box rounded-none">
            <CardHeader className="border-b-2 border-border pb-4">
              <CardTitle className="font-black text-xl flex items-center justify-between">
                <span>{table.tableNumber}</span>
                <div className="flex items-center gap-2 text-sm font-mono">
                  <Users className="w-4 h-4" />
                  {table.capacity}人
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {table.area && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-bold">区域:</span>
                  <span className="font-mono">{table.area}</span>
                </div>
              )}
              {table.type && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-bold">类型:</span>
                  <span className="font-mono">{table.type}</span>
                </div>
              )}
              {table.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground font-bold">备注:</span>
                  <p className="font-mono mt-1 text-xs">{table.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t-2 border-dashed border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-none border-2 font-bold"
                  onClick={() => {
                    setEditingTable(table);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-none border-2 font-bold text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(table.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tables?.length === 0 && (
        <Card className="neo-box rounded-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-black text-xl mb-2">还没有桌位</h3>
            <p className="text-muted-foreground font-mono mb-4">点击上方按钮添加第一个桌位</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="neo-box rounded-none">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle className="font-black text-2xl">编辑桌位</DialogTitle>
              <DialogDescription className="font-mono">
                修改桌位信息
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tableNumber" className="font-bold">桌号 *</Label>
                <Input
                  id="edit-tableNumber"
                  name="tableNumber"
                  defaultValue={editingTable?.tableNumber}
                  required
                  className="rounded-none border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-capacity" className="font-bold">容纳人数 *</Label>
                <Input
                  id="edit-capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue={editingTable?.capacity}
                  required
                  className="rounded-none border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-area" className="font-bold">区域</Label>
                <Input
                  id="edit-area"
                  name="area"
                  defaultValue={editingTable?.area || ""}
                  className="rounded-none border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type" className="font-bold">类型</Label>
                <Input
                  id="edit-type"
                  name="type"
                  defaultValue={editingTable?.type || ""}
                  className="rounded-none border-2"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes" className="font-bold">备注</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editingTable?.notes || ""}
                  className="rounded-none border-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="neo-box rounded-none font-bold" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
