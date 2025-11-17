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
  Menu,
} from "@/lib/apis/menus";
import { fetchUpdateLists, UpdateList } from "@/lib/apis/updateLists";
import { supabase } from "@/lib/apis/supabaseClient";

import { postOcrMenuImage, postOcrMenuRecipe } from "@/lib/apis/ocr";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// 빵 만들기 웹훅 주소
const BREAD_WEBHOOK_URL =
  "https://primary-production-b57a.up.railway.app/webhook/048c823b-c949-4fb5-a444-cd689660d62f";

const MenuStock: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLists, setUpdateLists] = useState<UpdateList[]>([]);
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

  // 빵 만들기 버튼 로딩 상태
  const [breadLoading, setBreadLoading] = useState(false);
  const navigate = useNavigate();

  // 빵 만들기 POST 요청 함수
  const handleMakeBread = async () => {
    setBreadLoading(true);
    try {
      const res = await fetch(BREAD_WEBHOOK_URL, {
        method: "POST",
      });
      if (!res.ok) throw new Error("요청 실패");
      toast({
        title: "빵 만들기 성공!",
        description: "빵이 만들어졌어요. 재고가 갱신됩니다.",
        variant: "default",
      });
      loadMenus();
    } catch (err) {
      toast({
        title: "빵 만들기 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setBreadLoading(false);
    }
  };

  // fetch menus & update_lists
  const loadMenus = async () => {
    setLoading(true);
    const [menuData, updateListData] = await Promise.all([
      fetchMenuByStoreId("1"),
      fetchUpdateLists(),
    ]);
    setMenus(menuData);
    setUpdateLists(updateListData);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-transparent mb-4" />
        <div className="text-amber-700 font-semibold text-lg mb-1">
          메뉴 재고 불러오는 중...
        </div>
        <div className="text-xs text-gray-400">잠시만 기다려주세요!</div>
      </div>
    );
  }
  // 판매중이면서 재고 5개 이하인 메뉴
  const lowStockMenus = menus.filter(
    (m) => m.status === "판매중" && m.current_stock <= 5
  );

  return (
    <div>
      <Card className="p-4 shadow-md bg-white">
        {/* 빵 만들기 버튼 */}

        {/* update_lists 기반 빵 생산 정보 카드 */}
        {updateLists.length > 0 && (
          <>
            <div className="mb-4 justify-between flex items-center">
              <div className="mb-1 font-semibold text-amber-800 flex items-center gap-1 text-[16px]">
                <span className="text-xl">🍞</span>
                오늘 만들 빵
              </div>
              <Button
                variant="default"
                onClick={handleMakeBread}
                disabled={breadLoading}
              >
                {breadLoading ? "빵 만드는 중..." : "빵 만들기"}
              </Button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {updateLists.map((item) => {
                const menu = menus.find((m) => m.id === item.menu_id);
                if (!menu) return null;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-200 min-w-[110px] shadow-sm hover:scale-[1.04] transition-transform"
                    style={{ minHeight: 68 }}
                  >
                    <span className="text-[15px] font-bold text-amber-900 truncate max-w-[90px] text-center mb-0.5">
                      {menu.name}
                    </span>
                    <Badge
                      className="bg-amber-200 text-amber-700 font-semibold px-2 py-0.5 mt-0.5 mb-0.5 text-xs border-amber-300"
                      variant="outline"
                    >
                      +{item.added_quantity}개 생산
                    </Badge>
                    <span className="text-[11px] text-gray-600 bg-white/60 rounded px-2 py-0.5 mt-0.5">
                      <span className="font-medium text-amber-700">재고</span>{" "}
                      {menu.current_stock}개
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
      <br />
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
          <div className="flex justify-end gap-2">
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
                        accept="image"
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
                              description:
                                "OCR 업로드 실패. 다시 시도해주세요.",
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
            {/* 레시피 올리기 버튼 */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <span role="img" aria-label="사진" className="mr-1">
                    📷
                  </span>
                  레시피 올리기
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>레시피 이미지 업로드</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelectedFile(file || null);
                    }}
                  />
                  <Button
                    onClick={async () => {
                      if (!selectedFile) return;
                      setButtonLoading(true);
                      try {
                        const result = await postOcrMenuRecipe(selectedFile, 1);
                        // Handle the result as needed
                        toast({
                          title: "레시피 등록 완료",
                          description:
                            "레시피 이미지가 성공적으로 업로드되었습니다.",
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
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="rounded-lg border p-3 bg-gray-50 flex flex-col items-center relative"
              onClick={() => navigate(`/menu/${menu.id}/ingredients`)}
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
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
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
    </div>
  );
};

export default MenuStock;
