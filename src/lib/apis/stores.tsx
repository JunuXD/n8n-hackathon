import { supabase } from "./supabaseClient";

export interface Store {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open_time: string;
  close_time: string;
  created_at: string;
  updated_at: string;
  cur_state: boolean;
}

// Fetch store details by id
export async function fetchStoreDetails(storeId: string): Promise<Store> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .single();
  if (error) throw error;
  return data;
}

// Toggle store open/close state
export async function toggleStoreState(
  storeId: string,
  curState: boolean
): Promise<Store> {
  const { data, error } = await supabase
    .from("stores")
    .update({ cur_state: !curState })
    .eq("id", storeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
