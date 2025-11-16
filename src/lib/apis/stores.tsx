import axios from "axios";

export interface Store {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open_time: string; // TIME
  close_time: string; // TIME
  created_at: string; // TIMESTAMP
  updated_at: string; // TIMESTAMP
}

export interface Menu {
  id: number;
  store_id: number;
  name: string;
  photo?: string | null;
  price: number;
  current_stock: number;
  status: "판매중" | "품절";
  created_at: string;
  updated_at: string;
}

export async function fetchStoreDetails(storeId: string): Promise<Store> {
  try {
    const response = await axios.get(
      `https://primary-production-b57a.up.railway.app/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/19874092-7893-4f2b-89e4-3a8bcfff5692/stores/${storeId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching store details:", error);
    throw error;
  }
}

export async function fetchMenuByStoreId(storeId: string): Promise<Menu[]> {
  try {
    const response = await axios.get(
      `https://primary-production-b57a.up.railway.app/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/19874092-7893-4f2b-89e4-3a8bcfff5692/stores/${storeId}/menus`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching store details:", error);
    throw error;
  }
}

export async function createMenu(data: Partial<Menu>): Promise<Menu> {
  try {
    const response = await axios.post(
      `https://primary-production-b57a.up.railway.app/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/19874092-7893-4f2b-89e4-3a8bcfff5692/stores/${data.store_id}/menus`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching store details:", error);
    throw error;
  }
}

export async function updateMenu(
  menuId: number,
  data: Partial<Menu>
): Promise<Menu> {
  try {
    const response = await axios.put(
      `https://primary-production-b57a.up.railway.app/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/19874092-7893-4f2b-89e4-3a8bcfff5692/menus/${menuId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error updating menu:", error);
    throw error;
  }
}

export async function deleteMenu(menuId: number): Promise<void> {
  try {
    await axios.delete(
      `https://primary-production-b57a.up.railway.app/webhook-test/19874092-7893-4f2b-89e4-3a8bcfff5692/19874092-7893-4f2b-89e4-3a8bcfff5692/menus/${menuId}`
    );
  } catch (error) {
    console.error("Error deleting menu:", error);
    throw error;
  }
}
