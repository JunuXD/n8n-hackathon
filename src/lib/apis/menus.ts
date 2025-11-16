import { Menu } from "./stores";
import { supabase } from "./supabaseClient";

// 메뉴 생성
export async function createMenu(menu: Partial<Menu>): Promise<Menu> {
  const { data, error } = await supabase
    .from("menus")
    .insert([
      {
        name: menu.name,
        price: menu.price,
        current_stock: menu.current_stock ?? 0,
        store_id: menu.store_id,
        status: menu.status ?? "판매중",
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 메뉴 수정
export async function updateMenu(
  id: number,
  update: Partial<Menu>
): Promise<Menu> {
  const { data, error } = await supabase
    .from("menus")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// 메뉴 삭제
export async function deleteMenu(id: number): Promise<void> {
  const { error } = await supabase.from("menus").delete().eq("id", id);
  if (error) throw error;
}

// 매장별 메뉴 조회
export async function fetchMenuByStoreId(storeId: string): Promise<Menu[]> {
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .eq("store_id", storeId)
    .order("id", { ascending: true });
  if (error) throw error;
  return data || [];
}
