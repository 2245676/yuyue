import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [savingItems, setSavingItems] = useState<Set<number>>(new Set());
  
  const { data: items, refetch } = trpc.item.list.useQuery();
  const updateStockMutation = trpc.item.updateStock.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`保存失败：${error.message}`);
    },
  });

  // 按分类分组
  const groupedItems = items?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // 过滤搜索
  const filteredGroupedItems = Object.entries(groupedItems || {}).reduce((acc, [category, categoryItems]) => {
    const filtered = categoryItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendor?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, typeof items>);

  // 切换分类展开/折叠
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // 默认展开所有分类
  useEffect(() => {
    if (groupedItems) {
      setExpandedCategories(new Set(Object.keys(groupedItems)));
    }
  }, [items]);

  // 处理库存更新
  const handleStockUpdate = async (itemId: number, value: string) => {
    const stockRemaining = parseInt(value);
    if (isNaN(stockRemaining) || stockRemaining < 0) {
      toast.error("请输入有效的数字（>=0）");
      return;
    }

    setSavingItems(prev => new Set(prev).add(itemId));
    
    try {
      await updateStockMutation.mutateAsync({
        id: itemId,
        stockRemaining,
      });
      toast.success("已保存");
    } finally {
      setSavingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部搜索栏 - 固定 */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="搜索菜品名称或渠道..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="container mx-auto p-4 space-y-4">
        {Object.entries(filteredGroupedItems).map(([category, categoryItems]) => (
          <Card key={category} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors p-4"
              onClick={() => toggleCategory(category)}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <span>{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-normal">
                    {categoryItems?.length || 0} 项
                  </span>
                  {expandedCategories.has(category) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>

            {expandedCategories.has(category) && (
              <CardContent className="p-0">
                <div className="divide-y">
                  {categoryItems?.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base">{item.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          {item.vendor && <span>{item.vendor}</span>}
                          <span>·</span>
                          <span>{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          defaultValue={item.stockRemaining}
                          onBlur={(e) => handleStockUpdate(item.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-24 h-12 text-center text-lg font-bold"
                          disabled={savingItems.has(item.id)}
                        />
                        {savingItems.has(item.id) && (
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            保存中...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {Object.keys(filteredGroupedItems).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? "没有找到匹配的菜品" : "暂无库存数据"}
          </div>
        )}
      </div>
    </div>
  );
}
