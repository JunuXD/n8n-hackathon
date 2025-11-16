import React, { useEffect, useState } from "react";
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
import { Toast } from "@/components/ui/toast"; // Toast 컴포넌트 임포트
import { toast } from "@/hooks/use-toast";

const mockShop = {
  name: "Seoyeon's Bakery",
  owner: "Seoyeon Kim",
  status: "Open",
  avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  description: "Fresh bread and pastries every day!",
};

const mockStats = [
  { label: "Today's Sales", value: "₩120,000" },
  { label: "Orders", value: 34 },
  { label: "Inventory Items", value: 12 },
  { label: "Pending Orders", value: 3 },
];

const mockInventory = [
  { name: "Baguette", stock: 8, status: "Low" },
  { name: "Croissant", stock: 20, status: "Good" },
  { name: "Sourdough", stock: 5, status: "Low" },
  { name: "Muffin", stock: 15, status: "Good" },
];

export default function ManagerPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      const menuData = await fetchMenuByStoreId("1"); // Replace "1" with dynamic storeId if needed
      setMenuList(menuData);
    } catch (err) {
      setError(err);
    }
  }

  useEffect(() => {
    async function getStoreDetails() {
      try {
        const storeData = await fetchStoreDetails("1"); // Replace "1" with dynamic storeId if needed
        setStore(storeData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    getStoreDetails();
    getMenuList();
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
          <div>
            <CardTitle>{store.name}</CardTitle>
            <CardDescription>
              {store.description || "No description available."}
            </CardDescription>
            <Badge
              className="mt-2"
              variant={"Open" === "Open" ? "default" : "destructive"}
            ></Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {mockStats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle>{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Inventory Table */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>
            Check your current stock and status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInventory.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "Low" ? "destructive" : "default"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Menu Listing */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-start">
            Menu
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
          </CardTitle>

          <CardDescription>
            List of available items in the store.
          </CardDescription>
        </CardHeader>
        <CardContent>
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

      {/* Quick Actions */}
      <div className="flex flex-1 items-center justify-center gap-4">
        <Button variant="secondary">View Orders</Button>
        <Button variant="outline">Settings</Button>
      </div>
    </div>
  );
}
