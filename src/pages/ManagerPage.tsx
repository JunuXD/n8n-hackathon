import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  createMenu,
  deleteMenu,
  fetchStoreDetails,
  Menu,
  Store,
  updateMenu,
} from "@/lib/apis/stores";
import { fetchMenuByStoreId } from "@/lib/apis/stores";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { postOcrMenuImage } from "@/lib/apis/ocr";
import { toast } from "@/hooks/use-toast";
import { fetchOrderStats } from "@/lib/apis/orders";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ManagerPage() {
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStats, setOrderStats] = useState({
    total_sales: 0,
    order_count: 0,
    inventory_count: 0,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [newMenu, setNewMenu] = useState<Partial<Menu>>({
    id: 0,
    name: "",
    price: 0,
    description: null,
    store_id: 1,
    status: "판매중",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 파일 상태 추가
  const [buttonLoading, setButtonLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null); // 선택된 메뉴 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // 삭제 다이얼로그 상태
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // 수정 다이얼로그 상태

  async function getMenuList() {
    try {
      const menuData = await fetchMenuByStoreId("1");
      setMenuList(menuData);
      return menuData.length;
    } catch (err) {
      setError(err);
      return 0;
    }
  }

  async function getOrderStats() {
    try {
      const stats = await fetchOrderStats("1");
      setOrderStats(stats);
    } catch (err) {
      console.error("Error fetching order stats:", err);
    }
  }

  useEffect(() => {
    async function getStoreDetails() {
      try {
        const storeData = await fetchStoreDetails("1");
        setStore(storeData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    getStoreDetails();
    getMenuList();
    getOrderStats();
  }, []);

  const handleCreateMenu = async () => {
    try {
      const createdMenu = await createMenu(newMenu);

      console.log("Created Menu:", createdMenu);
      setNewMenu({ name: "", price: 0 }); // Reset form

      await getMenuList();
    } catch (err) {
      console.error("Error creating menu:", err);
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file); // 파일 상태에 저장
      console.log("Selected File:", file);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile || !store) {
      console.error("No file selected or store not loaded.");
      return;
    }

    try {
      setButtonLoading(true);
      const result = await postOcrMenuImage(selectedFile, store.id); // 파일 업로드
      console.log("OCR Upload Result:", result);

      const inserted = result.inserted ?? 0;
      const updated = result.updated ?? 0;

      let description = "";

      if (inserted > 0 && updated > 0) {
        description = `${inserted}개 추가되고, ${updated}개 수정되었습니다.`;
      } else if (inserted > 0) {
        description = `${inserted}개 추가되었습니다.`;
      } else if (updated > 0) {
        description = `${updated}개 수정되었습니다.`;
      } else {
        description = "변경된 항목이 없습니다.";
      }

      toast({
        title: "메뉴 등록 완료",
        description,
        variant: "default",
      });

      // 메뉴 목록 다시 가져오기
      await getMenuList();
    } catch (err) {
      console.error("Error uploading OCR file:", err);
      toast({
        title: "Error",
        description: "Failed to upload OCR file. Please try again.",
        variant: "destructive", // Error 스타일
      });
    } finally {
      setButtonLoading(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!selectedMenu) return;

    try {
      await deleteMenu(selectedMenu.id); // 메뉴 삭제 API 호출
      toast({
        title: "삭제 완료",
        description: `${selectedMenu.name}이(가) 삭제되었습니다.`,
        variant: "default",
      });
      await getMenuList(); // 메뉴 목록 갱신
    } catch (err) {
      console.error("Error deleting menu:", err);
      toast({
        title: "Error",
        description: "메뉴 삭제에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false); // 다이얼로그 닫기
    }
  };

  // 메뉴 수정 핸들러
  const handleEditMenu = async () => {
    if (!selectedMenu) return;

    try {
      await updateMenu(selectedMenu.id, {
        name: selectedMenu.name,
        price: selectedMenu.price,
        status: selectedMenu.status,
      }); // 메뉴 수정 API 호출
      toast({
        title: "수정 완료",
        description: `${selectedMenu.name}이(가) 수정되었습니다.`,
        variant: "default",
      });
      await getMenuList(); // 메뉴 목록 갱신
    } catch (err) {
      console.error("Error updating menu:", err);
      toast({
        title: "Error",
        description: "메뉴 수정에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsEditDialogOpen(false); // 다이얼로그 닫기
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-muted min-h-screen items-center">
      {/* Shop Overview */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar>
            <AvatarImage />
          </Avatar>
          <div className="flex-1">
            <CardTitle>{store.name}</CardTitle>
            <CardDescription>
              {store.description || "No description available."}
            </CardDescription>
            <Badge
              className="mt-2"
              variant={"Open" === "Open" ? "default" : "destructive"}
            >
              Open
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate("/orders")}
            className="w-full"
            size="lg"
          >
            주문 내역 보기
          </Button>
        </CardContent>
      </Card>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <CardDescription>오늘의 매출</CardDescription>
            <CardTitle>₩{orderStats.total_sales.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <CardDescription>주문 수</CardDescription>
            <CardTitle>{orderStats.order_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <CardDescription>메뉴 항목</CardDescription>
            <CardTitle>{menuList.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>재고 현황</CardTitle>
          <CardDescription>현재 메뉴별 재고를 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>메뉴</TableHead>
                <TableHead>재고</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuList.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>{menu.name}</TableCell>
                  <TableCell>{menu.current_stock}개</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        menu.current_stock <= 5 ? "destructive" : "default"
                      }
                    >
                      {menu.current_stock <= 5 ? "부족" : "충분"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Menu Listing - Collapsible */}
      <Card className="max-w-3xl mx-auto">
        <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center cursor-pointer">
                <div>
                  <CardTitle>메뉴 관리</CardTitle>
                  <CardDescription>
                    매장에서 판매 중인 메뉴 목록입니다.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  {isMenuOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Popover>
              <PopoverTrigger asChild>
                <Button variant="default">메뉴 추가하기</Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default">직접 추가하기</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>새 메뉴 추가</DialogTitle>
                      <DialogDescription>
                        메뉴 이름, 가격, 상태를 입력하세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                      <Input
                        placeholder="Menu Name"
                        value={newMenu.name}
                        onChange={(e) =>
                          setNewMenu({ ...newMenu, name: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Price"
                        type="number"
                        value={newMenu.price}
                        onChange={(e) =>
                          setNewMenu({
                            ...newMenu,
                            price: Number(e.target.value),
                          })
                        }
                      />
                      <Select
                        value={newMenu.status || "판매중"}
                        onValueChange={(value) => {
                          setNewMenu({
                            ...newMenu,
                            status: value as "판매중" | "품절",
                          });
                          console.log("New Menu State:", value);
                        }}
                      >
                        <SelectTrigger>
                          {newMenu.status || "판매중"}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="판매중">판매중</SelectItem>
                          <SelectItem value="품절">품절</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateMenu}>추가하기</Button>
                    </DialogFooter>
                  </DialogContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default">이미지로 추가하기</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>이미지 업로드</DialogTitle>
                        <DialogDescription>
                          메뉴 이미지를 업로드하세요.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange} // 파일 선택 핸들러
                        />
                        <Button
                          onClick={handleFileUpload}
                          disabled={buttonLoading}
                        >
                          {buttonLoading ? "업로드 중..." : "이미지 업로드"}
                        </Button>{" "}
                        {/* 업로드 버튼 */}
                      </div>
                    </DialogContent>
                  </Dialog>
                </Dialog>
                </PopoverContent>
              </Popover>
            </div>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuList.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>{menu.name}</TableCell>
                  <TableCell>₩{menu.price}</TableCell>
                  <TableCell>{menu.description || "No description"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* 수정 버튼 */}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedMenu(menu);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        수정
                      </Button>
                      {/* 삭제 버튼 */}
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedMenu(menu);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 삭제 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메뉴 삭제</DialogTitle>
            <DialogDescription>
              {selectedMenu?.name}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteMenu}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메뉴 수정</DialogTitle>
            <DialogDescription>메뉴 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Menu Name"
              value={selectedMenu?.name || ""}
              onChange={(e) =>
                setSelectedMenu(
                  (prev) => prev && { ...prev, name: e.target.value }
                )
              }
            />
            <Input
              placeholder="Price"
              type="number"
              value={selectedMenu?.price || ""}
              onChange={(e) =>
                setSelectedMenu(
                  (prev) => prev && { ...prev, price: Number(e.target.value) }
                )
              }
            />
            <Select
              value={selectedMenu?.status || "판매중"}
              onValueChange={(value) =>
                setSelectedMenu(
                  (prev) =>
                    prev && { ...prev, status: value as "판매중" | "품절" }
                )
              }
            >
              <SelectTrigger>{selectedMenu?.status || "판매중"}</SelectTrigger>
              <SelectContent>
                <SelectItem value="판매중">판매중</SelectItem>
                <SelectItem value="품절">품절</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleEditMenu}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
