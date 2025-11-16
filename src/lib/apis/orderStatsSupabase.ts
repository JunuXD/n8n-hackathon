import { supabase } from "./supabaseClient";

export interface OrderRecord {
  id: number;
  store_id: number;
  menu_id: number;
  quantity: number;
  total_price: number;
  order_source: string;
  order_time: string;
}

export async function fetchTodayOrderStats(storeId: number) {
  // 오늘 날짜 00:00 ~ 23:59
  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );
  const { data, error } = await supabase
    .from("order_record")
    .select("total_price, quantity")
    .eq("store_id", storeId)
    .gte("order_time", start.toISOString())
    .lt("order_time", end.toISOString());
  if (error) throw error;
  let total_sales = 0;
  let order_count = 0;
  let total_quantity = 0;
  if (data) {
    total_sales = data.reduce((sum, o) => sum + Number(o.total_price), 0);
    order_count = data.length;
    total_quantity = data.reduce((sum, o) => sum + Number(o.quantity), 0);
  }
  return { total_sales, order_count, total_quantity };
}

export async function fetchStoreById(storeId: number) {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateStoreState(storeId: number, cur_state: boolean) {
  const { data, error } = await supabase
    .from("stores")
    .update({ cur_state })
    .eq("id", storeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
