import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  createMenu,
  updateMenu,
  deleteMenu,
  fetchMenuByStoreId,
} from "@/lib/apis/menus";
import { supabase } from "@/lib/apis/supabaseClient";
import { Menu } from "@/lib/apis/stores";
import { postOcrMenuImage } from "@/lib/apis/ocr";
import { toast } from "@/hooks/use-toast";

export default function MenuStock() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMenu, setNewMenu] = useState<Partial<Menu>>({
    name: "",
    price: 0,
    status: "판매중",
    store_id: 1,
  });
  const [editMenu, setEditMenu] = useState<Menu | null>(null);
  const [deleteMenuId, setDeleteMenuId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // For image upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);

  // fetch menus
  const loadMenus = async () => {
    setLoading(true);
    const data = await fetchMenuByStoreId("1");
    setMenus(data);
    setLoading(false);
  };

  useEffect(() => {
    loadMenus();
    // 실시간 재고만 반영
    const subscription = supabase
      .channel("public:menus")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menus" },
        (payload) => {
          setMenus((prev) =>
            prev.map((item) =>
              item.id === payload.new.id
                ? { ...item, current_stock: payload.new.current_stock }
                : item
            )
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-transparent mb-4" />
        <div className="text-amber-700 font-semibold text-lg mb-1">
          메뉴 재고 불러오는 중...
        </div>
        <div className="text-xs text-gray-400">잠시만 기다려주세요!</div>
      </div>
    );

  // 판매중이면서 재고 5개 이하인 메뉴
  const lowStockMenus = menus.filter(
    (m) => m.status === "판매중" && m.current_stock <= 5
  );

  return (
    <Card className="p-4 shadow-md bg-white">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-xl font-bold">메뉴 재고 현황</h2>
        {lowStockMenus.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col gap-2 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥐</span>
              <span className="font-semibold text-amber-700 text-base">
                품절 알림
              </span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-amber-800 font-medium">
                곧 품절될 수 있는 메뉴예요!
              </span>
              {lowStockMenus.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 shadow-sm"
                >
                  {item.name}
                  <span className="ml-1 text-[11px] font-normal">
                    {item.current_stock}개 남음
                  </span>
                </span>
              ))}
            </div>
            <span className="text-xs text-amber-600 font-normal">
              지금 미리 준비해두면 걱정 없어요 😊
            </span>
          </div>
        )}
        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="default">메뉴 추가</Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-2 w-56">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">직접 추가하기</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 메뉴 추가</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3">
                    <Input
                      placeholder="메뉴명"
                      value={newMenu.name}
                      onChange={(e) =>
                        setNewMenu({ ...newMenu, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="가격"
                      type="number"
                      value={newMenu.price}
                      onChange={(e) =>
                        setNewMenu({
                          ...newMenu,
                          price: Number(e.target.value),
                        })
                      }
                    />
                    <Input
                      placeholder="상태 (판매중/품절)"
                      value={newMenu.status}
                      onChange={(e) =>
                        setNewMenu({
                          ...newMenu,
                          status: e.target.value as Menu["status"],
                        })
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={async () => {
                        await createMenu(newMenu);
                        setDialogOpen(false);
                        setNewMenu({
                          name: "",
                          price: 0,
                          status: "판매중",
                          store_id: 1,
                        });
                        loadMenus();
                      }}
                    >
                      추가하기
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default">이미지로 추가하기</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>이미지 업로드</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setSelectedFile(file || null);
                      }}
                    />
                    <Button
                      onClick={async () => {
                        if (!selectedFile) {
                          toast({
                            title: "파일을 선택해주세요.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setButtonLoading(true);
                        try {
                          // store_id는 1로 고정
                          const result = await postOcrMenuImage(
                            selectedFile,
                            1
                          );
                          const inserted = result.inserted ?? 0;
                          const updated = result.updated ?? 0;
                          let description = "";
                          if (inserted > 0 && updated > 0) {
                            description = `${inserted}개 추가, ${updated}개 수정됨`;
                          } else if (inserted > 0) {
                            description = `${inserted}개 추가됨`;
                          } else if (updated > 0) {
                            description = `${updated}개 수정됨`;
                          } else {
                            description = "변경된 항목이 없습니다.";
                          }
                          toast({
                            title: "메뉴 등록 완료",
                            description,
                            variant: "default",
                          });
                          setSelectedFile(null);
                          loadMenus();
                        } catch (err) {
                          toast({
                            title: "에러",
                            description: "OCR 업로드 실패. 다시 시도해주세요.",
                            variant: "destructive",
                          });
                        } finally {
                          setButtonLoading(false);
                        }
                      }}
                      disabled={buttonLoading}
                    >
                      {buttonLoading ? "업로드 중..." : "이미지 업로드"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="rounded-lg border p-3 bg-gray-50 flex flex-col items-center relative"
          >
            <div className="w-20 h-20 mb-2 flex items-center justify-center bg-gray-100 rounded">
              {menu.photo ? (
                <img
                  src={menu.photo}
                  alt={menu.name}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <span className="text-gray-400 text-2xl">🍞</span>
              )}
            </div>
            <div className="font-semibold text-lg text-gray-800 mb-1 text-center w-full truncate">
              {menu.name}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant={menu.status === "품절" ? "destructive" : "default"}
                className="text-xs px-2 py-0.5"
              >
                {menu.status}
              </Badge>
              <span className="text-xs text-gray-500">
                재고{" "}
                <span className="font-bold text-gray-700">
                  {menu.current_stock}
                </span>
                개
              </span>
            </div>
            <div className="text-right w-full text-sm text-gray-700 font-medium mt-auto">
              {menu.price.toLocaleString()}원
            </div>
            <div className="flex gap-2 mt-2 w-full">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditMenu(menu);
                  setEditDialogOpen(true);
                }}
              >
                수정
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setDeleteMenuId(menu.id);
                  setDeleteDialogOpen(true);
                }}
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메뉴 수정</DialogTitle>
          </DialogHeader>
          {editMenu && (
            <div className="flex flex-col gap-3">
              <Input
                placeholder="메뉴명"
                value={editMenu.name}
                onChange={(e) =>
                  setEditMenu({ ...editMenu, name: e.target.value })
                }
              />
              <Input
                placeholder="가격"
                type="number"
                value={editMenu.price}
                onChange={(e) =>
                  setEditMenu({ ...editMenu, price: Number(e.target.value) })
                }
              />
              <Input
                placeholder="상태 (판매중/품절)"
                value={editMenu.status}
                onChange={(e) =>
                  setEditMenu({
                    ...editMenu,
                    status: e.target.value as Menu["status"],
                  })
                }
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={async () => {
                if (editMenu) {
                  await updateMenu(editMenu.id, editMenu);
                  setEditDialogOpen(false);
                  setEditMenu(null);
                  loadMenus();
                }
              }}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메뉴 삭제</DialogTitle>
          </DialogHeader>
          <div>정말로 삭제하시겠습니까?</div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteMenuId) {
                  await deleteMenu(deleteMenuId);
                  setDeleteDialogOpen(false);
                  setDeleteMenuId(null);
                  loadMenus();
                }
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
