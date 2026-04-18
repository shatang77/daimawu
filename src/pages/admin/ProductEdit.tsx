// 路径：/src/pages/admin/ProductEdit.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Product, ProductType, getBaseInventory } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import { ChevronLeft, Save, Upload, Image as ImageIcon, Plus, Loader2, X } from 'lucide-react';
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

  // 上传逻辑
  const uploadToStorage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToStorage(file);
      setFormData({ ...formData, cover: url });
      setSuccessMsg('封面已同步云端');
    } catch (err: any) { setErrorMsg('上传失败: ' + err.message); }
    finally { setIsUploading(false); }
  };

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadToStorage(f)));
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
    } catch (err: any) { setErrorMsg('上传失败: ' + err.message); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading) return;
    setIsSaving(true);
    try {
      if (isNew) await addProduct(formData as any);
      else await updateProduct(formData.id!, formData);
      setSuccessMsg('保存成功');
      setTimeout(() => navigate('/admin/products'), 1000);
    } catch (err: any) { setErrorMsg(err.message); setIsSaving(false); }
  };

  const handleTechAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (techInput.trim() && !formData.tech?.includes(techInput.trim())) {
        setFormData({ ...formData, tech: [...(formData.tech || []), techInput.trim()] });
        setTechInput('');
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32 animate-in fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button type="button" onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm"><ChevronLeft /></button>
        <h1 className="text-2xl font-black">作品编辑控制台</h1>
      </div>

      {(errorMsg || successMsg) && (
        <div className={cn("mb-6 p-4 rounded-xl font-bold", errorMsg ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500")}>
          {errorMsg || successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-10">
        {/* 封面区 */}
        <section className="space-y-4">
          <label className="text-sm font-black text-slate-900">1. 作品封面 (自动同步至 Covers 桶)</label>
          <div className="flex items-center gap-6">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="w-48 h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-blue-50 relative overflow-hidden group"
            >
              {isUploading ? <Loader2 className="animate-spin text-blue-500" /> : 
               formData.cover ? <img src={formData.cover} className="w-full h-full object-cover" /> : 
               <div className="text-slate-400 text-center"><Plus /><span className="text-[10px] block font-bold">点击上传封面</span></div>}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleCoverChange} accept="image/*" />
            <div className="flex-1 text-xs text-slate-400">建议尺寸 800x600，上传后自动替换旧封面。</div>
          </div>
        </section>

        {/* 预览图区 */}
        <section className="space-y-4 pt-8 border-t border-slate-50">
          <label className="text-sm font-black text-slate-900">2. 页面预览图 (可多选上传)</label>
          <div className="flex flex-wrap gap-4">
            {formData.images?.map((img, idx) => (
              <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 relative group">
                <img src={img} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFormData({...formData, images: formData.images?.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
              </div>
            ))}
            <div onClick={() => !isUploading && imagesInputRef.current?.click()} className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-50">
               {isUploading ? <Loader2 className="animate-spin text-blue-400" /> : <Plus className="text-slate-300" />}
            </div>
            <input type="file" multiple ref={imagesInputRef} className="hidden" onChange={handleMultiUpload} accept="image/*" />
          </div>
        </section>

        {/* 销售与热门设置 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-50">
           <div className="space-y-2">
              <label className="text-sm font-black text-slate-900">3. 销售状态</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border-2 border-slate-100 p-4 rounded-2xl font-bold bg-white outline-none focus:border-blue-500">
                 <option value="selling">🚀 还在热卖中</option>
                 <option value="sold_out">⛔ 已经售罄了</option>
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-sm font-black text-slate-900">4. 推荐位</label>
              <label className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl cursor-pointer hover:bg-orange-50 transition-colors">
                 <input type="checkbox" checked={formData.isHot} onChange={e => setFormData({...formData, isHot: e.target.checked})} className="w-6 h-6 accent-orange-500" />
                 <span className="font-bold text-orange-600">设为【首页热门推荐】</span>
              </label>
           </div>
        </section>

        {/* 核心字段 */}
        <section className="grid grid-cols-2 gap-4 pt-8">
            <input required value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder="唯一编号 (如 0012)" className="border-2 border-slate-100 p-4 rounded-2xl font-mono font-bold outline-none focus:border-blue-500" />
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="border-2 border-slate-100 p-4 rounded-2xl font-bold bg-white">
                <option value="static">静态网页</option>
                <option value="ps">PS设计稿</option>
                <option value="figma">Figma设计稿</option>
            </select>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="作品完整标题" className="col-span-2 border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-blue-500" />
        </section>

        {/* 标签与描述 */}
        <section className="space-y-4 pt-8 border-t border-slate-50">
            <div className="flex flex-wrap gap-2">
               {formData.tech?.map(t => <span key={t} className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">{t}<button type="button" onClick={() => setFormData({...formData, tech: formData.tech?.filter(x => x !== t)})}>&times;</button></span>)}
            </div>
            <input value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={handleTechAdd} placeholder="输入技术标签后按回车" className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500" />
            <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="详细说明文案..." className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 resize-none" />
        </section>

        {/* 底部保存条 */}
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md p-4 border-t border-slate-100 flex justify-end gap-4 px-8 z-50">
           <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">取消</button>
           <button type="submit" disabled={isSaving || isUploading} className="bg-slate-900 text-white px-16 py-4 rounded-2xl font-black shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3">
              {(isSaving || isUploading) ? <Loader2 className="animate-spin" /> : <Save />}
              {isUploading ? '正在极速同步云端图片...' : isNew ? '立即发布作品' : '保存全部更改'}
           </button>
        </div>
      </form>
    </div>
  );
}
