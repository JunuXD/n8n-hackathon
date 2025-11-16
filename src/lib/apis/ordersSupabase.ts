import { supabase } from "./supabaseClient";

export interface OrderRecord {
  id: number;
  menu_id: number;
  menu_name: string;
  quantity: number;
  total_price: number;
  store_id: number;
  order_time: string;
}

export async function fetchOrderRecordsSupabase(
  storeId: number,
  page: number = 1,
  limit: number = 25
): Promise<{ orders: OrderRecord[]; total: number }> {
  // join menus for menu_name
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await supabase
    .from("order_record")
    .select(
      "id, menu_id, quantity, total_price, store_id, order_time, menus(name)",
      { count: "exact" }
    )
    .eq("store_id", storeId)
    .order("order_time", { ascending: false })
    .range(from, to);
  if (error) throw error;
  const orders = (data || []).map((o: any) => ({
    ...o,
    menu_name: o.menus?.name || "-",
  }));
  return { orders, total: count || 0 };
}
