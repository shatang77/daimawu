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

// 替换从第 72 行开始到文件末尾的所有内容
export const useStore = create<AppState>((set, get) => ({
  products: [],
  adminEmails: [],
  isAuthReady: false,
  isAdminLoggedIn: false,
  isSuperAdmin: false,
  globalError: null,
  isOnline: true,
  isLoading: true,

  setGlobalError: (error) => set({ globalError: error }),

  initDB: async () => {
    if (isDbInitialized) return;
    isDbInitialized = true;
    await get()._fetchProducts();
    await get().fetchAdminEmails();
    const savedUser = localStorage.getItem('local-admin-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        set({ isAdminLoggedIn: true, isSuperAdmin: user.email === 'lanu2617@gmail.com', isAuthReady: true });
      } catch { set({ isAuthReady: true }); }
    } else { set({ isAuthReady: true }); }
  },

  _handleUser: async (user: any) => {
    if (!user || !user.email) {
      set({ isAdminLoggedIn: false, isSuperAdmin: false, isAuthReady: true });
      localStorage.removeItem('local-admin-user');
      return;
    }
    set({ isAdminLoggedIn: true, isSuperAdmin: user.email === 'lanu2617@gmail.com', isAuthReady: true });
    localStorage.setItem('local-admin-user', JSON.stringify(user));
  },

  _fetchProducts: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      set({ products: (data || []) as unknown as Product[], globalError: null, isOnline: true });
    } catch (err: any) {
      set({ globalError: `数据获取失败`, isOnline: false });
    } finally { set({ isLoading: false }); }
  },

  fetchAdminEmails: async () => {},
  updateAdminEmails: async (emails: string[]) => {},
  loginManagerWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await get()._handleUser(data.user);
    return true;
  },
  loginAdmin: async () => { throw new Error("已禁用"); },
  loginAdminWithRedirect: async () => {},
  logoutAdmin: async () => {
    set({ isAdminLoggedIn: false, isSuperAdmin: false });
    localStorage.removeItem('local-admin-user');
  },

  addProduct: async (product) => {
    const newProduct = { ...product, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), soldTo: product.soldTo || [] };
    const { error } = await supabase.from('products').insert([newProduct]);
    if (error) throw error;
    await get()._fetchProducts();
  },

  updateProduct: async (id, updates) => {
    const { id: _, createdAt: __, ...cleanUpdates } = updates as any;
    const { error } = await supabase.from('products').update({ ...cleanUpdates, updatedAt: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await get()._fetchProducts();
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await get()._fetchProducts();
  },

  addSoldRecord: async (productId, record) => {
    const p = get().products.find(x => x.id === productId);
    if (!p) throw new Error("同步失败：未找到作品");
    const newRecord = { ...record, id: Math.random().toString(36).substring(2, 9) };
    const updatedSoldTo = [...(p.soldTo || []), newRecord];
    const { error } = await supabase.from('products').update({ soldTo: updatedSoldTo, updatedAt: new Date().toISOString() }).eq('id', productId);
    if (error) throw error;
    await get()._fetchProducts();
  },

  updateSoldRecord: async (productId, recordId, updates) => {
    const p = get().products.find(x => x.id === productId);
    if (!p) throw new Error("同步失败");
    const updatedSoldTo = (p.soldTo || []).map(r => r.id === recordId ? { ...r, ...updates } : r);
    const { error } = await supabase.from('products').update({ soldTo: updatedSoldTo, updatedAt: new Date().toISOString() }).eq('id', productId);
    if (error) throw error;
    await get()._fetchProducts();
  },

  deleteSoldRecord: async (productId, recordId) => {
    const p = get().products.find(x => x.id === productId);
    if (!p) throw new Error("同步失败");
    const updatedSoldTo = (p.soldTo || []).filter((s) => s.id !== recordId);
    const { error } = await supabase.from('products').update({ soldTo: updatedSoldTo, updatedAt: new Date().toISOString() }).eq('id', productId);
    if (error) throw error;
    await get()._fetchProducts();
  }
}));
