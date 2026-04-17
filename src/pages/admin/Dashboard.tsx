import { useStore } from '../../store/useStore';
import { Package, TrendingUp, Archive, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const products = useStore(state => state.products);
  
  const totalProducts = products.length;
  const sellingProducts = products.filter(p => p.status === 'selling').length;
  const soldOutProducts = products.filter(p => p.status === 'sold_out').length;
  
  const totalSchools = products.reduce((acc, curr) => acc + curr.soldTo.length, 0);

  // Stats Card Component
  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) => (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-opacity-10 ${colorClass}`}>
        <Icon size={24} className={colorClass.split(' ')[1]} /> {/* extracts the text color class */}
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-300">
      <header className="mb-8 hidden md:block">
        <h1 className="text-2xl font-black text-slate-900">数据概览</h1>
        <p className="text-slate-500">欢迎回来，以下是当前系统的运行状态</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard title="商品总数" value={totalProducts} icon={Package} colorClass="bg-blue-500 text-blue-600" />
        <StatCard title="在售状态" value={sellingProducts} icon={TrendingUp} colorClass="bg-green-500 text-green-600" />
        <StatCard title="已售罄商品" value={soldOutProducts} icon={Archive} colorClass="bg-red-500 text-red-600" />
        <StatCard title="已覆盖学校" value={totalSchools} icon={ShieldAlert} colorClass="bg-purple-500 text-purple-600" />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">快捷操作</h3>
        <div className="flex flex-wrap gap-4">
          <a href="#/admin/product/new" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-slate-900/20 active:scale-95 transition-transform text-sm">
            发布新模板
          </a>
          <a href="#/admin/products" className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 active:scale-95 transition-transform text-sm">
            管理所有商品
          </a>
          <a href="#/check" className="bg-white border border-slate-200 text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 active:scale-95 transition-transform text-sm">
            前台查重测试
          </a>
        </div>
      </div>
    </div>
  );
}
