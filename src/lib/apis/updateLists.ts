// updateLists.ts
// update_lists 테이블에서 menu_id, added_quantity를 가져오는 함수
import { supabase } from "./supabaseClient";

export interface UpdateList {
  id: number;
  menu_id: number;
  added_quantity: number;
  // 필요한 경우 다른 필드 추가
}

export async function fetchUpdateLists(): Promise<UpdateList[]> {
  const { data, error } = await supabase
    .from("update_lists")
    .select("id, menu_id, added_quantity");
  if (error) throw error;
  return data || [];
}
