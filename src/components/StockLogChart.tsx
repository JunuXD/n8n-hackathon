import { supabase } from "@/lib/apis/supabaseClient";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockLog {
  id: number;
  ingredient_id: number;
  change_type: string;
  change_amount: number;
  related_menu_id: number | null;
  timestamp: string;
  note: string | null;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
}

export default function StockLogChart({
  ingredientId,
}: {
  ingredientId: number;
}) {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: logsData } = await supabase
        .from("stock_logs")
        .select(
          "id, ingredient_id, change_type, change_amount, related_menu_id, timestamp, note"
        )
        .eq("ingredient_id", ingredientId)
        .order("timestamp", { ascending: true });
      const { data: ingredientData } = await supabase
        .from("ingredients")
        .select("id, name, unit")
        .eq("id", ingredientId)
        .single();
      setLogs(logsData || []);
      setIngredient(ingredientData || null);
      setLoading(false);
    }
    fetchData();
  }, [ingredientId]);

  // 누적 재고 계산
  let stock = 0;
  const stockHistory = logs.map((log) => {
    stock += log.change_amount;
    return { ...log, stock };
  });

  const data = {
    labels: stockHistory.map((log) =>
      log.timestamp.slice(0, 16).replace("T", " ")
    ),
    datasets: [
      {
        label: "재고 변화",
        data: stockHistory.map((log) => log.stock),
        borderColor: "#f59e42",
        backgroundColor: "rgba(251,191,36,0.2)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: stockHistory.map((log) => {
          switch (log.change_type) {
            case "생산":
              return "#38bdf8";
            case "판매":
              return "#f87171";
            case "발주입고":
              return "#34d399";
            case "보정":
              return "#fbbf24";
            default:
              return "#f59e42";
          }
        }),
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: ingredient
          ? `${ingredient.name} 재고 추이 (${ingredient.unit})`
          : "재고 추이",
      },
      tooltip: {
        mode: "index" as const,
        callbacks: {
          title: (ctx) => {
            const i = ctx[0].dataIndex;
            return stockHistory[i].timestamp.slice(0, 16).replace("T", " ");
          },
          label: (ctx) => {
            const i = ctx.dataIndex;
            const log = stockHistory[i];
            let label = `재고: ${log.stock}`;
            label += ` | 변화: ${log.change_amount > 0 ? "+" : ""}${
              log.change_amount
            }`;
            label += ` | 유형: ${log.change_type}`;
            if (log.note) label += ` | 비고: ${log.note}`;
            return label;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "시간" } },
      y: { title: { display: true, text: "재고" } },
    },
  };

  if (loading)
    return (
      <div className="py-8 text-center text-amber-700">
        그래프 불러오는 중...
      </div>
    );
  if (!ingredient)
    return (
      <div className="py-8 text-center text-gray-400">
        재료 정보를 찾을 수 없습니다.
      </div>
    );
  if (logs.length === 0)
    return (
      <div className="py-8 text-center text-gray-400">
        재고 로그가 없습니다.
      </div>
    );

  return (
    <Card className="p-4 mt-6">
      <Line data={data} options={options} />
    </Card>
  );
}
