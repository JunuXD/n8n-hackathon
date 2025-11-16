import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
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
import {
  fetchPurchaseOrders,
  fetchPurchaseOrderItems,
  createPurchaseOrder,
  createPurchaseOrderItem,
  PurchaseOrder,
  PurchaseOrderItem,
} from "@/lib/apis/purchaseOrders";
import { supabase } from "@/lib/apis/supabaseClient";

const statusColor: Record<string, string> = {
  요청: "bg-blue-100 text-blue-700",
  진행중: "bg-amber-100 text-amber-700",
  완료: "bg-green-100 text-green-700",
  취소: "bg-gray-200 text-gray-500",
};

export default function PurchagePage() {
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
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">발주 관리</h1>
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-700">
              <th className="py-2">발주번호</th>
              <th>공급업체</th>
              <th>상태</th>
              <th>요청일</th>
              <th>예상도착</th>
              <th>총액</th>
              <th>비고</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-mono">{order.order_number}</td>
                <td>{order.supplier_name}</td>
                <td>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      statusColor[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>{order.requested_at?.slice(0, 10)}</td>
                <td>{order.expected_arrival?.slice(0, 10) || "-"}</td>
                <td>{order.total_cost?.toLocaleString()}원</td>
                <td>{order.note || "-"}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openOrderItems(order)}
                  >
                    상세
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            <table className="w-full text-xs mb-2">
              <thead>
                <tr className="border-b">
                  <th>재료명</th>
                  <th>단위</th>
                  <th>요청수량</th>
                  <th>입고수량</th>
                  <th>단가</th>
                  <th>총액</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => {
                  const ing = ingredients.find(
                    (i) => i.id === item.ingredient_id
                  );
                  return (
                    <tr key={item.id} className="border-b">
                      <td>{ing?.name || item.ingredient_id}</td>
                      <td>{item.unit}</td>
                      <td>{item.requested_qty}</td>
                      <td>{item.received_qty}</td>
                      <td>{item.unit_price?.toLocaleString()}원</td>
                      <td>{item.total_price?.toLocaleString()}원</td>
                      <td>{item.note || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* 아이템 추가 폼 */}
            <div className="flex flex-wrap gap-2 items-end border-t pt-3 mt-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">재료</label>
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={newItem.ingredient_id}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const ing = ingredients.find((i) => i.id === id);
                    setNewItem((item) => ({
                      ...item,
                      ingredient_id: id,
                      unit: ing?.unit || "",
                    }));
                  }}
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">단위</label>
                <Input
                  className="w-20"
                  value={newItem.unit}
                  onChange={(e) =>
                    setNewItem((item) => ({ ...item, unit: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  요청수량
                </label>
                <Input
                  className="w-20"
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">단가</label>
                <Input
                  className="w-20"
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">비고</label>
                <Input
                  className="w-32"
                  value={newItem.note || ""}
                  onChange={(e) =>
                    setNewItem((item) => ({ ...item, note: e.target.value }))
                  }
                />
              </div>
              <Button
                className="ml-2"
                size="sm"
                onClick={async () => {
                  if (!selectedOrder) return;
                  await createPurchaseOrderItem({
                    ...newItem,
                    purchase_order_id: selectedOrder.id,
                  });
                  const items = await fetchPurchaseOrderItems(selectedOrder.id);
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
