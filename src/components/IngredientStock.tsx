import { supabase } from "@/lib/apis/supabaseClient";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StockLogChart from "./StockLogChart";
import { Button } from "@/components/ui/button";

interface Ingredient {
  id: number;
  name: string;
  current_stock: number;
  min_stock_level: number;
  unit: string;
}

const IngredientStock: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChart, setOpenChart] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("ingredients")
      .select("id, name, current_stock, min_stock_level, unit")
      .then(({ data }) => {
        setIngredients(data || []);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-transparent mb-4" />
        <div className="text-amber-700 font-semibold text-lg mb-1">
          재료 재고 불러오는 중...
        </div>
        <div className="text-xs text-gray-400">잠시만 기다려주세요!</div>
      </div>
    );

  // 발주 필요 재료: 임계치 이하 또는 임계치+20% 이하
  const needOrder = ingredients.filter(
    (item) => item.current_stock < item.min_stock_level * 1.2
  );

  return (
    <Card className="p-4 shadow-md bg-white">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-xl font-bold">재료 재고 현황</h2>
        {needOrder.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col gap-2 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="font-semibold text-amber-700 text-base">
                발주 알림
              </span>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-amber-800 font-medium">
                이 재료들, 곧 떨어질 것 같아요!
              </span>
              {needOrder.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 shadow-sm"
                >
                  {item.name}
                  <span className="ml-1 text-[11px] font-normal">
                    {item.current_stock}/{item.min_stock_level}
                    {item.unit}
                  </span>
                </span>
              ))}
            </div>
            <span className="text-xs text-amber-600 font-normal">
              지금 미리 발주해두면 안심이에요 😊
            </span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {ingredients.map((item) => {
          // ...existing code...
          const max = Math.max(
            item.min_stock_level * 2,
            item.min_stock_level,
            item.current_stock,
            1
          );
          const percent = Math.max(
            0,
            Math.min(100, Math.round((item.current_stock / max) * 100))
          );
          const thresholdPercent = Math.max(
            0,
            Math.min(100, Math.round((item.min_stock_level / max) * 100))
          );
          let barColor = "bg-teal-200";
          if (item.current_stock < item.min_stock_level) {
            barColor = "bg-rose-200";
          } else if (item.current_stock < item.min_stock_level * 1.2) {
            barColor = "bg-amber-200";
          }
          return (
            <div
              key={item.id}
              className="rounded-lg border p-3 bg-gray-50 mb-2"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-gray-800 flex-1">
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  {item.current_stock} {item.unit} / 재고 알림선{" "}
                  {item.min_stock_level} {item.unit}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2 px-2 py-0 text-xs h-7"
                  onClick={() =>
                    setOpenChart(openChart === item.id ? null : item.id)
                  }
                >
                  {openChart === item.id ? "닫기" : "재고 변화 그래프"}
                </Button>
              </div>
              <div className="relative w-full">
                <div className="w-full h-4 rounded-full bg-gray-200" />
                <div
                  className={`absolute left-0 top-0 h-4 rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${percent}%`, zIndex: 1 }}
                />
                {/* 재고 알림선 마커 */}
                <div
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${thresholdPercent}%`,
                    width: "2px",
                    background: "#6366f1",
                    zIndex: 2,
                    height: "100%",
                    marginLeft: "-1px",
                    opacity: 0.7,
                  }}
                  title="재고 알림선"
                />
                {/* 수치 텍스트 */}
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-800 z-10">
                  {item.current_stock} {item.unit}
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 z-10">
                  재고 알림선 {item.min_stock_level} {item.unit}
                </span>
              </div>
              {openChart === item.id && (
                <StockLogChart ingredientId={item.id} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default IngredientStock;
