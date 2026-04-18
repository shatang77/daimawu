import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Product, ProductType, getBaseInventory } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient';
import { ChevronLeft, Save, Upload, Image as ImageIcon, Plus, X, Loader2 } from 'lucide-react';
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
    theme: '', tech: [], description: '', status: 'selling', isHot: false, 
    hasInteraction: false, baseInventory: undefined, soldTo: []
  });

  const [techInput, setTechInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      const p = products.find(x => x.id === id);
      if (p) setFormData(p);
    } else if (isNew && products.length > 0) {
      const usedIds = products.map(p => parseInt(p.id, 10)).filter(n => !isNaN(n));
      const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 9;
      setFormData(prev => ({ ...prev, id: prev.id || String(maxId + 1).padStart(4, '0') }));
    }
  }, [id, isNew, products]);

  const uploadToStorage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('covers').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      if (isCover) {
        const url = await uploadToStorage(files[0]);
        setFormData(prev => ({ ...prev, cover: url }));
      } else {
        const urls = await Promise.all(Array.from(files).map(uploadToStorage));
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      }
    } catch (err: any) {
      alert('上传失败: ' + err.message);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading) return;
    if (!formData.id || !formData.title || !formData.theme) {
      alert('请完整填写必填项(编号、标题、细分主题)');
      return;
    }
    setIsSaving(true);
    try {
      if (isNew) await addProduct(formData as any);
      else await updateProduct(formData.id!, formData);
      navigate('/admin/products');
    } catch (err: any) {
      alert('保存失败: ' + err.message);
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-8">
        <button type="button" onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform border border-slate-100">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-slate-800">编辑基本信息</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-8">
        
        {/* 作品封面图 */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700">作品封面图 (建议4:3比例)</label>
          <div className="flex items-start gap-6">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="w-48 h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-400 group relative flex items-center justify-center shrink-0 shadow-inner"
            >
               {isUploading ? <Loader2 className="animate-spin text-blue-500" /> : 
                formData.cover ? <img src={formData.cover} className="w-full h-full object-cover" /> :
                <div className="text-center"><Plus size={32} className="text-slate-300 mx-auto" /><span className="text-[10px] font-bold text-slate-400">点击上传</span></div>
               }
               <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleUpload(e, true)} />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">自动转为 Base64 存储，不占用外部服务器。<br/>或者您也可直接粘贴图片外链 URL:</p>
              <div className="flex gap-2">
                <input 
                  type="text" value={formData.cover} 
                  onChange={e => setFormData({ ...formData, cover: e.target.value })} 
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 outline-none focus:border-blue-500" placeholder="https://..." 
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors">本地换图</button>
              </div>
              <button type="button" onClick={() => setFormData({...formData, cover: ''})} className="text-[10px] text-red-500 font-bold hover:underline">清除图片</button>
            </div>
          </div>
        </div>

        {/* 页面预览图 */}
        <div className="space-y-3 pt-6 border-t border-slate-50">
          <label className="text-sm font-bold text-slate-700">页面预览图 (可上传多张，点击图可以预览)</label>
          <div className="flex flex-wrap gap-4">
            {formData.images?.map((img, idx) => (
              <div key={idx} className="w-24 h-24 relative rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                <img src={img} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFormData({...formData, images: formData.images?.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-lg"><X size={12} /></button>
              </div>
            ))}
            <div onClick={() => !isUploading && imagesInputRef.current?.click()} className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 group">
              {isUploading ? <Loader2 className="animate-spin text-slate-400" /> : <Plus className="text-slate-300 group-hover:text-blue-400" />}
            </div>
          </div>
          <input type="file" multiple ref={imagesInputRef} className="hidden" onChange={(e) => handleUpload(e, false)} />
          <p className="text-[10px] text-slate-400 font-bold italic">这些图片将在详情页下方用于展示每一页的细节。</p>
        </div>

        {/* 编号与类型 */}
        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">唯一编号 <span className="text-red-500">*</span></label>
            <input disabled={!isNew} value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} className={cn("w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none font-mono font-bold", !isNew && "opacity-50")} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">作品类型 <span className="text-red-500">*</span></label>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold bg-white cursor-pointer">
              <option value="static">静态网页</option>
              <option value="ps">PS设计稿</option>
              <option value="figma">Figma设计稿</option>
            </select>
          </div>
        </div>

        {/* 完整标题 */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500">完整标题 <span className="text-red-500">*</span></label>
          <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" placeholder="例如：杭州旅游主题网页" />
        </div>

        {/* 数量与分类 */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">页面数量</label>
            <input type="number" value={formData.pages} onChange={e => setFormData({ ...formData, pages: parseInt(e.target.value) || 1 })} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">细分主题 <span className="text-red-500">*</span></label>
            <input value={formData.theme} onChange={e => setFormData({ ...formData, theme: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold" placeholder="例如：城市" />
          </div>
        </div>

        {/* 库存管理 */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-4">
           <div className="flex justify-between items-center text-xs font-bold text-slate-500">
             <span>基础库存量</span>
             <span className="text-[10px] text-slate-400">目前余：{getBaseInventory(formData as any) - (formData.soldTo?.length || 0)}</span>
           </div>
           <div className="flex gap-4 items-center">
             <input type="number" value={formData.baseInventory || ''} onChange={e => setFormData({ ...formData, baseInventory: e.target.value === '' ? undefined : parseInt(e.target.value) })} className="flex-1 border border-slate-200 rounded-xl px-4 py-3 font-bold bg-white text-sm" placeholder="不填则默认为 900+ 随机数" />
             <p className="flex-1 text-[10px] leading-relaxed text-slate-400 font-bold italic">不输入时系统会自动生成一个 900+ 随机库存，输入后以您输入的数量为基准。售出记录会自动扣除。</p>
           </div>
        </div>

        {/* 状态与推荐 */}
        <div className="flex gap-4 pt-4">
          <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold bg-white cursor-pointer shadow-sm">
            <option value="selling">🚀 在售中</option>
            <option value="sold_out">⛔ 已售罄</option>
          </select>
          <label className={cn("flex-1 flex items-center justify-center gap-3 border rounded-xl cursor-pointer transition-all", formData.isHot ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white border-slate-200 text-slate-500")}>
            <input type="checkbox" checked={formData.isHot} onChange={e => setFormData({ ...formData, isHot: e.target.checked })} className="size-5 accent-orange-500" />
            <span className="text-sm font-black">设为主页【热门推荐】</span>
          </label>
          {formData.type === 'figma' && (
            <label className={cn("flex-1 flex items-center justify-center gap-3 border rounded-xl cursor-pointer transition-all", formData.hasInteraction ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-200 text-slate-500")}>
              <input type="checkbox" checked={formData.hasInteraction} onChange={e => setFormData({ ...formData, hasInteraction: e.target.checked })} className="size-5 accent-blue-500" />
              <span className="text-sm font-black">包含交互</span>
            </label>
          )}
        </div>

        {/* 技术标签 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500">技术标签 (输入后按回车添加)</label>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
            {formData.tech?.map(t => (
              <span key={t} className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2">
                {t} <button type="button" onClick={() => setFormData({...formData, tech: formData.tech?.filter(x => x !== t)})} className="hover:text-red-400"><X size={10} /></button>
              </span>
            ))}
          </div>
          <input value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={e => {
            if(e.key === 'Enter') {
              e.preventDefault();
              if(techInput.trim() && !formData.tech?.includes(techInput.trim())) {
                setFormData({...formData, tech: [...(formData.tech || []), techInput.trim()]});
                setTechInput('');
              }
            }
          }} className="w-full border border-slate-100 rounded-xl px-4 py-3 text-xs bg-slate-50 font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-300" placeholder="例如 HTML, CSS 等..." />
        </div>

        {/* 文案说明 */}
        <div className="space-y-2 pt-4">
          <label className="text-xs font-bold text-slate-500">详细描述文案</label>
          <textarea rows={8} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium bg-slate-50 outline-none leading-relaxed resize-none focus:bg-white focus:border-blue-200 transition-all" placeholder="输入功能卖点、技术说明等..." />
        </div>

        {/* 保存按钮 */}
        <div className="pt-8">
          <button type="submit" disabled={isSaving || isUploading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            保存修改内容
          </button>
        </div>
      </form>
    </div>
  );
}
