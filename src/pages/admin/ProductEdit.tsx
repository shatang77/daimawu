import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Product, ProductType, getBaseInventory } from '../../store/useStore';
import { supabase } from '../../lib/supabaseClient'; // 引入 supabase 客户端
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

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  const [formData, setFormData] = useState<Partial<Product>>({
    id: '', title: '', type: 'static', cover: '', images: [], pages: 1,
    theme: '', tech: [], description: '', status: 'selling', isHot: false, soldTo: []
  });

  const [techInput, setTechInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // 新增上传状态

  const isInitialLoadRef = useRef(false);

  useEffect(() => {
    isInitialLoadRef.current = false;
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew && id) {
      const p = products.find(x => x.id === id);
      if (p && !isInitialLoadRef.current) {
        setFormData(prev => ({
          ...p,
          images: p.images || [],
          tech: p.tech || [],
          soldTo: p.soldTo || []
        }));
        isInitialLoadRef.current = true;
      }
    } else if (isNew && !isInitialLoadRef.current) {
      const usedIds = products.map(p => parseInt(p.id, 10)).filter(n => !isNaN(n));
      const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 9;
      setFormData(prev => ({ 
        ...prev, 
        id: prev.id || String(maxId + 1).padStart(4, '0'),
        images: [],
        tech: [],
        soldTo: []
      }));
      if (products.length > 0) isInitialLoadRef.current = true;
    }
  }, [id, isNew, products]);

  // --- 核心：自动上传函数 ---
  const uploadToStorage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('covers') // 再次确认你已在 Supabase 建了名为 covers 的数据桶
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('covers').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || isUploading) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    if (!formData.id || !formData.title || !formData.theme) {
      setErrorMsg('请填写必填项(编号、标题、分类)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        if (products.some(p => p.id === formData.id)) {
          setErrorMsg('编号已存在，请修改并保持唯一');
          setIsSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        await addProduct(formData as Omit<Product, 'createdAt' | 'updatedAt'>);
        setSuccessMsg('发布成功！即将返回列表...');
      } else {
        await updateProduct(formData.id!, formData);
        setSuccessMsg('保存成功！正在跳转...');
      }
      setTimeout(() => navigate('/admin/products'), 1000);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg('保存失败: ' + (err.message || '未知错误'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTechAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (techInput.trim()) {
        const arr = formData.tech || [];
        if (!arr.includes(techInput.trim())) {
          setFormData({ ...formData, tech: [...arr, techInput.trim()] });
        }
        setTechInput('');
      }
    }
  };

  const handleTechRemove = (tech: string) => {
    setFormData({ ...formData, tech: (formData.tech || []).filter(t => t !== tech) });
  };

  // 封面上传处理
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMsg('');
    try {
      const url = await uploadToStorage(file);
      setFormData({ ...formData, cover: url });
      setSuccessMsg('封面图片已成功上传至云端并关联链接 ✨');
    } catch (err: any) {
      setErrorMsg('封面上传失败: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 多图上传处理
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setErrorMsg('');
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadToStorage(f)));
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    } catch (err: any) {
      setErrorMsg('预览图上传失败: ' + err.message);
    } finally {
      setIsUploading(false);
      if (imagesInputRef.current) imagesInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImgs = [...(prev.images || [])];
      newImgs.splice(index, 1);
      return { ...prev, images: newImgs };
    });
  };

  const openPreview = (idx: number) => {
    setInitialSlide(idx);
    setGalleryOpen(true);
  };

  const galleryImages = formData.cover ? [formData.cover, ...(formData.images || [])] : (formData.images || []);

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300 max-w-3xl mx-auto pb-24">
      {/* 预览大图模态框 */}
      {galleryOpen && galleryImages.length > 0 && (
         <div className="fixed inset-0 z-[100] bg-black/95 p-4 flex items-center justify-center" onClick={() => setGalleryOpen(false)}>
            <div className="absolute top-6 right-6 text-white cursor-pointer"><Plus size={32} className="rotate-45" /></div>
            <div className="max-w-4xl max-h-full">
               <img src={galleryImages[initialSlide]} className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
            </div>
         </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-2xl font-black text-slate-900">{isNew ? '发布新作品' : '编辑基本信息'}</h1>
        </div>
      </div>

      {(errorMsg || successMsg) && (
        <div className={cn("mb-6 p-4 rounded-xl font-bold text-sm border", errorMsg ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100")}>
          {errorMsg || successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-8">
        
        {/* Cover Upload Area */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 font-black">作品封面图 (自动上传云端)</label>
          <div className="flex items-start gap-6">
            <div 
              className="w-40 h-30 sm:w-48 sm:h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-slate-400 group relative shrink-0"
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
               {isUploading && !formData.cover ? (
                 <Loader2 className="animate-spin text-blue-500" />
               ) : formData.cover ? (
                 <img src={formData.cover} className="w-full h-full object-cover" alt="封面预览" />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center">
                    <ImageIcon size={32} className="mb-2 group-hover:text-blue-500" />
                    <span className="text-xs font-bold">点击上传图片</span>
                 </div>
               )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs text-slate-500">已自动切换为【云端存储】，不再占用数据库带宽速度更快。</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly
                  value={formData.cover || ''} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-[10px] text-slate-400 outline-none truncate" 
                  placeholder="等待上传..." 
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 disabled:opacity-50" disabled={isUploading}>更换图片</button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
              <button type="button" onClick={() => setFormData({...formData, cover: ''})} className="text-xs text-red-500 font-bold hover:underline">删除图片</button>
            </div>
          </div>
        </div>

        {/* 多图上传区 */}
        <div className="space-y-3 border-t border-slate-100 pt-8">
          <label className="text-sm font-bold text-slate-700 font-black">预览图片 (可多选，一键同步云端)</label>
          <div className="flex flex-wrap gap-3">
            {(formData.images || []).map((img, idx) => (
              <div key={idx} className="w-20 h-20 relative rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                <img src={img} className="w-full h-full object-cover" onClick={() => openPreview(idx + 1)} alt="预览" />
                <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Plus size={10} className="rotate-45" /></button>
              </div>
            ))}
            <div 
              onClick={() => !isUploading && imagesInputRef.current?.click()}
              className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-blue-50 transition-colors"
            >
              {isUploading ? <Loader2 className="animate-spin size-5 text-blue-500" /> : <Plus size={24} />}
            </div>
            <input type="file" multiple ref={imagesInputRef} className="hidden" onChange={handleMultiImageUpload} accept="image/*" />
          </div>
        </div>

        {/* 编号与类型 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">唯一编号 <span className="text-red-500">*</span></label>
            <input disabled={!isNew} type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 disabled:text-slate-400 outline-none focus:border-blue-500 font-mono font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">作品类型 <span className="text-red-500">*</span></label>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ProductType })} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold bg-white">
              <option value="static">静态网页</option>
              <option value="ps">PS设计稿</option>
              <option value="figma">Figma设计稿</option>
            </select>
          </div>
        </div>

        {/* 标题 */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">完整标题 <span className="text-red-500">*</span></label>
          <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-slate-800" placeholder="如：某某大学官方网站源码" />
        </div>

        {/* 页面与主题 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">页面数量</label>
            <input type="number" value={formData.pages || ''} onChange={e => setFormData({ ...formData, pages: parseInt(e.target.value) || 0 })} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">细分主题 <span className="text-red-500">*</span></label>
            <input type="text" value={formData.theme || ''} onChange={e => setFormData({ ...formData, theme: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" placeholder="如：学校官网、电商等" />
          </div>
        </div>
        
        {/* 背景库存逻辑 */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <div className="space-y-1">
             <label className="text-sm font-bold text-slate-700 flex justify-between font-black">
               <span>基础库存量</span>
               <span className="text-xs font-normal text-slate-400 tracking-tighter">余：{getBaseInventory(formData as Product) - (formData.soldTo?.length || 0)}</span>
             </label>
             <input type="number" value={formData.baseInventory || ''} onChange={e => setFormData({ ...formData, baseInventory: e.target.value === '' ? undefined : parseInt(e.target.value) })} placeholder="不填则默认为随机数" className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-800 font-bold outline-none" />
          </div>
        </div>

        {/* 标签 */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">技术标签 (按回车添加)</label>
          <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
            {(formData.tech || []).map(t => (
               <span key={t} className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 font-bold">{t} <button type="button" onClick={() => handleTechRemove(t)}>&times;</button></span>
            ))}
          </div>
          <input type="text" value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={handleTechAdd} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 bg-slate-50" placeholder="例如 HTML, CSS" />
        </div>

        {/* 描述 */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">说明文案</label>
          <textarea rows={5} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-4 outline-none resize-none leading-relaxed text-sm bg-slate-50" placeholder="详情描述..." />
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end pt-4 border-t border-slate-50 gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 font-bold text-slate-400">取消</button>
          <button 
            type="submit"
            disabled={isSaving || isUploading}
            className="flex items-center gap-2 bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving || isUploading ? <Loader2 className="animate-spin size-5" /> : <Save size={20} />}
            {isUploading ? '正在同步图片...' : isNew ? '确认发布作品' : '保存修改内容'}
          </button>
        </div>
      </form>
    </div>
  );
}
