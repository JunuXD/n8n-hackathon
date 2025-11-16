import axios from "axios";

export interface Store {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open_time: string;
  close_time: string;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: number;
  name: string;
  price: number;
  description: string | null;
  store_id: number;
  status: "판매중" | "품절";
  current_stock: number;
  created_at: string;
  updated_at: string;
}

export async function fetchStoreDetails(storeId: string): Promise<Store> {
  try {
    const response = await axios.get(
      `http://localhost:5678/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/request/stores/${storeId}`
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
      `http://localhost:5678/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/request/stores/${storeId}/menus`
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
      `http://localhost:5678/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/request/stores/${data.store_id}/menus`,
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
      `http://localhost:5678/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/request/menus/${menuId}`,
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
      `http://localhost:5678/webhook/19874092-7893-4f2b-89e4-3a8bcfff5692/request/menus/${menuId}`
    );
  } catch (error) {
    console.error("Error deleting menu:", error);
    throw error;
  }
}
