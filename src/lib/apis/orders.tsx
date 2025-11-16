import axios from "axios";

export interface OrderRecord {
  id: number;
  menu_id: number;
  menu_name: string;
  quantity: number;
  total_price: number;
  store_id: number;
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  total_sales: number;
  order_count: number;
  inventory_count: number;
}

export async function fetchOrderRecords(
  storeId: string,
  page: number = 1,
  limit: number = 25
): Promise<{ orders: OrderRecord[]; total: number }> {
  try {
    const response = await axios.get(
      `http://localhost:5678/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/request/stores/${storeId}/orders`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching order records:", error);
    throw error;
  }
}

export async function fetchOrderStats(storeId: string): Promise<OrderStats> {
  try {
    const response = await axios.get(
      `http://localhost:5678/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/request/stores/${storeId}/stats`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching order stats:", error);
    throw error;
  }
}
