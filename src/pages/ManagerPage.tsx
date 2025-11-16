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
// no Switch import needed
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
import { fetchMenuByStoreId, Menu } from "@/lib/apis/menus";
import {
  fetchStoreById,
  updateStoreState,
  fetchTodayOrderStats,
} from "@/lib/apis/orderStatsSupabase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { postOcrMenuImage } from "@/lib/apis/ocr";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, LucideTimer, MapPin } from "lucide-react";

export default function ManagerPage() {
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [orderStats, setOrderStats] = useState({
    total_sales: 0,
    order_count: 0,
    total_quantity: 0,
  });

  useEffect(() => {
    async function fetchAll() {
      try {
        const [storeData, menuData, stats] = await Promise.all([
          fetchStoreById(1),
          fetchMenuByStoreId("1"),
          fetchTodayOrderStats(1),
        ]);
        setStore(storeData);
        setMenuList(menuData);
        setOrderStats(stats);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-transparent mb-4" />
        <div className="text-amber-700 font-semibold text-lg mb-1">
          대시보드 불러오는 중...
        </div>
        <div className="text-xs text-gray-400">잠시만 기다려주세요!</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        Error: {error.message || String(error)}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-muted min-h-screen items-center">
      {/* Shop Overview - Bakery style */}
      <Card className="max-w-5xl mx-auto bg-gradient-to-br from-amber-50 to-white border-amber-100 p-0 overflow-hidden">
        {/* Top Row: Name, Status, Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-8 pt-8 pb-4 border-b border-amber-100 bg-white">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <span className="text-5xl md:text-6xl bg-amber-100 rounded-full border border-amber-200 p-3">
              🥖
            </span>
            <span className="text-2xl md:text-3xl font-bold text-amber-900 truncate max-w-xs md:max-w-md">
              {store.name}
            </span>
            <Badge
              className="ml-2 text-sm font-semibold px-2.5 py-0.5 rounded-full"
              variant={store.cur_state ? "default" : "secondary"}
            >
              {store.cur_state ? "영업 중" : "영업 종료"}
            </Badge>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <Button
              size="sm"
              variant={store.cur_state ? "destructive" : "default"}
              className={
                store.cur_state
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }
              onClick={async () => {
                try {
                  const updated = await updateStoreState(
                    store.id,
                    !store.cur_state
                  );
                  setStore(updated);
                } catch (err) {
                  toast({
                    title: "가게 상태 변경 실패",
                    variant: "destructive",
                  });
                }
              }}
            >
              {store.cur_state ? (
                <>
                  <svg
                    className="inline mr-1 mb-0.5"
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13H9v-2h2v2zm0-4H9V7h2v4z"
                      fill="currentColor"
                    />
                  </svg>
                  영업 종료하기
                </>
              ) : (
                "영업 시작하기"
              )}
            </Button>
          </div>
        </div>
        {/* Info Section */}
        <div className="px-8 py-6 bg-gradient-to-br from-amber-50 to-white">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-4 text-amber-800">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full">
                    <MapPin className="w-5 h-5 text-amber-700" />
                  </span>
                  <span className="font-medium text-base md:text-lg text-amber-900">
                    {store.address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full">
                    <LucideTimer className="w-5 h-5 text-amber-700" />
                  </span>
                  <span className="font-medium text-base md:text-lg text-amber-900">
                    {store.open_time?.slice(0, 5)} ~{" "}
                    {store.close_time?.slice(0, 5)}
                  </span>
                </div>
              </div>
              <div className="text-amber-700 text-base mt-2 md:mt-1 md:text-[15px]">
                {store.description || (
                  <span className="text-gray-400">소개가 아직 없습니다.</span>
                )}
              </div>
            </div>
          </div>
        </div>
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
            <CardDescription>주문 건수</CardDescription>
            <CardTitle>{orderStats.order_count}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <CardDescription>판매된 총 수량</CardDescription>
            <CardTitle>{orderStats.total_quantity}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-8">
        <Card className="flex flex-col items-center justify-center p-6 bg-white border-amber-100 shadow-sm">
          <div className="text-4xl mb-2">🧾</div>
          <CardTitle className="mb-1 text-lg">주문 내역 관리</CardTitle>
          <CardDescription className="mb-4 text-center text-amber-800">
            전체 주문 내역을 확인하고 관리할 수 있어요.
          </CardDescription>
          <Button
            onClick={() => navigate("/orders")}
            className="w-full max-w-xs"
            variant="default"
            size="lg"
          >
            주문 내역 관리 페이지로 이동
          </Button>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 bg-white border-amber-100 shadow-sm">
          <div className="text-4xl mb-2">🍞</div>
          <CardTitle className="mb-1 text-lg">메뉴 관리</CardTitle>
          <CardDescription className="mb-4 text-center text-amber-800">
            판매 중인 빵/메뉴를 추가, 수정, 삭제할 수 있어요.
          </CardDescription>
          <Button
            onClick={() => navigate("/menu")}
            className="w-full max-w-xs"
            variant="default"
            size="lg"
          >
            메뉴 관리 페이지로 이동
          </Button>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 bg-white border-amber-100 shadow-sm">
          <div className="text-4xl mb-2">🥚</div>
          <CardTitle className="mb-1 text-lg">재료 관리</CardTitle>
          <CardDescription className="mb-4 text-center text-amber-800">
            재고 임계치, 단위 등 재료 정보를 관리할 수 있어요.
          </CardDescription>
          <Button
            onClick={() => navigate("/ingredient")}
            className="w-full max-w-xs"
            variant="default"
            size="lg"
          >
            재료 관리 페이지로 이동
          </Button>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 bg-white border-amber-100 shadow-sm">
          <div className="text-4xl mb-2">📦</div>
          <CardTitle className="mb-1 text-lg">발주 관리</CardTitle>
          <CardDescription className="mb-4 text-center text-amber-800">
            재료 발주 내역을 확인하고, 신규 발주를 등록할 수 있어요.
          </CardDescription>
          <Button
            onClick={() => navigate("/purchase")}
            className="w-full max-w-xs"
            variant="default"
            size="lg"
          >
            발주 관리 페이지로 이동
          </Button>
        </Card>
      </div>
    </div>
  );
}
