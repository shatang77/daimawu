import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Product, ProductType, getBaseInventory } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import { ChevronLeft, Save, Upload, Image as ImageIcon, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const isNew = !id;
  
  const products = useStore(state => state.products);
  const addProduct = useStore(state => state.addProduct);
  const updateProduct = useStore(state => state.updateProduct);

  const [formData, setFormData] = useState<Partial<Product>>({
    id: '', title: '', type: 'static', cover: '', images: [], pages: 1,
    theme: '', tech: [], description: '', status: 'selling', isHot: false, soldTo: []
  });

  const [techInput, setTechInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (!isNew && id) {
      const p = products.find(x => x.id === id);
      if (p) setFormData(p);
    } else if (isNew) {
      const usedIds = products.map(p => parseInt(p.id, 10)).filter(n => !isNaN(n));
      const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 9;
      setFormData(prev => ({ ...prev, id: String(maxId + 1).padStart(4, '0') }));
    }
  }, [id, isNew, products]);

  // --- 🪄 核心逻辑：自动上传至 Supabase Storage ---
  const uploadToStorage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('covers') // 对应刚才建的桶
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('covers').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToStorage(file);
      setFormData({ ...formData, cover: url });
      setSuccessMsg('图片已成功上传至云端并生成链接 ✨');
    } catch (err: any) {
      setErrorMsg('图片上传云端失败: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadToStorage(f)));
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
    } catch (err: any) {
      setErrorMsg('多图上传失败: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading) return;
    setIsSaving(true);
    try {
      if (isNew) await addProduct(formData as any);
      else await updateProduct(formData.id!, formData);
      setSuccessMsg('作品已保存成功！即将回列表...');
      setTimeout(() => navigate('/admin/products'), 1500);
    } catch (err: any) {
      setErrorMsg('保存数据库失败: ' + err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm"><ChevronLeft /></button>
        <h1 className="text-2xl font-black">{isNew ? '发布新作品' : '编辑作品详情'}</h1>
      </div>

      {(errorMsg || successMsg) && (
        <div className={cn("mb-6 p-4 rounded-xl font-bold", errorMsg ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500")}>
          {errorMsg || successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
        {/* 封面上传 */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700">作品封面 (自动上传云端)</label>
          <div className="flex items-center gap-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-48 h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 relative overflow-hidden group"
            >
              {isUploading ? <Loader2 className="animate-spin text-blue-500" /> : 
               formData.cover ? <img src={formData.cover} className="w-full h-full object-cover" /> : 
               <div className="text-slate-400 text-center"><Plus /><span className="text-[10px]">点击上传</span></div>}
            </div>
            <div className="flex-1 space-y-2">
               <p className="text-xs text-slate-500">当前链接：</p>
               <input disabled value={formData.cover} className="w-full bg-slate-50 p-2 rounded text-[10px] text-slate-400 truncate" />
               <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </div>

        {/* 基础信息 */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">编号</label>
                <input required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:border-blue-500 font-bold" />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">类型</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full border p-3 rounded-xl bg-white font-bold">
                    <option value="static">静态网页</option>
                    <option value="ps">PS设计</option>
                    <option value="figma">Figma设计</option>
                </select>
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">标题</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-3 rounded-xl font-bold" placeholder="输入作品名称" />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">主题/分类</label>
                <input required value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} className="w-full border p-3 rounded-xl" placeholder="如：医疗、电商" />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">页面数</label>
                <input type="number" value={formData.pages} onChange={e => setFormData({...formData, pages: parseInt(e.target.value)})} className="w-full border p-3 rounded-xl" />
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">详情描述</label>
            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-3 rounded-xl resize-none" />
        </div>

        <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 font-bold text-slate-500">取消</button>
            <button type="submit" disabled={isSaving || isUploading} className="bg-slate-900 text-white px-10 py-3 rounded-xl font-black shadow-lg active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2">
                {isSaving && <Loader2 className="animate-spin size-4" />}
                {isNew ? '确认发布' : '保存修改'}
            </button>
        </div>
      </form>
    </div>
  );
}
