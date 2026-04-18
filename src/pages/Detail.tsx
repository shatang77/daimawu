import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share, AlertTriangle, Heart, X, ChevronRight } from 'lucide-react';
import { useStore, getBaseInventory } from '../store/useStore';
import { cn, getFuzzyDate } from '../lib/utils';

const typeLabels: Record<string, string> = {
  'static': '网页制作',
  'ps': 'PS设计',
  'figma': 'Figma设计'
};

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useStore(state => state.products.find(p => p.id === id));
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!product) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">商品走丢啦 🥺</div>;

  const inventory = getBaseInventory(product) - (product.soldTo?.length || 0);
  const allImages = [product.cover, ...(product.images || [])].filter(Boolean);

  const handleCopyInfo = () => {
    const msg = `我想了解作品：\n编号：NO.${product.id}\n分类：${typeLabels[product.type] || product.type}\n标题：${product.title}`;
    navigator.clipboard.writeText(msg);
    alert('商品信息已复制！快去发送给客服吧 💖');
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] pb-32 animate-in fade-in duration-500">
      <header className="fixed top-0 w-full z-40 flex items-center justify-between p-4 mix-blend-difference text-white">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full active:scale-95 transition-all"><ChevronLeft size={24} /></button>
        <button className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full active:scale-95 transition-all"><Share size={20} /></button>
      </header>

      <div className="w-full aspect-[4/3] bg-pink-100 relative shadow-xl">
        <img src={product.cover} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setGalleryOpen(true)} />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        <div className="bg-white rounded-[2rem] p-6 shadow-xl space-y-4">
          <div className="font-mono text-sm font-black text-pink-400 bg-pink-50 px-3 py-1 rounded-lg w-fit">编号 NO. {product.id}</div>
          <h1 className="text-2xl font-black text-slate-800 leading-snug">{product.title}</h1>
          
          <div className="flex items-end justify-between border-b border-slate-50 pb-5">
            <span className="text-2xl font-black text-rose-500 tracking-tight">宝贝价格请咨询客服</span>
            <div className="text-right"><div className="text-[10px] font-bold text-slate-400">当前余</div><div className="text-sm font-black text-emerald-500">剩 {inventory} 份</div></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center"><span className="text-[10px] text-slate-400 font-bold mb-1">页面数量</span><span className="text-xs font-black text-slate-700">{product.pages} 页</span></div>
             <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center"><span className="text-[10px] text-slate-400 font-bold mb-1">格式分类</span><span className="text-xs font-black text-slate-700">{typeLabels[product.type] || product.type}</span></div>
             <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center"><span className="text-[10px] text-slate-400 font-bold mb-1">细分主题</span><span className="text-xs font-black text-slate-700">{product.theme}</span></div>
          </div>

          {product.tech?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">{product.tech.map(t => <span key={t} className="bg-slate-900 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest">{t}</span>)}</div>
          )}
        </div>

        {product.soldTo?.length > 0 && (
          <div className="bg-rose-50/50 rounded-[2rem] p-6 border border-rose-100 shadow-sm">
            <h3 className="text-rose-600 font-black flex items-center gap-2 mb-4 text-sm"><AlertTriangle size={18} /> 以下学校已购买，请勿重复下单</h3>
            <div className="space-y-2">{product.soldTo.map(s => <div key={s.id} className="bg-white p-3 rounded-xl border border-rose-50 text-xs font-bold text-slate-700 flex justify-between"><span>{s.school}</span><span className="text-slate-400">{getFuzzyDate(s.date)}</span></div>)}</div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-8 shadow-sm space-y-4">
           <h3 className="font-black text-slate-800 flex items-center gap-2"><Heart size={18} className="fill-pink-400 text-pink-400" /> 特色详情</h3>
           <div className="text-sm font-bold text-slate-500 leading-loose whitespace-pre-wrap">{product.description || '暂无详细介绍 🍒'}</div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 z-50">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button onClick={() => navigate('/check')} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black text-slate-600 active:scale-95 transition-all">查重中心</button>
          <button onClick={handleCopyInfo} className="flex-[2] bg-pink-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-pink-200 active:scale-95 transition-all">复制详情咨询闲鱼客服</button>
        </div>
      </div>

      {galleryOpen && (
        <div className="fixed inset-0 z-[100] bg-black p-4 flex flex-col items-center justify-center animate-in fade-in" onClick={() => setGalleryOpen(false)}>
           <button className="absolute top-6 right-6 text-white"><X size={32} /></button>
           <img src={allImages[currentIndex]} className="max-w-full max-h-full object-contain" />
           {allImages.length > 1 && (
             <div className="flex gap-2 mt-6 overflow-x-auto p-2">
               {allImages.map((img, i) => <img key={i} src={img} onClick={e => { e.stopPropagation(); setCurrentIndex(i); }} className={cn("w-12 h-12 object-cover rounded border-2 transition-all", currentIndex === i ? "border-pink-500 scale-110" : "border-white/20 opacity-50")} />)}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
