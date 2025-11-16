import { supabase } from "./supabaseClient";

export interface CreateOrderInput {
  store_id: number;
  menu_id: number;
  quantity: number;
}

export async function createOrderSupabase({
  store_id,
  menu_id,
  quantity,
}: CreateOrderInput) {
  // Fetch menu to get price and stock
  const { data: menu, error: menuError } = await supabase
    .from("menus")
    .select("id, price, current_stock, status")
    .eq("id", menu_id)
    .single();
  if (menuError) throw menuError;
  if (!menu) throw new Error("메뉴를 찾을 수 없습니다.");
  if (menu.current_stock < quantity) throw new Error("재고가 부족합니다.");
  if (menu.status !== "판매중") throw new Error("판매중인 메뉴가 아닙니다.");

  const total_price = Number(menu.price) * quantity;

  // Insert order record
  const { data: order, error: orderError } = await supabase
    .from("order_record")
    .insert([
      {
        store_id,
        menu_id,
        quantity,
        total_price,
      },
    ])
    .select()
    .single();
  if (orderError) throw orderError;

  // Update menu stock
  const { error: stockError } = await supabase
    .from("menus")
    .update({ current_stock: menu.current_stock - quantity })
    .eq("id", menu_id);
  if (stockError) throw stockError;

  return order;
}
