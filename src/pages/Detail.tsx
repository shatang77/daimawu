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

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 p-4 flex items-center justify-center animate-in fade-in select-none"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white p-2">
        <X size={32} />
      </button>

      <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center">
        {images.length > 1 && (
          <button onClick={prev} className="absolute left-0 p-3 text-white/50 hover:text-white z-10">
            <ChevronLeft size={48} className="drop-shadow-lg" />
          </button>
        )}

        <img 
          src={images[currentIndex]} 
          className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
          onClick={(e) => e.stopPropagation()}
        />

        {images.length > 1 && (
          <button onClick={next} className="absolute right-0 p-3 text-white/50 hover:text-white z-10">
            <ChevronRight size={48} className="drop-shadow-lg" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 font-bold tracking-widest text-sm bg-black/50 px-4 py-2 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useStore(state => state.products.find(p => p.id === id));
  
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9FB]">
        <div className="text-center font-bold text-slate-400 text-lg">商品加载中或已删除... 🥺</div>
      </div>
    );
  }

  const inventory = getBaseInventory(product) - (product.soldTo?.length || 0);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `快来看这个作品：编号 NO.${product.id} ${product.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板 💖');
    }
  };

  const handleCopyInfo = () => {
    const typeLabel = typeLabels[product.type] || product.type;
    const msg = `老板，我想咨询这个作品：\n编号：NO.${product.id}\n分类：${typeLabel}\n标题：${product.title}`;
    navigator.clipboard.writeText(msg);
    alert('商品信息已复制！快去粘贴给客服吧 💖');
  };

  const galleryImages = [product.cover, ...(product.images || [])].filter(Boolean);

  const openGallery = (index: number) => {
    setInitialSlide(index);
    setGalleryOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] pb-24 font-sans animate-in fade-in duration-500">
      
      {/* 头部 */}
      <header className="fixed top-0 w-full z-40 flex items-center justify-between p-4 mix-blend-difference text-white">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur border border-white/20 rounded-full active:scale-90 transition-all">
          <ChevronLeft size={24} className="stroke-[3]" />
        </button>
        <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur border border-white/20 rounded-full active:scale-90 transition-all">
          <Share size={20} className="stroke-[2.5]" />
        </button>
      </header>

      {/* 画廊详情展示 */}
      {galleryOpen && (
        <GalleryModal 
          images={galleryImages} 
          initialSlide={initialSlide} 
          onClose={() => setGalleryOpen(false)} 
        />
      )}

      {/* 封面图 */}
      <div className="w-full aspect-[4/3] bg-pink-100 relative">
        <img 
          src={product.cover} 
          alt={product.title} 
          className="w-full h-full object-cover cursor-zoom-in" 
          onClick={() => openGallery(0)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 w-full flex flex-col gap-6">
        {/* 主要信息 */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_10px_40px_rgba(255,182,193,0.3)] border border-white">
          <div className="font-mono text-xs font-black text-pink-400 bg-pink-50 px-3 py-1 rounded-lg mb-4 w-fit uppercase">编号 NO. {product.id}</div>
          <h1 className="text-2xl font-black text-slate-800 leading-tight mb-4">{product.title}</h1>
          
          {/* 恢复缩略图列表预览 */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 snap-x hide-scrollbar">
              {galleryImages.map((img, idx) => (
                <div 
                  key={idx}
                  className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-slate-50 cursor-pointer snap-start transition-all hover:scale-105 active:scale-95"
                  onClick={() => openGallery(idx)}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between border-b border-slate-50 pb-5 mb-5">
            <span className="text-2xl font-black text-[#f43f5e]">以标价为准</span>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 mb-1 leading-none uppercase tracking-tighter">当前剩余</div>
              <div className="text-sm font-black text-emerald-500">剩 {inventory} 份</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
             <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-400 mb-1">页面数量</span>
                <span className="text-sm font-black text-slate-700">{product.pages} 页</span>
             </div>
             <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-400 mb-1">格式分类</span>
                <span className="text-sm font-black text-slate-700">{typeLabels[product.type] || product.type}</span>
             </div>
             <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 mb-1">细分主题</span>
                <span className="text-sm font-black text-slate-700 truncate w-full text-center">{product.theme}</span>
             </div>
          </div>
        </div>

        {/* 已售出记录 - 核心警告区 */}
        {product.soldTo && product.soldTo.length > 0 && (
          <div className="rounded-[2rem] p-6 shadow-sm border bg-[#FFF4F6] border-pink-100">
              <h3 className="text-rose-600 font-extrabold flex items-center gap-2 mb-4 text-base">
                <AlertTriangle size={20} className="stroke-[3]" />
                以下学校已购买
              </h3>
              <div className="space-y-2">
                {product.soldTo.map(s => (
                  <div key={s.id} className="bg-white/80 p-3.5 rounded-2xl border border-rose-50 text-sm flex items-center justify-between group">
                    <div className="font-extrabold text-slate-800">{s.school}</div>
                    <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm">
                      {getFuzzyDate(s.date)}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* 作品描述 */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50 mb-12">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
            <Heart size={18} className="fill-pink-200 text-pink-400" /> 作品详情
          </h3>
          <div className="text-sm font-bold text-slate-500 leading-loose whitespace-pre-wrap mb-10">
            {product.description || '店主很懒，没有留下描述的内容~ 🍒'}
          </div>

          <button 
            onClick={handleCopyInfo}
            className="w-full bg-gradient-to-r from-[#FFB6C1] to-[#FF8FAB] text-white font-black py-4 rounded-3xl shadow-[0_10px_30px_rgb(255,182,193,0.6)] active:scale-95 transition-all text-lg relative overflow-hidden flex items-center justify-center gap-2 group"
          >
            <div className="absolute inset-0 bg-white/20 w-full translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
            直接复制商品信息给客服
          </button>
        </div>
      </div>
    </div>
  );
}
