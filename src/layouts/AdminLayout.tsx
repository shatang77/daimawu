import { Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { LogOut, LayoutDashboard, Package, Home, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminLayout() {
  const navigate = useNavigate();
  const logoutAdmin = useStore(state => state.logoutAdmin);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const navs = [
    { name: '管理面板', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: '作品管理', path: '/admin/products', icon: Package },
    { name: '密码设置', path: '/admin/settings', icon: Settings },
    { name: '返回前台', path: '/', icon: Home, highlight: true }
  ];

  const globalError = useStore(state => state.globalError);
  const setGlobalError = useStore(state => state.setGlobalError);
  const _fetchProducts = useStore(state => state._fetchProducts);
  const isOnline = useStore(state => state.isOnline);

  const handleRetry = async () => {
    setGlobalError(null);
    await _fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row max-w-[1440px] mx-auto shadow-2xl relative">
      {globalError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white border-2 border-red-500 p-1 rounded-2xl shadow-2xl animate-in slide-in-from-top-full duration-300 max-w-[90vw] w-[400px]">
          <div className="bg-red-50 p-4 rounded-xl flex items-start gap-4">
            <div className="bg-red-500 p-2 rounded-full shrink-0">
              <Settings size={20} className="text-white animate-spin" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm text-red-900">数据库连线受阻</h4>
              <p className="text-[10px] text-red-700 mt-1 leading-relaxed font-bold whitespace-pre-wrap">{globalError}</p>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={handleRetry}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-[10px] font-black shadow-lg shadow-red-200 active:scale-95 transition-all"
                >
                  立即重试
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-[10px] font-black active:scale-95 transition-all"
                >
                  刷新页面
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col md:min-h-screen">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 uppercase">代码屋控制台</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 animate-pulse")} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                {isOnline ? 'Online' : 'Connection Error'}
              </span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible items-center md:items-stretch">
          {navs.map(item => {
            const Icon = item.icon;
            const active = window.location.hash.includes(item.path);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap",
                  active && !item.highlight ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                  item.highlight && "md:mt-auto bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                )}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 bg-gray-50 overflow-y-auto relative">
        <Outlet />
      </main>
      
      {/* Mobile top float logout */}
      <div className="md:hidden absolute top-4 right-4 z-50">
        <button 
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-full bg-slate-800 text-red-400 shadow-lg"
          >
            <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
