import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const globalError = useStore(state => state.globalError);
  const isOnline = useStore(state => state.isOnline);
  const _fetchProducts = useStore(state => state._fetchProducts);
  const setGlobalError = useStore(state => state.setGlobalError);

  const handleRetry = async () => {
    setGlobalError(null);
    await _fetchProducts();
  };

  const tabs = [
    { name: '设计主页', path: '/', icon: "" },
    { name: '自助查重', path: '/check', icon: "🔍" },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-gray-800 pb-24 sm:pb-0 font-sans mx-auto max-w-7xl pt-safe selection:bg-pink-200">
      {/* 电脑端顶部导航 */}
      <header className="hidden sm:flex items-center justify-between px-8 py-5 bg-white shadow-sm sticky top-0 z-50 rounded-b-3xl">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold tracking-tight text-pink-500 flex items-center gap-2">
            <Sparkles className="fill-pink-500 animate-pulse" />
            一校一份代码屋
          </h1>
          {globalError && (
             <div className="flex items-center gap-1 mt-1 text-[10px] text-red-500 font-bold animate-pulse">
               <AlertCircle size={10} /> 数据库连线受阻，部分展示可能异常
             </div>
          )}
        </div>
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === '/' && location.pathname.startsWith('/list'));
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex items-center space-x-2 font-bold transition-transform hover:scale-105 active:scale-95",
                  isActive ? "text-pink-500 bg-pink-50 px-4 py-2 rounded-full" : "text-gray-500 hover:text-gray-800 px-4 py-2"
                )}
              >
                {tab.icon && <span className="text-lg">{tab.icon}</span>}
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* 离线浮动提醒 */}
      {!isOnline && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-white border-2 border-red-500 p-1 rounded-full shadow-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
            <AlertCircle size={14} className="animate-pulse" />
            <span className="text-[10px] font-black whitespace-nowrap tracking-wider uppercase">连线受阻，正尝试自动修复</span>
          </div>
          <button 
            onClick={handleRetry}
            className="pr-4 pl-1 py-2 text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-[10px] font-black uppercase">立即修复</span>
          </button>
        </div>
      )}

      {/* 主体区域 */}
      <div className="flex-1 w-full relative">
        <Outlet />
      </div>

      {/* 手机悬浮胶囊底部导航 - 可爱精美风 */}
      <div className="sm:hidden fixed bottom-6 w-full flex justify-center px-4 z-50 pointer-events-none">
        <nav className="bg-white/90 backdrop-blur-xl border border-pink-100 shadow-[0_8px_30px_rgb(255,192,203,0.3)] flex justify-around py-2 px-3 rounded-full w-[85%] max-w-sm pointer-events-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === '/' && location.pathname.startsWith('/list'));
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex items-center justify-center space-x-2 py-2 px-6 rounded-full transition-all duration-300",
                  isActive ? "bg-pink-100 text-pink-600 font-extrabold shadow-sm scale-105" : "text-gray-400 font-bold hover:text-gray-600"
                )}
              >
                {tab.icon && <span className="text-xl">{tab.icon}</span>}
                <span className="text-sm">{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

    </div>
  );
}
