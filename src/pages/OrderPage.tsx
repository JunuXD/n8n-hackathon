import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { fetchMenuByStoreId, Menu } from "@/lib/apis/menus";
import { createOrderSupabase } from "@/lib/apis/createOrderSupabase";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart } from "lucide-react";

export default function OrderPage() {
  const navigate = useNavigate();
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  useEffect(() => {
    async function getMenuList() {
      try {
        const menuData = await fetchMenuByStoreId("1");
        setMenuList(menuData);
      } catch (err) {
        console.error("Error fetching menu:", err);
        toast.error("Failed to load menu");
      } finally {
        setLoading(false);
      }
    }

    getMenuList();
  }, []);

  const handleOrderClick = (menu: Menu) => {
    setSelectedMenu(menu);
    setQuantity(1);
    setIsOrderDialogOpen(true);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (
      selectedMenu &&
      newQuantity >= 1 &&
      newQuantity <= selectedMenu.current_stock
    ) {
      setQuantity(newQuantity);
    } else if (!selectedMenu && newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedMenu) return;
    try {
      await createOrderSupabase({
        store_id: 1,
        menu_id: selectedMenu.id,
        quantity,
      });
      toast.success(
        `주문 완료: ${quantity}x ${selectedMenu.name} - 총액 ₩${(
          selectedMenu.price * quantity
        ).toLocaleString()}`
      );
      // Refresh menu list to update stock/품절
      const menuData = await fetchMenuByStoreId("1");
      setMenuList(menuData);
      setIsOrderDialogOpen(false);
      setSelectedMenu(null);
      setQuantity(1);
    } catch (err: any) {
      toast.error(err.message || "주문 실패");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-secondary">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-300 border-t-transparent mb-4 flex items-center justify-center">
          <span className="text-3xl">🍞</span>
        </div>
        <div className="text-amber-700 font-semibold text-lg mb-1">
          메뉴 불러오는 중...
        </div>
        <div className="text-xs text-gray-400">
          따끈따끈한 빵처럼, 곧 준비됩니다!
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-4">
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              주문하기
            </h1>
            <p className="text-muted-foreground mt-2">
              원하시는 메뉴를 선택하고 주문하세요
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            메인으로
          </Button>
        </div>

        {/* Menu List */}
        <Card className="shadow-soft border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              메뉴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>메뉴명</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>가격</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>주문</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuList.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell className="font-medium">{menu.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {menu.description || "-"}
                    </TableCell>
                    <TableCell>₩{menu.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          menu.current_stock > 0 ? "default" : "secondary"
                        }
                        className="h-9 px-4 flex items-center justify-center text-sm"
                      >
                        {menu.current_stock > 0 ? "판매중" : "품절"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleOrderClick(menu)}
                        disabled={
                          menu.current_stock <= 0 || menu.status !== "판매중"
                        }
                        className="rounded-full"
                      >
                        주문하기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>주문 확인</DialogTitle>
            <DialogDescription>
              수량을 선택하고 주문을 확인하세요
            </DialogDescription>
          </DialogHeader>

          {selectedMenu && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedMenu.name}
                    </h3>
                    {selectedMenu.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedMenu.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      selectedMenu.current_stock > 0 &&
                      selectedMenu.status === "판매중"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedMenu.current_stock > 0 &&
                    selectedMenu.status === "판매중"
                      ? "판매중"
                      : selectedMenu.current_stock <= 0
                      ? "품절"
                      : "판매중지"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  단가: ₩{selectedMenu.price.toLocaleString()}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">수량</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= selectedMenu.current_stock) {
                        setQuantity(val);
                      }
                    }}
                    className="text-center w-20"
                    min="1"
                    max={selectedMenu.current_stock}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= selectedMenu.current_stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  재고: {selectedMenu.current_stock}개
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>총 금액:</span>
                  <span className="text-primary">
                    ₩{(selectedMenu.price * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOrderDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleConfirmOrder}>주문 확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
