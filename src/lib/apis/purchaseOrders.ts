import { supabase } from "./supabaseClient";

export interface PurchaseOrder {
  id: number;
  store_id: number;
  supplier_name: string;
  order_number: string;
  status: string;
  requested_at: string;
  expected_arrival: string | null;
  received_at: string | null;
  total_cost: number;
  created_by: number;
  note: string | null;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  ingredient_id: number;
  unit: string;
  requested_qty: number;
  received_qty: number;
  unit_price: number;
  total_price: number;
  received_at: string | null;
  note: string | null;
}

export async function fetchPurchaseOrders(
  storeId: number
): Promise<PurchaseOrder[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("store_id", storeId)
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchPurchaseOrderItems(
  purchaseOrderId: number
): Promise<PurchaseOrderItem[]> {
  const { data, error } = await supabase
    .from("purchase_order_items")
    .select("*")
    .eq("purchase_order_id", purchaseOrderId);
  if (error) throw error;
  return data || [];
}

export async function createPurchaseOrder(order: Partial<PurchaseOrder>) {
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert([order])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePurchaseOrder(
  id: number,
  updates: Partial<PurchaseOrder>
) {
  const { data, error } = await supabase
    .from("purchase_orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createPurchaseOrderItem(
  item: Partial<PurchaseOrderItem>
) {
  const { data, error } = await supabase
    .from("purchase_order_items")
    .insert([item])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePurchaseOrderItem(
  id: number,
  updates: Partial<PurchaseOrderItem>
) {
  const { data, error } = await supabase
    .from("purchase_order_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
