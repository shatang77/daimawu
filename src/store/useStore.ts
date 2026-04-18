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

export const useStore = create<AppState>()((set, get) => ({
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
    get()._fetchProducts();
    get().fetchAdminEmails();
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
    set({ isAdminLoggedIn: true, isSuperAdmin: isSuper, isAuthReady: true });
    localStorage.setItem('local-admin-user', JSON.stringify(user));
    get().fetchAdminEmails();
  },

_fetchProducts: async () => {
    set({ isLoading: true });
    try {
      // 🚨 补全了所有必要的预览字段，包括 cover 和 images，以及状态标志
      const { data, error } = await supabase
        .from('products')
        .select('id, title, type, cover, images, pages, theme, tech, status, isHot, soldTo, baseInventory');

      if (error) throw error;
      set({ products: (data || []) as unknown as Product[], globalError: null, isOnline: true });
    } catch (err: any) {
      console.error("Fetch products encountered error:", err);
      set({ globalError: `数据获取失败`, isOnline: false });
    } finally {
      set({ isLoading: false });
    }
},

  fetchAdminEmails: async () => {},
  updateAdminEmails: async (emails: string[]) => {},

  loginManagerWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await get()._handleUser(data.user);
    return true;
  },

  loginAdmin: async () => { throw new Error("OAuth 登录已禁用。"); },
  loginAdminWithRedirect: async () => {},
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
    if (!p) throw new Error("同步失败：未找到作品");
    const newRecord = { ...record, id: Math.random().toString(36).substring(2, 9) };
    const updatedSoldTo = [...(p.soldTo || []), newRecord];
    await get().updateProduct(productId, { soldTo: updatedSoldTo });
  },

  updateSoldRecord: async (productId, recordId, updates) => {
    const p = get().products.find(x => x.id === productId);
    if (!p) throw new Error("同步失败：未找到作品");
    const updatedSoldTo = (p.soldTo || []).map(r => r.id === recordId ? { ...r, ...updates } : r);
    await get().updateProduct(productId, { soldTo: updatedSoldTo });
  },

  deleteSoldRecord: async (productId, recordId) => {
    const p = get().products.find(x => x.id === productId);
    if (!p) throw new Error("同步失败：未找到作品");
    const updatedSoldTo = (p.soldTo || []).filter((s) => s.id !== recordId);
    await get().updateProduct(productId, { soldTo: updatedSoldTo });
  }
}));
