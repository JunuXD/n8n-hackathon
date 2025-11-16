import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import MenuStock from "@/components/MenuStock";
import IngredientStock from "@/components/IngredientStock";

export default function Monitoring() {
  const navigate = useNavigate();
  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/manager")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">재고 대시보드</h1>
      </div>
      <MenuStock />
    </div>
  );
}
