import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/apis/supabaseClient";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Ingredient {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  quantity?: number; // for menu-ingredient join
}

interface MenuInfo {
  id: number;
  name: string;
  price: number;
  status: string;
  photo?: string;
}

interface Ingredient {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  quantity?: number; // for menu-ingredient join
}

interface Ingredient {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  quantity?: number; // for menu-ingredient join
}

const MenuIngredientsPage: React.FC = () => {
  const { menuId } = useParams();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuName, setMenuName] = useState<string>("");
  const [menuInfo, setMenuInfo] = useState<MenuInfo | null>(null);

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      if (menuId) {
        // 메뉴 정보 가져오기
        const { data: menuData, error: menuError } = await supabase
          .from("menus")
          .select("id, name, price, status, photo")
          .eq("id", menuId)
          .single();
        if (!menuError && menuData) {
          setMenuInfo(menuData);
          setMenuName(menuData.name);
        }
        // 메뉴별 재료만 조회
        const { data, error } = await supabase
          .from("menu_ingredients")
          .select(
            "quantity, ingredient_id, ingredients(name, category, price, unit, current_stock, min_stock_level)"
          )
          .eq("menu_id", menuId);
        if (!error && data) {
          setIngredients(
            data.map((row: any) => ({
              ...(Array.isArray(row.ingredients)
                ? row.ingredients[0]
                : row.ingredients),
              quantity: row.quantity,
            }))
          );
        }
      } else {
        // 전체 재료
        const { data, error } = await supabase
          .from("ingredients")
          .select(
            "id, name, category, price, unit, current_stock, min_stock_level"
          );
        if (!error && data) setIngredients(data);
      }
      setLoading(false);
    };
    fetchIngredients();
  }, [menuId]);

  return (
    <div className="p-6">
      {menuId && menuInfo && (
        <Card className="mb-6 p-4 flex items-center gap-4 bg-amber-50 border border-amber-200">
          {menuInfo.photo ? (
            <img
              src={menuInfo.photo}
              alt={menuInfo.name}
              className="w-20 h-20 object-cover rounded shadow"
            />
          ) : (
            <span className="w-20 h-20 flex items-center justify-center text-4xl bg-white rounded shadow">
              🍞
            </span>
          )}
          <div>
            <div className="text-xl font-bold text-amber-900 mb-1">
              {menuInfo.name}
            </div>
            <div className="text-gray-700 mb-1">
              {menuInfo.price?.toLocaleString()}원
            </div>
            <div className="inline-block px-2 py-0.5 rounded bg-amber-200 text-amber-800 text-xs font-semibold">
              {menuInfo.status}
            </div>
          </div>
        </Card>
      )}
      <h1 className="text-2xl font-bold mb-4">
        {menuId ? (
          <>
            메뉴 <span className="text-amber-700">{menuName || menuId}</span>의
            재료 목록
          </>
        ) : (
          "전체 재료 목록"
        )}
      </h1>
      <Card className="p-4 bg-white shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>단위</TableHead>
              <TableHead>가격</TableHead>
              {menuId && <TableHead>레시피 수량</TableHead>}
              <TableHead>현재고</TableHead>
              <TableHead>최소재고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={menuId ? 7 : 6}
                  className="text-center py-8 text-gray-400"
                >
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : ingredients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={menuId ? 7 : 6}
                  className="text-center py-8 text-gray-400"
                >
                  등록된 재료가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((ing) => (
                <TableRow key={ing.id}>
                  <TableCell>{ing.name}</TableCell>
                  <TableCell>{ing.category || "-"}</TableCell>
                  <TableCell>{ing.unit}</TableCell>
                  <TableCell>{ing.price?.toLocaleString() ?? "-"}</TableCell>
                  {menuId && <TableCell>{ing.quantity}</TableCell>}
                  <TableCell>{ing.current_stock}</TableCell>
                  <TableCell>{ing.min_stock_level}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default MenuIngredientsPage;
