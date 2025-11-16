import React from "react";
import MenuStock from "@/components/MenuStock";
import IngredientStock from "@/components/IngredientStock";

export default function Monitoring() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">재고 대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <MenuStock />
        <IngredientStock />
      </div>
    </div>
  );
}
