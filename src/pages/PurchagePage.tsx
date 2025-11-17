import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchPurchaseOrders,
  fetchPurchaseOrderItems,
  createPurchaseOrder,
  createPurchaseOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
} from "@/lib/apis/purchaseOrders";

import { supabase } from "@/lib/apis/supabaseClient";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusColor: Record<string, string> = {
  요청: "bg-blue-100 text-blue-700",
  진행중: "bg-amber-100 text-amber-700",
  완료: "bg-green-100 text-green-700",
  취소: "bg-gray-200 text-gray-500",
};
// 재료 선택 셀렉트박스 컴포넌트
interface IngredientSelectProps {
  ingredients: { id: number; name: string; unit: string }[];
  value: number;
  onChange: (id: number) => void;
}

function IngredientSelect({
  ingredients,
  value,
  onChange,
}: IngredientSelectProps) {
  return (
    <Select
      value={value ? String(value) : undefined}
      onValueChange={(val) => onChange(Number(val))}
    >
      <SelectTrigger className="w-32 h-9 text-xs px-2">
        <SelectValue placeholder="재료 선택" />
      </SelectTrigger>
      <SelectContent>
        {ingredients.map((ing) => (
          <SelectItem key={ing.id} value={String(ing.id)} className="text-xs">
            {ing.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const PurchagePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<PurchaseOrder>>({
    store_id: 1,
    supplier_name: "",
    order_number: "",
    status: "요청",
    note: "",
  });
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PurchaseOrderItem>>({
    purchase_order_id: 0,
    ingredient_id: 0,
    unit: "",
    requested_qty: 0,
    unit_price: 0,
    note: "",
  });
  const [ingredients, setIngredients] = useState<
    { id: number; name: string; unit: string }[]
  >([]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchaseOrders(1);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  // 발주 완료 처리 함수
  const handleCompleteOrder = async (order: PurchaseOrder) => {
    try {
      // 1. 상태 변경
      const { error: updateError } = await supabase
        .from("purchase_orders")
        .update({ status: "입고완료", received_at: new Date() })
        .eq("id", order.id);
      if (updateError) throw updateError;

      const { data: items, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select("ingredient_id, requested_qty, received_qty")
        .eq("purchase_order_id", order.id);
      if (itemsError) throw itemsError;

      // 3. 각 재료의 재고 업데이트
      for (const item of items) {
        const { error: stockError } = await supabase.rpc(
          "increment_ingredient_stock",
          {
            ingredient_id: item.ingredient_id,
            qty: item.requested_qty,
          }
        );
        if (stockError) throw stockError;
      }

      toast({
        title: "발주 완료 처리",
        description: `발주가 완료 처리되고 재고가 반영되었습니다.`,
        variant: "default",
      });
      loadOrders();
    } catch (err: any) {
      toast({
        title: "오류",
        description: err?.message || "발주 완료 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadOrders();
    // fetch ingredients for item select
    supabase
      .from("ingredients")
      .select("id, name, unit")
      .then(({ data }) => {
        setIngredients(data || []);
      });
  }, []);

  const openOrderItems = async (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setItemDialogOpen(true);
    const items = await fetchPurchaseOrderItems(order.id);
    setOrderItems(items);
    setNewItem({
      purchase_order_id: order.id,
      ingredient_id: ingredients[0]?.id || 0,
      unit: ingredients[0]?.unit || "",
      requested_qty: 0,
      unit_price: 0,
      note: "",
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/manager")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">발주 관리</h1>
      </div>
      <div className="p-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">새 발주 생성</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 발주서 작성</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="공급업체명"
                value={newOrder.supplier_name}
                onChange={(e) =>
                  setNewOrder((o) => ({ ...o, supplier_name: e.target.value }))
                }
              />
              <Input
                placeholder="발주번호"
                value={newOrder.order_number}
                onChange={(e) =>
                  setNewOrder((o) => ({ ...o, order_number: e.target.value }))
                }
              />
              <Input
                placeholder="비고"
                value={newOrder.note || ""}
                onChange={(e) =>
                  setNewOrder((o) => ({ ...o, note: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                onClick={async () => {
                  await createPurchaseOrder(newOrder);
                  setDialogOpen(false);
                  setNewOrder({
                    store_id: 1,
                    supplier_name: "",
                    order_number: "",
                    status: "요청",
                    note: "",
                  });
                  loadOrders();
                }}
              >
                생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="p-4 bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center py-3">발주번호</TableHead>
              <TableHead className="text-center">공급업체</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">요청일</TableHead>
              <TableHead className="text-center">예상도착</TableHead>
              <TableHead className="text-center">총액</TableHead>
              <TableHead className="text-center">비고</TableHead>
              <TableHead className="text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-amber-50">
                <TableCell className="text-center font-mono py-2">
                  {order.order_number}
                </TableCell>
                <TableCell className="text-center">
                  {order.supplier_name}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusColor[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {order.requested_at?.slice(0, 10)}
                </TableCell>
                <TableCell className="text-center">
                  {order.expected_arrival?.slice(0, 10) || "-"}
                </TableCell>
                <TableCell className="text-center">
                  {order.total_cost?.toLocaleString()}원
                </TableCell>
                <TableCell className="text-center">
                  {order.note || "-"}
                </TableCell>
                <TableCell className="text-center flex flex-row gap-1 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openOrderItems(order)}
                  >
                    상세
                  </Button>
                  {order.status !== "완료" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCompleteOrder(order)}
                    >
                      완료
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {/* 발주 상세/아이템 다이얼로그 */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>발주 상세</DialogTitle>
            <div className="text-sm text-gray-500 mt-1">
              {selectedOrder?.order_number} | {selectedOrder?.supplier_name}
            </div>
          </DialogHeader>
          <div className="mb-2">
            <Table className="text-xs mb-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">재료명</TableHead>
                  <TableHead className="text-center">단위</TableHead>
                  <TableHead className="text-center">요청수량</TableHead>
                  <TableHead className="text-center">입고수량</TableHead>
                  <TableHead className="text-center">단가</TableHead>
                  <TableHead className="text-center">총액</TableHead>
                  <TableHead className="text-center">비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => {
                  const ing = ingredients.find(
                    (i) => i.id === item.ingredient_id
                  );
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-center">
                        {ing?.name || item.ingredient_id}
                      </TableCell>
                      <TableCell className="text-center">{item.unit}</TableCell>
                      <TableCell className="text-center">
                        {item.requested_qty}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.received_qty}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.unit_price?.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-center">
                        {item.total_price?.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-center">
                        {item.note || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {/* 아이템 추가 폼 */}
            {selectedOrder && selectedOrder.status !== "입고완료" && (
              <div className="flex flex-row flex-wrap gap-3 items-end border-t pt-3 mt-2">
                <div className="flex flex-col min-w-[120px]">
                  <label className="block text-xs text-gray-500 mb-1 text-start pl-2">
                    재료
                  </label>
                  <IngredientSelect
                    ingredients={ingredients}
                    value={newItem.ingredient_id}
                    onChange={(id) => {
                      const ing = ingredients.find((i) => i.id === id);
                      setNewItem((item) => ({
                        ...item,
                        ingredient_id: id,
                        unit: ing?.unit || "",
                      }));
                    }}
                  />
                </div>
                <div className="flex flex-col min-w-[80px]">
                  <label className="block text-xs text-gray-500 mb-1 text-start pl-2">
                    단위
                  </label>
                  <Input
                    className="w-20 text-center h-9 text-xs px-2"
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem((item) => ({ ...item, unit: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col min-w-[80px]">
                  <label className="block text-xs text-gray-500 mb-1 text-start pl-2">
                    요청수량
                  </label>
                  <Input
                    className="w-20 text-center h-9 text-xs px-2"
                    type="number"
                    value={newItem.requested_qty}
                    onChange={(e) =>
                      setNewItem((item) => ({
                        ...item,
                        requested_qty: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col min-w-[80px]">
                  <label className="block text-xs text-gray-500 mb-1 text-start pl-2">
                    단가
                  </label>
                  <Input
                    className="w-20 text-center h-9 text-xs px-2"
                    type="number"
                    value={newItem.unit_price}
                    onChange={(e) =>
                      setNewItem((item) => ({
                        ...item,
                        unit_price: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <label className="block text-xs text-gray-500 mb-1 text-start pl-2">
                    비고
                  </label>
                  <Input
                    className="w-32 text-center h-9 text-xs px-2"
                    value={newItem.note || ""}
                    onChange={(e) =>
                      setNewItem((item) => ({ ...item, note: e.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Button
                    className="ml-2"
                    size="sm"
                    onClick={async () => {
                      if (!selectedOrder) return;
                      await createPurchaseOrderItem({
                        ...newItem,
                        purchase_order_id: selectedOrder.id,
                      });
                      const items = await fetchPurchaseOrderItems(
                        selectedOrder.id
                      );
                      setOrderItems(items);
                      setNewItem({
                        purchase_order_id: selectedOrder.id,
                        ingredient_id: ingredients[0]?.id || 0,
                        unit: ingredients[0]?.unit || "",
                        requested_qty: 0,
                        unit_price: 0,
                        note: "",
                      });
                    }}
                  >
                    추가
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchagePage;
