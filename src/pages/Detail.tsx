import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Share, AlertTriangle, Heart, X } from 'lucide-react';
import { useStore, getBaseInventory } from '../store/useStore';
import { cn, getFuzzyDate } from '../lib/utils';

const typeLabels: Record<string, string> = {
  'static': '网页制作',
  'ps': 'PS设计',
  'figma': 'Figma设计'
};

function GalleryModal({ images, initialSlide, onClose }: { images: string[], initialSlide: number, onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(initialSlide);
  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1)); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1)); };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 p-4 flex items-center justify-center animate-in fade-in" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 p-2"><X size={32} /></button>
      <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center">
        {images.length > 1 && (
          <button onClick={prev} className="absolute left-0 p-3 text-white/50 z-10"><ChevronLeft size={48} /></button>
        )}
        <img src={images[currentIndex]} className="max-w-full max-h-full object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        {images.length > 1 && (
          <button onClick={next} className="absolute right-0 p-3 text-white/50 z-10"><ChevronRight size={48} /></button>
        )}
      </div>
    </div>
  );
}

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useStore(state => state.products.find(p => p.id === id));
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  if (!product) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9FB] font-bold text-slate-400">正在获取商品详情... 🍒</div>;

  const inventory = getBaseInventory(product) - (product.soldTo?.length || 0);
  const galleryImages = [product.cover, ...(product.images || [])].filter(Boolean);

  const handleCopy = () => {
    const msg = `我想咨询作品：\n编号：NO.${product.id}\n分类：${typeLabels[product.type] || product.type}\n标题：${product.title}`;
    navigator.clipboard.writeText(msg);
    alert('已复制作品信息到剪贴板！快去发给客服吧 💖');
  };

  const openGallery = (idx: number) => {
    setInitialSlide(idx);
    setGalleryOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] pb-16 animate-in fade-in duration-500">
      <header className="fixed top-0 w-full z-40 flex items-center justify-between p-4 mix-blend-difference text-white">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex border-white/20 items-center justify-center bg-white/10 backdrop-blur rounded-full"><ChevronLeft size={24} /></button>
        <button className="w-10 h-10 flex border-white/20 items-center justify-center bg-white/10 backdrop-blur rounded-full"><Share size={20} /></button>
      </header>

      {galleryOpen && (
        <GalleryModal images={galleryImages} initialSlide={initialSlide} onClose={() => setGalleryOpen(false)} />
      )}

      <div className="w-full aspect-[4/3] bg-pink-100 relative">
        <img src={product.cover} className="w-full h-full object-cover cursor-zoom-in" onClick={() => openGallery(0)} />
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-white space-y-4">
          <div className="font-mono text-xs font-black text-pink-400 bg-pink-50 px-3 py-1 rounded w-fit capitalize">编号 NO. {product.id}</div>
          <h1 className="text-xl font-black text-slate-800 leading-snug">{product.title}</h1>
          
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {galleryImages.map((img, i) => (
                <img key={i} src={img} onClick={() => openGallery(i)} className="w-16 h-16 shrink-0 object-cover rounded-xl border border-slate-50 cursor-pointer" />
              ))}
            </div>
          )}

          <div className="flex items-end justify-between border-b border-slate-50 pb-5">
            <span className="text-2xl font-black text-[#f43f5e]">以标价为准</span>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400">目前余</div>
              <div className="text-sm font-black text-emerald-500">剩 {inventory} 份</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
             <div className="bg-slate-50 rounded-2xl p-3 text-center"><span className="text-[10px] text-slate-400 font-bold block mb-1">页面数量</span><span className="text-xs font-black text-slate-700">{product.pages} 页</span></div>
             <div className="bg-slate-50 rounded-2xl p-3 text-center"><span className="text-[10px] text-slate-400 font-bold block mb-1">格式分类</span><span className="text-xs font-black text-slate-700">{typeLabels[product.type] || product.type}</span></div>
             <div className="bg-slate-50 rounded-2xl p-3 text-center overflow-hidden"><span className="text-[10px] text-slate-400 font-bold block mb-1 underline-offset-2">细分主题</span><span className="text-xs font-black text-slate-700 truncate block">{product.theme}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
           <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4"><Heart size={18} className="fill-pink-400 text-pink-400" /> 特色详情</h3>
           <div className="text-sm font-bold text-slate-500 leading-loose whitespace-pre-wrap mb-10">{product.description || '无详细内容介绍 🍒'}</div>

           <div className="space-y-4 mb-10">
              {product.images?.map((img, idx) => (
                <img key={idx} src={img} className="w-full rounded-2xl shadow-sm border border-slate-50 cursor-zoom-in" onClick={() => openGallery(idx + 1)} />
              ))}
           </div>

           <button onClick={handleCopy} className="w-full bg-[#f43f5e] text-white py-4 rounded-3xl font-black shadow-lg shadow-rose-200 active:scale-95 transition-all text-base">直接复制商品信息给闲鱼客服</button>
        </div>
      </div>
    </div>
  );
}
