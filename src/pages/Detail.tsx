import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Share, AlertTriangle, Heart, X } from 'lucide-react';
import { useStore, getBaseInventory } from '../store/useStore';
import { cn, getFuzzyDate } from '../lib/utils';
import { format } from 'date-fns';

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
          <button onClick={prev} className="absolute left-0 lg:-left-12 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10">
            <ChevronLeft size={48} className="drop-shadow-lg" />
          </button>
        )}

        <img 
          src={images[currentIndex]} 
          className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" 
          onClick={(e) => e.stopPropagation()}
        />

        {images.length > 1 && (
          <button onClick={next} className="absolute right-0 lg:-right-12 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10">
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
        <div className="text-center font-bold text-slate-400 text-lg">商品走丢啦 🥺</div>
      </div>
    );
  }

  const inventory = getBaseInventory(product) - (product.soldTo?.length || 0);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `快来看这个宝藏代码：编号 NO.${product.id} ${product.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制，快去分享给同学吧！💖');
    }
  };

  const handleCopyInfo = () => {
    const typeLabel = typeLabels[product.type] || product.type;
    const msg = `哈喽老板在吗～我想了解这个作品：\n编号：NO.${product.id}\n分类：${typeLabel}\n标题：${product.title}`;
    navigator.clipboard.writeText(msg);
    alert('商品信息已复制！快去粘贴给闲鱼客服吧 💖');
  };

  const galleryImages = product.cover ? [product.cover, ...(product.images || [])] : (product.images || []);

  const openGallery = (index: number) => {
    setInitialSlide(index);
    setGalleryOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] pb-[100px] font-sans animate-in slide-in-from-bottom-4 duration-400">
      
      {/* 悬浮头部 */}
      <header className="fixed top-0 w-full z-40 flex items-center justify-between p-4 mix-blend-difference text-white">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full active:scale-90 transition-all shadow-lg hover:bg-white/20">
          <ChevronLeft size={24} className="stroke-[3]" />
        </button>
        <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full active:scale-90 transition-all shadow-lg hover:bg-white/20">
          <Share size={20} className="stroke-[2.5]" />
        </button>
      </header>

      {/* 侧滑/全屏查看大图组件 */}
      {galleryOpen && galleryImages.length > 0 && (
        <GalleryModal 
          images={galleryImages} 
          initialSlide={initialSlide} 
          onClose={() => setGalleryOpen(false)} 
        />
      )}

      {/* 封面图片 */}
      <div className="w-full aspect-[4/3] sm:aspect-video bg-pink-100 relative lg:max-w-5xl lg:mx-auto lg:mt-6 lg:rounded-[3rem] lg:overflow-hidden lg:shadow-xl shadow-pink-200">
        {product.cover ? (
          <img 
            src={product.cover} 
            alt={product.title} 
            className="w-full h-full object-cover cursor-zoom-in" 
            onClick={() => galleryImages.length > 0 && openGallery(0)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-pink-300">
            <span className="text-6xl mb-2">🖼️</span>
            <span className="font-extrabold text-lg tracking-widest">NO PIC</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none mix-blend-overlay"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 w-full flex flex-col gap-6">
        {/* 主要信息卡片 */}
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_10px_40px_rgb(255,182,193,0.3)] border border-white">
          <div className="flex justify-between items-start mb-1">
            <div className="font-mono text-sm font-black text-pink-400 bg-pink-50 px-2.5 py-1 rounded-lg mb-2">编号 NO. {product.id}</div>
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 leading-snug mb-4">{product.title}</h1>
          
          {product.images && product.images.length > 0 && (
             <div className="flex gap-2 overflow-x-auto pb-4 mb-2 snap-x hide-scrollbar">
                {galleryImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-300 cursor-pointer snap-start transition-colors"
                    onClick={() => openGallery(idx)}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
             </div>
          )}

          <div className="flex items-end justify-between border-b border-slate-50 pb-5 mb-5">
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-slate-400"></span>
              <span className="text-2xl sm:text-3xl font-black text-rose-500">以闲鱼标价为准</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 mb-1">当前库存总量</div>
              <div className="text-sm font-black text-green-500 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">剩 {inventory} 份</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
             <div className="bg-cyan-50/50 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 mb-1">页面数量</span>
                <span className="text-sm font-black text-slate-700">{product.pages} 页</span>
             </div>
             <div className="bg-purple-50/50 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-400 mb-1">格式分类</span>
                <span className="text-sm font-black text-slate-700 uppercase">{typeLabels[product.type] || product.type}</span>
             </div>
             <div className="bg-orange-50/50 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-slate-400 mb-1">细分主题</span>
                <span className="text-sm font-black text-slate-700 truncate w-full">{product.theme}</span>
             </div>
          </div>

          {product.tech && product.tech.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tech.map(t => (
                <span key={t} className="bg-slate-900 text-white text-[10px] px-3 py-1 p-2 rounded-full font-black tracking-widest">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* 已售出记录 - 核心警告区 */}
        {product.soldTo && product.soldTo.length > 0 && (
          <div className="rounded-[2rem] p-6 mb-6 shadow-sm border bg-[#FFF4F6] border-pink-100">
              <h3 className="text-rose-600 font-extrabold flex items-center gap-2 mb-4 text-base">
                <AlertTriangle size={20} className="stroke-[3]" />
                以下学校已购买，请勿重复下单哦
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
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50 mb-6">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Heart size={18} className="fill-pink-200 text-pink-400" /> 作品详情</h3>
          <div className="text-sm font-bold text-slate-500 leading-loose whitespace-pre-wrap">
            {product.description || '店主很懒，没有留下描述的内容~ 🍒'}
          </div>
        </div>
      </div>

      {/* 底部悬浮交易按钮组 */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 pb-safe z-50 lg:max-w-5xl lg:left-1/2 lg:-translate-x-1/2 lg:rounded-t-[3rem] shadow-[0_-20px_40px_rgb(0,0,0,0.03)]">
        <div className="flex gap-3 max-w-5xl mx-auto">
          <button 
            onClick={() => navigate('/check')}
            className="flex-1 bg-slate-100 text-slate-700 font-black py-4 rounded-2xl active:scale-95 transition-transform text-sm"
          >
            自助查重
          </button>
          <button 
            onClick={handleCopyInfo}
            className="flex-[2.5] bg-gradient-to-r from-[#FFB6C1] to-[#FF8FAB] text-white font-black py-4 rounded-2xl shadow-[0_10px_25px_rgb(255,182,193,0.5)] active:scale-95 transition-transform text-base relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 w-full translate-x-[-100%] hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
            直接复制商品信息给闲鱼客服
          </button>
        </div>
      </div>
    </div>
  );
}
