import { useNavigate } from 'react-router-dom';
import { Search, Flame, ArrowRight } from 'lucide-react';
import { useStore, getBaseInventory } from '../store/useStore';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Home() {
  const navigate = useNavigate();
  const products = useStore(state => state.products);
  const isLoading = useStore(state => state.isLoading);
  
  if (isLoading) return <LoadingSpinner />;

  const hotProducts = products.filter(p => p.isHot && p.status === 'selling').slice(0, 8); // 显示最多8个热门
  
  // 将热卖商品分成两行显示
  const row1 = hotProducts.slice(0, 4);
  const row2 = hotProducts.slice(4, 8);

  const ProductCard = ({ product }: { product: any }) => {
    const inventory = getBaseInventory(product) - (product.soldTo?.length || 0);
    return (
      <div 
        onClick={() => navigate(`/detail/${product.id}`)}
        className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-pink-50/50 cursor-pointer active:scale-95 transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col group p-2 min-w-[140px] w-[140px] sm:min-w-[180px] sm:w-[180px] shrink-0 snap-start"
      >
        <div className="aspect-[4/3] bg-slate-50 rounded-[1.2rem] overflow-hidden relative">
          {product.cover ? (
            <img 
              src={product.cover} 
              alt={product.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
              <span className="text-3xl mb-1">🖼️</span>
              <span className="text-xs font-bold">无图</span>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-pink-500 font-bold px-2 py-1 rounded-full text-[10px] sm:text-xs shadow-sm">
            库存 {inventory}
          </div>
        </div>
        <div className="pt-3 pb-1 px-2">
          <h3 className="text-[13px] sm:text-sm font-extrabold text-slate-800 truncate mb-1" title={product.title}>{product.title}</h3>
          <div className="flex justify-between items-end">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{product.theme}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto animate-in fade-in duration-500 overflow-x-hidden">
      
      {/* 欢迎模块 */}
      <header className="mb-8 pt-4 relative">
        <div className="absolute top-0 right-4 w-24 h-24 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-pulse"></div>
        <div className="absolute top-10 right-20 w-20 h-20 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
        <h1 className="text-3xl sm:text-[2.5rem] font-black tracking-tight text-slate-800 mb-2 drop-shadow-sm">哈喽同学！👋</h1>
        <p className="text-slate-500 font-black text-lg sm:text-2xl mt-1 leading-snug">想找什么设计或模板？都在这里啦 💖</p>
      </header>

      {/* 业务分类 Bento Card */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10">
        <div 
          onClick={() => navigate('/list/static')}
          className="col-span-2 sm:col-span-1 lg:col-span-1 bg-gradient-to-br from-[#FFB4D1] to-[#FF8FAB] rounded-[2rem] p-5 sm:p-7 text-white shadow-[0_10px_30px_rgb(255,143,171,0.3)] cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-6xl sm:text-7xl opacity-30 rotate-[-15deg]">💻</div>
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 relative z-10">✨</div>
          <h3 className="text-xl sm:text-2xl font-black mb-1 relative z-10 drop-shadow-md">静态网页</h3>
          <p className="text-[12px] sm:text-base text-pink-100 font-bold items-center flex gap-1 relative z-10">HTML, CSS, JS <ArrowRight size={14}/></p>
        </div>
        
        <div 
          onClick={() => navigate('/list/ps')}
          className="col-span-1 bg-gradient-to-br from-[#A7C5EB] to-[#80A4F0] rounded-[2rem] p-5 sm:p-7 text-white shadow-[0_10px_30px_rgb(128,164,240,0.3)] cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        >
          <div className="absolute -right-2 -bottom-2 text-5xl sm:text-7xl opacity-20 sm:opacity-30 rotate-[-15deg]">🎨</div>
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 relative z-10">🪄</div>
          <h3 className="text-xl sm:text-2xl font-black mb-1 relative z-10 drop-shadow-md leading-tight">PS 设计</h3>
          <p className="text-[12px] sm:text-base text-blue-100 font-bold items-center flex gap-1 relative z-10">高颜视觉 <ArrowRight size={14}/></p>
        </div>

        <div 
          onClick={() => navigate('/list/figma')}
          className="col-span-1 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-[#FCD49D] to-[#F1A25F] rounded-[2rem] p-5 sm:p-7 text-white shadow-[0_10px_30px_rgb(241,162,95,0.3)] cursor-pointer active:scale-95 transition-transform relative overflow-hidden"
        >
          <div className="absolute -right-2 -bottom-2 text-5xl sm:text-7xl opacity-20 sm:opacity-30 rotate-[-15deg]">📐</div>
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 relative z-10">🧸</div>
          <h3 className="text-xl sm:text-2xl font-black mb-1 relative z-10 drop-shadow-md leading-tight">Figma 设计</h3>
          <p className="text-[12px] sm:text-base text-orange-100 font-bold items-center flex gap-1 relative z-10">现代UI <ArrowRight size={14}/></p>
        </div>
      </div>

      {/* 热门在售 */}
      {hotProducts.length > 0 && (
        <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both w-full overflow-hidden">
          <div className="flex items-center justify-between mb-5 px-2">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Flame className="text-red-400 fill-red-400" size={24} /> 热卖商品
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {/* 第一行 */}
            <div className="flex overflow-x-auto snap-x gap-4 pb-4 no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
              {row1.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            
            {/* 第二行 */}
            {row2.length > 0 && (
              <div className="flex overflow-x-auto snap-x gap-4 pb-4 no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
                {row2.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 极简查重快捷入口 */}
      <div 
        onClick={() => navigate('/check')}
        className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform hover:shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-500 shadow-inner">
            <Search size={28} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 mb-0.5">自助查重</h2>
            <p className="text-xs font-bold text-slate-400">一键搜索该校是否买过~</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-500 transition-colors">
          <ArrowRight size={20} />
        </div>
      </div>

      {/* 管理员隐藏入口 */}
      <div className="flex justify-center mt-12 mb-6">
        <button 
          onClick={() => navigate('/admin/login')} 
          className="text-slate-400 font-bold text-xs bg-slate-100/50 px-4 py-2 rounded-full hover:bg-slate-200 transition-colors shadow-sm active:scale-95"
        >
          👨‍💻 管理员入口
        </button>
      </div>
    </div>
  );
}
