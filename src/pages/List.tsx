import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore, getBaseInventory } from '../store/useStore';
import { cn } from '../lib/utils';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function List() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const products = useStore(state => state.products);
  const isLoading = useStore(state => state.isLoading);
  
  if (isLoading) return <LoadingSpinner />;
  
  const [pageFilter, setPageFilter] = useState('all');
  const [themeFilter, setThemeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [interactionFilter, setInteractionFilter] = useState<'all'|'yes'|'no'>('all');

  const baseProducts = useMemo(() => {
    if (!type) return [];
    return products.filter(p => p.type === type);
  }, [products, type]);

  const themes = useMemo(() => {
    const t = new Set(baseProducts.map(p => p.theme));
    return Array.from(t).filter(Boolean);
  }, [baseProducts]);

  const filteredProducts = useMemo(() => {
    let list = [...baseProducts];
    
    if (pageFilter !== 'all') {
      if (pageFilter === '1') list = list.filter(p => p.pages === 1);
      if (pageFilter === '3-5') list = list.filter(p => p.pages >= 3 && p.pages <= 5);
      if (pageFilter === '6-10') list = list.filter(p => p.pages >= 6 && p.pages <= 10);
      if (pageFilter === '10+') list = list.filter(p => p.pages > 10);
    }
    
    if (themeFilter !== 'all') {
      list = list.filter(p => p.theme === themeFilter);
    }

    if (type === 'figma' && interactionFilter !== 'all') {
      list = list.filter(p => interactionFilter === 'yes' ? !!p.hasInteraction : !p.hasInteraction);
    }
    
    list.sort((a, b) => {
      switch (sortOrder) {
        case 'id-asc': return a.id.localeCompare(b.id);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [baseProducts, pageFilter, themeFilter, sortOrder]);

  const titles: Record<string, { label: string, color: string }> = {
    'static': { label: 'Web 静态网页', color: 'bg-pink-100 text-pink-600' },
    'ps': { label: 'PS 高颜设计', color: 'bg-blue-100 text-blue-600' },
    'figma': { label: 'Figma 设计', color: 'bg-orange-100 text-orange-600' }
  };

  const headerInfo = titles[type || ''] || { label: '作品列表', color: 'bg-slate-100 text-slate-600' };

  return (
    <div className="min-h-screen bg-[#FFF9FB] pb-8 animate-in slide-in-from-right-4 duration-300 overflow-x-hidden">
      
      {/* 手机端头部适配可爱风格 */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 lg:hidden px-5 py-4 border-b border-pink-50 flex items-center justify-between shadow-sm rounded-b-[2rem]">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-pink-50 rounded-full text-pink-600 active:scale-95 transition-transform">
          <ChevronLeft size={24} className="stroke-[3]" />
        </button>
        <span className={cn("px-4 py-1.5 rounded-full font-black text-sm", headerInfo.color)}>
          {headerInfo.label}
        </span>
      </header>
      
      {/* 桌面端头部适配 */}
      <div className="hidden lg:flex items-center space-x-4 px-8 py-6 max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-full shadow-sm hover:scale-105 active:scale-95 transition-transform text-slate-800">
          <ChevronLeft size={24} className="stroke-[3]"/>
        </button>
        <span className={cn("px-5 py-2 rounded-full font-black text-lg shadow-sm border border-white", headerInfo.color)}>
          {headerInfo.label}
        </span>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 mt-6">
        
        {/* iOS风格圆滑手感筛选器 - 始终显示 */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm mb-8 border border-slate-50">
                <div className="space-y-4 text-sm">
                  <div className="flex items-start">
                    <span className="text-slate-400 font-extrabold tracking-widest w-16 shrink-0 py-2 uppercase text-sm">页数</span>
                    <div className="flex flex-wrap gap-3">
                      {['all', '1', '3-5', '6-10', '10+'].map(val => (
                        <button key={val} onClick={() => setPageFilter(val)} className={cn("px-5 py-2 rounded-full font-black transition-all text-base", pageFilter === val ? "bg-slate-800 text-white shadow-md scale-105" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                          {val === 'all' ? '全部' : val === '1' ? '单页' : val + '页'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <span className="text-slate-400 font-extrabold tracking-widest w-16 shrink-0 py-2 uppercase text-sm">分类</span>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => setThemeFilter('all')} className={cn("px-5 py-2 rounded-full font-black transition-all text-base", themeFilter === 'all' ? "bg-slate-800 text-white shadow-md scale-105" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                        全部
                      </button>
                      {themes.map(t => (
                        <button key={t} onClick={() => setThemeFilter(t)} className={cn("px-5 py-2 rounded-full font-black transition-all text-base", themeFilter === t ? "bg-slate-800 text-white shadow-md scale-105" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start border-t border-slate-50 pt-5">
                    <span className="text-slate-400 font-extrabold tracking-widest w-16 shrink-0 py-2 uppercase text-sm">排序</span>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { val: 'newest', label: '最新发布' },
                        { val: 'id-asc', label: '编号升序' }
                      ].map(opt => (
                        <button key={opt.val} onClick={() => setSortOrder(opt.val)} className={cn("px-5 py-2 rounded-full font-black transition-all text-base", sortOrder === opt.val ? "bg-slate-800 text-white shadow-md scale-105" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

              {type === 'figma' && (
                <div className="flex items-start border-t border-slate-50 pt-5">
                  <span className="text-slate-400 font-extrabold tracking-widest w-12 shrink-0 py-1.5 uppercase text-xs">交互</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: 'all', label: '全部' },
                      { val: 'yes', label: '有交互' },
                      { val: 'no', label: '无交互' }
                    ].map(opt => (
                      <button key={opt.val} onClick={() => setInteractionFilter(opt.val as 'all'|'yes'|'no')} className={cn("px-4 py-1.5 rounded-full font-black transition-all", interactionFilter === opt.val ? "bg-slate-800 text-white shadow-md scale-105" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* 瀑布流/网格商品区 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map(product => {
            const inventory = getBaseInventory(product) - (product.soldTo?.length || 0);
            return (
              <div 
                key={product.id} 
                onClick={() => navigate(`/detail/${product.id}`)}
                className="bg-white rounded-[1.5rem] p-2 shadow-sm border border-slate-50 cursor-pointer active:scale-95 transition-all hover:shadow-[0_10px_30px_rgb(255,182,193,0.3)] hover:-translate-y-1 flex flex-col group relative"
              >
                <div className="aspect-square bg-slate-100 overflow-hidden relative rounded-[1.2rem]">
                  {product.cover ? (
                    <img src={product.cover} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <span className="text-4xl mb-1">🖼️</span>
                      <span className="text-xs font-bold tracking-widest">NO PIC</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-pink-500 px-2.5 py-1 rounded-full font-black text-xs shadow-sm">
                    库存 {inventory}
                  </div>
                  <div className={cn(
                    "absolute bottom-2 right-2 text-xs px-2.5 py-1 rounded-full font-black shadow-sm backdrop-blur-md border border-white/20",
                    product.status === 'selling' ? "bg-green-500/90 text-white" : "bg-slate-800/90 text-white"
                  )}>
                    {product.status === 'selling' ? '抢购中' : '已售罄'}
                  </div>
                </div>
                
                <div className="p-3 pt-4">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 truncate mb-2">{product.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {product.pages}页
                    </span>
                    <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md relative overflow-hidden truncate max-w-[80px]">
                      {product.theme}
                    </span>
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center">
            <span className="text-6xl mb-4 opacity-50 grayscale">🥺</span>
            <div className="text-slate-400 font-bold text-lg">没有找到符合条件的作品 ~</div>
          </div>
        )}
      </div>
    </div>
  );
}
