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
  images?: string[];
  pages: number;
  theme: string;
  tech: string[];
  price: string;
  description: string;
  status: 'selling' | 'sold_out';
  isHot: boolean;
  hasInteraction?: boolean;
  baseInventory?: number;
  soldTo: SoldRecord[];
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  products: Product[];
  adminEmails: string[];
  isAuthReady: boolean;
  isAdminLoggedIn: boolean;
  isSuperAdmin: boolean;
  globalError: string | null;
  isOnline: boolean;
  isLoading: boolean;
  initDB: () => void;
  loginAdmin: () => Promise<boolean>;
  loginManagerWithEmail: (e: string, p: string) => Promise<boolean>;
  loginAdminWithRedirect: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  fetchAdminEmails: () => Promise<void>;
  updateAdminEmails: (emails: string[]) => Promise<void>;
  addProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSoldRecord: (productId: string, record: Omit<SoldRecord, 'id'>) => Promise<void>;
  updateSoldRecord: (productId: string, recordId: string, updates: Partial<SoldRecord>) => Promise<void>;
  deleteSoldRecord: (productId: string, recordId: string) => Promise<void>;
  _fetchProducts: () => Promise<void>;
  _handleUser: (user: any) => Promise<void>;
  setGlobalError: (error: string | null) => void;
}

let isDbInitialized = false;

export const useStore = create<AppState>()((set, get) => {
  // A helper for backend API calls - bypassed the local network issues
  const apiCall = async (method: string, path: string, body?: any) => {
    try {
      const res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '请求失败');
      return data;
    } catch (err: any) {
      // If the local backend is reachable but failing, it's better than direct DB failure
      if (err.message.includes('Failed to fetch')) {
        throw new Error('无法连接到控制台后台，请尝试刷新页面。');
      }
      throw err;
    }
  };

  return {
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

    // Load initial products and settings
    get()._fetchProducts();
    get().fetchAdminEmails();
    
    // Check local session (minimal)
    const savedUser = localStorage.getItem('local-admin-user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      set({ isAdminLoggedIn: true, isSuperAdmin: user.email === 'lanu2617@gmail.com', isAuthReady: true });
    } else {
      set({ isAuthReady: true });
    }
  },

  _handleUser: async (user: any) => {
    if (!user || !user.email) {
      set({ isAdminLoggedIn: false, isSuperAdmin: false, isAuthReady: true });
      localStorage.removeItem('local-admin-user');
      return;
    }

    const isSuper = user.email === 'lanu2617@gmail.com';
    set({ 
      isAdminLoggedIn: true, 
      isSuperAdmin: isSuper, 
      isAuthReady: true 
    });
    localStorage.setItem('local-admin-user', JSON.stringify(user));
    get().fetchAdminEmails();
  },

 async _fetchProducts() {
  set({ isLoading: true });
  try {
    // 【修改处】：在这里明确排除掉 cover 字段（Base64太大了！）
    // 这样查询会快几十倍，也不会超时了
    const { data, error } = await supabase
      .from('products')
      .select('id, title, type, pages, theme, tech, status, isHot, soldTo'); 

    if (error) throw error;
    set({ products: data || [] });
  } catch (err) {
    console.error('Fetch error:', err);
  } finally {
    set({ isLoading: false });
  }
}

  fetchAdminEmails: async () => {}, // TODO: Implement admin email logic with Supabase if needed

  updateAdminEmails: async (emails: string[]) => {}, // TODO

  loginManagerWithEmail: async (email: string, password: string) => {
    // Basic auth handled by Supabase, this is a placeholder for the logic in the app
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await get()._handleUser(data.user);
    return true;
  },

  loginAdmin: async () => {
    throw new Error("OAuth 登录目前在本地稳定版中已禁用。请使用管理员账号登录。");
  },

  loginAdminWithRedirect: async () => {
    // Disabled in local mode for stability
  },

  logoutAdmin: async () => {
    set({ isAdminLoggedIn: false, isSuperAdmin: false });
    localStorage.removeItem('local-admin-user');
  },

  addProduct: async (product) => {
    const newProduct = {
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      soldTo: product.soldTo || [],
    };
    const { error } = await supabase.from('products').insert([newProduct]);
    if (error) throw error;
    get()._fetchProducts();
  },

  updateProduct: async (id, updates) => {
    // 移除不可更改或危险的字段
    const { id: _, createdAt: __, ...cleanUpdates } = updates as any;
    const finalData = { ...cleanUpdates, updatedAt: new Date().toISOString() };
    
    const { error } = await supabase.from('products').update(finalData).eq('id', id);
    if (error) throw error;
    get()._fetchProducts();
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    get()._fetchProducts();
  },

  addSoldRecord: async (productId, record) => {
    const p = get().products.find(x => x.id === productId);
    if (!p) throw new Error("同步失败：本地未找到该作品，请刷新页面后重试。");
    const newRecord = { ...record, id: Math.random().toString(36).substring(2, 9) };
    const updatedSoldTo = [...(p.soldTo || []), newRecord];
    await get().updateProduct(productId, { soldTo: updatedSoldTo });
  },

  updateSoldRecord: async (productId, recordId, updates) => {
    const p = get().products.find(x => x.id === productId);
    if (!p) throw new Error("同步失败：本地未找到该作品，请刷新页面后重试。");
    const updatedSoldTo = (p.soldTo || []).map(r => r.id === recordId ? { ...r, ...updates } : r);
    await get().updateProduct(productId, { soldTo: updatedSoldTo });
  },

  deleteSoldRecord: async (productId, recordId) => {
    const p = get().products.find(x => x.id === productId);
    if (!p) throw new Error("同步失败：本地未找到该作品，请刷新页面后重试。");
    const updatedSoldTo = (p.soldTo || []).filter((s) => s.id !== recordId);
    await get().updateProduct(productId, { soldTo: updatedSoldTo });
  }
  };
});
