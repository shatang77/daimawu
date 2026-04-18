import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export type ProductType = 'static' | 'ps' | 'figma';

export const getBaseInventory = (product: Product | undefined) => {
  if (!product) return 0;
  if (typeof product.baseInventory === 'number' && product.baseInventory >= 0) {
    return product.baseInventory;
  }
  const id = product.id;
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 900 + (hash % 96);
};

export interface SoldRecord {
  id: string;
  school: string;
  date: string;
  note: string;
}

export interface Product {
  id: string;
  type: ProductType;
  title: string;
  cover: string;
  images: string[];
  pages: number;
  theme: string;
  tech: string[];
  description: string;
  status: 'selling' | 'sold_out';
  isHot: boolean;
  hasInteraction: boolean;
  baseInventory?: number;
  soldTo: SoldRecord[];
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  products: Product[];
  isLoading: boolean;
  isAuthReady: boolean;
  isAdminLoggedIn: boolean;
  globalError: string | null;
  isOnline: boolean;
  initDB: () => Promise<void>;
  _fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  products: [],
  isLoading: true,
  isAuthReady: false,
  isAdminLoggedIn: false,
  globalError: null,
  isOnline: true,

  initDB: async () => {
    await get()._fetchProducts();
    const savedUser = localStorage.getItem('local-admin-user');
    set({ isAdminLoggedIn: !!savedUser, isAuthReady: true });
  },

  _fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (error) throw error;
      // 🚨 核心修复：获取成功后清除错误并设为在线
      set({ products: (data as any[]) || [], globalError: null, isOnline: true });
    } catch (err: any) {
      console.error("Fetch failed:", err);
      // 获取失败时显示错误
      set({ globalError: `数据拉取失败: ${err.message}`, isOnline: false });
    } finally {
      set({ isLoading: false });
    }
  },

  addProduct: async (product) => {
    const newProduct = {
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: product.images || [],
      tech: product.tech || [],
      soldTo: product.soldTo || []
    };
    const { error } = await supabase.from('products').insert([newProduct]);
    if (error) throw error;
    await get()._fetchProducts();
  },

  updateProduct: async (id, updates) => {
    const { id: _, createdAt, ...cleanUpdates } = updates as any;
    const finalData = { ...cleanUpdates, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('products').update(finalData).eq('id', id);
    if (error) throw error;
    await get()._fetchProducts();
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await get()._fetchProducts();
  }
}));
