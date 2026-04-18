import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share, AlertTriangle, Heart, X } from 'lucide-react';
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

  if (!product) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">商品加载中或已删除... 🥺</div>;

  const inventory = getBaseInventory(product) - (product.soldTo?.length || 0);
  const galleryItems = [product.cover, ...(product.images || [])].filter(Boolean);

  const handleCopy = () => {
    const msg = `老板，我想咨询这个作品：\n编号：NO.${product.id}\n分类：${typeLabels[product.type] || product.type}\n标题：${product.title}`;
    navigator.clipboard.writeText(msg);
    alert('已复制作品信息到剪贴板 💖');
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] pb-32 animate-in fade-in duration-500">
      <header className="fixed top-0 w-full z-40 flex items-center justify-between p-4 mix-blend-difference text-white">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex border-white/20 items-center justify-center bg-white/10 backdrop-blur rounded-full"><ChevronLeft size={24} /></button>
        <button className="w-10 h-10 flex border-white/20 items-center justify-center bg-white/10 backdrop-blur rounded-full"><Share size={20} /></button>
      </header>

      <div className="w-full aspect-[4/3] bg-pink-100 relative">
        <img src={product.cover} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setGalleryOpen(true)} />
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl space-y-4 border border-white">
          <div className="font-mono text-xs font-black text-pink-400 bg-pink-50 px-3 py-1 rounded w-fit capitalize">编号 NO. {product.id}</div>
          <h1 className="text-2xl font-black text-slate-800">{product.title}</h1>
          
          <div className="flex items-end justify-between border-b border-slate-50 pb-5">
            <span className="text-2xl font-black text-[#f43f5e]">宝贝价格请咨询客服</span>
            <div className="text-right"><div className="text-[10px] font-bold text-slate-400">当前库存总量</div><div className="text-sm font-black text-emerald-500">剩 {inventory} 份</div></div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             <div className="bg-slate-50 rounded-2xl p-3 text-center"><span className="text-[10px] text-slate-400 font-bold block mb-1">页面数量</span><span className="text-xs font-black text-slate-700">{product.pages} 页</span></div>
             <div className="bg-slate-50 rounded-2xl p-3 text-center"><span className="text-[10px] text-slate-400 font-bold block mb-1">格式分类</span><span className="text-xs font-black text-slate-700">{typeLabels[product.type] || product.type}</span></div>
             <div className="bg-slate-50 rounded-2xl p-3 text-center"><span className="text-[10px] text-slate-400 font-bold block mb-1">细分主题</span><span className="text-xs font-black text-slate-700">{product.theme}</span></div>
          </div>
        </div>

        {product.soldTo?.length > 0 && (
          <div className="bg-rose-50/40 rounded-[2.5rem] p-6 border border-rose-100/50">
            <h3 className="text-rose-500 font-black flex items-center gap-2 mb-4 text-sm"><AlertTriangle size={18} /> 以下学校已购买，请勿重复下单</h3>
            <div className="space-y-2">{product.soldTo.map(s => <div key={s.id} className="bg-white p-3 rounded-xl border border-rose-50 text-[11px] font-bold text-slate-700 flex justify-between"><span>{s.school}</span><span className="text-slate-300 italic">{getFuzzyDate(s.date)}</span></div>)}</div>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm">
           <h3 className="font-black text-slate-800 flex items-center gap-2 mb-4"><Heart size={18} className="fill-pink-400 text-pink-400" /> 特色详情</h3>
           <div className="text-[13px] font-bold text-slate-500 leading-loose whitespace-pre-wrap">{product.description || '无详细内容介绍 🍒'}</div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button onClick={() => navigate('/check')} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black text-slate-500">自助查重</button>
          <button onClick={handleCopy} className="flex-[2] bg-[#f43f5e] text-white py-4 rounded-2xl font-black shadow-lg shadow-rose-200">复制商品信息给闲鱼客服</button>
        </div>
      </div>

      {galleryOpen && (
        <div className="fixed inset-0 z-[100] bg-black p-4 flex flex-col items-center justify-center animate-in fade-in" onClick={() => setGalleryOpen(false)}>
           <button className="absolute top-6 right-6 text-white"><X size={32} /></button>
           <img src={galleryItems[currentIndex]} className="max-w-full max-h-full object-contain" />
           {galleryItems.length > 1 && (
             <div className="flex gap-2 mt-6 overflow-x-auto p-2">
               {galleryItems.map((img, i) => <img key={i} src={img} onClick={e => { e.stopPropagation(); setCurrentIndex(i); }} className={cn("w-14 h-14 object-cover rounded-xl border-2 transition-all", currentIndex === i ? "border-rose-500 scale-110" : "border-white/20 opacity-50")} />)}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
