import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Product, ProductType, getBaseInventory } from '../../store/useStore';
import { ChevronLeft, Save, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNew = !id;
  
  const products = useStore(state => state.products);
  const addProduct = useStore(state => state.addProduct);
  const updateProduct = useStore(state => state.updateProduct);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    title: '',
    type: 'static',
    cover: '',
    images: [],
    pages: 1,
    theme: '',
    tech: [],
    description: '',
    status: 'selling',
    isHot: false,
    soldTo: []
  });

  const [techInput, setTechInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isInitialLoadRef = useRef(false);

  useEffect(() => {
    // 每次切换 ID 时重置初始化标记
    isInitialLoadRef.current = false;
  }, [id, isNew]);

  useEffect(() => {
    // 只有在切换 ID 或者刚进入页面时才初始化一次表单
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
      } else if (products.length > 0 && !p) {
        setErrorMsg('找不到对应商品');
      }
    } else if (isNew && !isInitialLoadRef.current) {
      // 只有在知道确实没有商品（初始为空）或者已经获取到商品列表时才初始化
      // 这样可以避免在数据加载过程中生成错误的 0010 编号
      const usedIds = products.map(p => parseInt(p.id, 10)).filter(n => !isNaN(n));
      const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 9;
      
      setFormData(prev => ({ 
        ...prev, 
        // 如果用户已经手动输入了，就不覆盖
        id: prev.id || String(maxId + 1).padStart(4, '0'),
        images: prev.images || [],
        tech: prev.tech || [],
        soldTo: prev.soldTo || []
      }));
      
      // 只有当 store 明确表示已经尝试拉取过数据且有结果（或确认没结果）时，才算初始化完成
      if (products.length > 0) {
        isInitialLoadRef.current = true;
      }
    }
  }, [id, isNew, products]); // 恢复 products 依赖，但用 Ref 保护

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
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
        // 先再次全量检查一次本地，看是否有冲突（防止多开页面导致的逻辑覆盖）
        if (products.some(p => p.id === formData.id)) {
          setErrorMsg('编号已存在，请修改并保持唯一（或前往列表页进行编辑）');
          setIsSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        await addProduct(formData as Omit<Product, 'createdAt' | 'updatedAt'>);
        setSuccessMsg('发布成功！正在跳转...');
      } else {
        await updateProduct(formData.id!, formData);
        setSuccessMsg('保存成功！正在跳转...');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 增加一个明显的弹窗提示，确保用户知道成功了
      const timer = setTimeout(() => {
        navigate('/admin/products');
      }, 1000);
      
      return () => clearTimeout(timer);
    } catch (err: any) {
      setIsSaving(false);
      let msg = err.message || '未知错误';
      console.error("Save Error:", err);
      
      if (msg.includes('duplicate key value violates unique constraint "products_pkey"')) {
        msg = '保存失败：作品编号(ID)已存在！如果您是想修改该作品，请在列表页点击其名称后的“编辑”按钮。如果您正在发布新作品，请修改编号。';
      } else if (msg.includes('column "images"') || msg.includes('column "baseInventory"')) {
        msg = '数据库表缺少必要的列。请前往 Supabase 执行 SQL: \n\nalter table products add column if not exists images jsonb default \'[]\'::jsonb;\nalter table products add column if not exists "baseInventory" int4;';
      }
      
      setErrorMsg('操作失败: ' + msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 实在没反应的情况下弹出原生 alert
      alert('保存失败了！\n原因：' + msg);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 500) { // Over 500KB slightly soft check, but browser can do base64 fine mostly. Let's warn.
      alert('封面图片建议小于500KB以保证小应用性能！超过依然允许上传');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, cover: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const imagesInputRef = useRef<HTMLInputElement>(null);

  const handleMultiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let processed = 0;
    
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          newImages.push(reader.result as string);
        }
        processed++;
        if (processed === files.length) {
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), ...newImages]
          }));
          if (imagesInputRef.current) imagesInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
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
      {galleryOpen && galleryImages.length > 0 && (
         <div className="fixed inset-0 z-[100] bg-black/95 p-4 flex items-center justify-center animate-in fade-in" onClick={() => setGalleryOpen(false)}>
            <div className="absolute top-6 right-6 text-white cursor-pointer"><Plus size={32} className="rotate-45" /></div>
            <div className="max-w-4xl max-h-full">
               <img src={galleryImages[initialSlide]} className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
               {galleryImages.length > 1 && (
                 <div className="flex gap-2 mt-4 overflow-x-auto p-2 justify-center">
                    {galleryImages.map((img, i) => (
                      <div 
                        key={i} 
                        className={cn("w-12 h-12 rounded border-2 cursor-pointer transition-all", initialSlide === i ? "border-blue-500 scale-110" : "border-white/20 opacity-50")}
                        onClick={e => { e.stopPropagation(); setInitialSlide(i); }}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                 </div>
               )}
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

      {errorMsg && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100">{errorMsg}</div>}
      {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl font-bold text-sm border border-green-100">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-8">
        
        {/* Cover Upload Area */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700">作品封面图 (建议4:3比例)</label>
          <div className="flex items-start gap-6">
            <div 
              className="w-40 h-30 sm:w-48 sm:h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-slate-400 group relative shrink-0"
            >
               {formData.cover ? (
                 <img src={formData.cover} className="w-full h-full object-cover" alt="封面预览" onClick={() => openPreview(0)} />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon size={32} className="mb-2 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-bold group-hover:text-blue-500">点击上传图片</span>
                 </div>
               )}
               <input 
                 type="file" 
                 accept="image/*" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleFileChange} 
               />
               
               {/* Hover Overlay if has image */}
               {formData.cover && (
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center text-white pointer-events-none">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><Upload size={20} /></div>
                    <span className="text-[10px] font-bold">点击预览 / 更换在右侧操作</span>
                 </div>
               )}
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs text-slate-500">自动转为 Base64 存储，不占用外部服务器。<br/>或者您也可直接粘贴图片外链 URL：</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={formData.cover || ''} 
                  onChange={e => setFormData({ ...formData, cover: e.target.value })} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm outline-none focus:border-blue-500 focus:bg-white" 
                  placeholder="https://..." 
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-700">本地换图</button>
              </div>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, cover: ''})}
                className="text-xs text-red-500 font-bold hover:underline"
              >清除图片</button>
            </div>
          </div>
        </div>

        {/* Multi Image Upload Area */}
        <div className="space-y-3 border-t border-slate-100 pt-8">
          <label className="text-sm font-bold text-slate-700">页面预览图 (可上传多张，点击图可以预览)</label>
          <div className="flex flex-wrap gap-4">
            {(formData.images || []).map((img, idx) => (
              <div key={idx} className="w-24 h-24 relative rounded-xl overflow-hidden border border-slate-200 group cursor-zoom-in shadow-sm hover:shadow-md transition-shadow">
                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" onClick={() => openPreview(idx + 1)} />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <Plus size={12} className="rotate-45" />
                </button>
              </div>
            ))}
            
            <div 
              onClick={() => imagesInputRef.current?.click()}
              className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-slate-400"
            >
              <Plus size={24} className="mb-1" />
              <span className="text-[10px] font-bold">批量上传</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                ref={imagesInputRef} 
                className="hidden" 
                onChange={handleMultiImageUpload} 
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">这些图片将在详情页下方用于展示每一页的细节。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 flex justify-between">
              <span>唯一编号 <span className="text-red-500">*</span></span>
              {isNew && formData.id && products.some(p => p.id === formData.id) && (
                <span className="text-[10px] text-rose-500 font-black animate-pulse">⚠️ 编号已存在</span>
              )}
            </label>
            <input 
              disabled={!isNew}
              type="text" 
              placeholder="建议格式: 0010"
              value={formData.id} 
              onChange={e => setFormData({ ...formData, id: e.target.value })} 
              className={cn(
                "w-full border rounded-xl px-4 py-3 bg-slate-50 outline-none transition-all font-mono font-bold",
                !isNew ? "text-slate-400 border-slate-200 cursor-not-allowed" : 
                (formData.id && products.some(p => p.id === formData.id)) ? "border-rose-400 bg-rose-50 text-rose-600 focus:border-rose-500" : "border-slate-200 focus:border-blue-500"
              )} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">作品类型 <span className="text-red-500">*</span></label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({ ...formData, type: e.target.value as ProductType })} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold bg-white"
            >
              <option value="static">静态网页</option>
              <option value="ps">PS设计稿</option>
              <option value="figma">Figma设计稿</option>
            </select>
          </div>
        </div>

        {formData.type === 'figma' && (
          <div className="space-y-1 pt-4 border-t border-slate-50">
             <label className="text-sm font-bold text-slate-700">Figma 交互设置</label>
             <label className="flex items-center gap-3 px-6 py-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors bg-white w-max">
               <input 
                 type="checkbox" 
                 checked={formData.hasInteraction || false} 
                 onChange={e => setFormData({ ...formData, hasInteraction: e.target.checked })}
                 className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 cursor-pointer accent-orange-500" 
               />
               <span className="text-sm font-bold text-orange-600">此作品是否包含交互逻辑 (即有交互)</span>
             </label>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">完整标题 <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })} 
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold text-slate-800" 
            placeholder="如：某某大学官方网站源码" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">页面数量</label>
            <input 
              type="number" 
              value={formData.pages || ''} 
              onChange={e => setFormData({ ...formData, pages: parseInt(e.target.value) || 0 })} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500" 
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">细分主题 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={formData.theme || ''} 
              onChange={e => setFormData({ ...formData, theme: e.target.value })} 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold" 
              placeholder="如：学校官网、电商等 (将作为前端筛选项)" 
            />
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <div className="space-y-1">
             <label className="text-sm font-bold text-slate-700 flex justify-between">
               <span>基础库存量</span>
               <span className="text-xs font-normal text-slate-400">目前余：{getBaseInventory(formData as Product) - (formData.soldTo?.length || 0)}</span>
             </label>
             <div className="flex gap-4 items-center">
               <input 
                 type="number" 
                 value={formData.baseInventory || ''} 
                 onChange={e => setFormData({ ...formData, baseInventory: e.target.value === '' ? undefined : parseInt(e.target.value) })} 
                 placeholder="不填则默认为 900+ 随机数"
                 className="flex-1 border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-800 font-bold outline-none focus:border-blue-500"
               />
               <div className="text-xs text-slate-400 max-w-[200px]">不输入时系统会自动生成一个 900+ 的随机库存，输入后以您输入的数量为基准。售出记录会自动扣除。</div>
             </div>
          </div>
        </div>
        
        <div className="space-y-2 border-t border-slate-50 pt-4">
          <label className="text-sm font-bold text-slate-700">销售状态 / 推荐栏目</label>
          <div className="flex gap-4">
            <select 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value as 'selling'|'sold_out' })} 
              className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 font-bold bg-white"
            >
              <option value="selling">🚀 在售中</option>
              <option value="sold_out">⛔ 已售罄</option>
            </select>
            <label className="flex items-center gap-3 px-6 py-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors bg-white">
              <input 
                type="checkbox" 
                checked={formData.isHot || false} 
                onChange={e => setFormData({ ...formData, isHot: e.target.checked })}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 cursor-pointer accent-orange-500" 
              />
              <span className="text-sm font-bold text-orange-600">设为主页【热门推荐】</span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">技术标签 (输入后按回车添加)</label>
          <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
            {(formData.tech || []).map(t => (
               <span key={t} className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 font-bold tracking-wider">
                 {t} <button type="button" onClick={() => handleTechRemove(t)} className="hover:text-red-400 active:scale-95">&times;</button>
               </span>
            ))}
          </div>
          <input 
            type="text" 
            value={techInput} 
            onChange={e => setTechInput(e.target.value)} 
            onKeyDown={handleTechAdd}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 bg-slate-50" 
            placeholder="例如 HTML, CSS 等..." 
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-slate-700">详细描述文案</label>
          <textarea 
            rows={5}
            value={formData.description || ''} 
            onChange={e => setFormData({ ...formData, description: e.target.value })} 
            className="w-full border border-slate-200 rounded-xl px-4 py-4 outline-none focus:border-blue-500 resize-none leading-relaxed text-sm bg-slate-50" 
            placeholder="填写详细介绍..." 
          />
        </div>

        {/* Fixed Save Button Bottom */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 p-4 md:static md:bg-transparent md:border-0 md:p-0 flex justify-end z-50">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-10 py-4 rounded-xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:bg-slate-400"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                正在保存中...
              </>
            ) : (
              <>
                <Save size={20} /> {isNew ? '确认发布作品' : '保存修改内容'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
