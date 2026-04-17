import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function Products() {
  const products = useStore(state => state.products);
  const deleteProduct = useStore(state => state.deleteProduct);
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = useMemo(() => {
    if (!search) return products;
    const kw = search.toLowerCase();
    return products.filter(p => p.id.includes(kw) || p.title.toLowerCase().includes(kw));
  }, [products, search]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      setDeleteId(null);
    } catch (e: any) {
      setErrorMsg(e.message || '删除失败');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const startDelete = (id: string, title: string) => {
    setDeleteId(id);
    setDeleteTitle(title);
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300">
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 text-red-600 px-6 py-3 rounded-full font-bold shadow-xl border border-red-100">
          {errorMsg}
        </div>
      )}
      
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-slate-900 mb-2">确认删除？</h3>
            <p className="text-slate-500 mb-8 font-medium">您确定要永久删除作品 <span className="font-bold text-red-500">【{deleteTitle}】</span> 吗？此操作不可恢复！</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-sm"
              >
                取消
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all text-sm"
              >
                确认且永久删除
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">作品管理</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="搜索编号或名称..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={() => navigate('/admin/product/new')}
            className="flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform shrink-0"
          >
            <Plus size={16} /> 新增
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">编号 / 封面</th>
                <th className="px-6 py-4 font-medium">标题 / 类型</th>
                <th className="px-6 py-4 font-medium">状态 / 标记</th>
                <th className="px-6 py-4 font-medium">售出学校记录</th>
                <th className="px-6 py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                        {p.cover ? <img src={p.cover} className="w-full h-full object-cover" alt="" /> : <span className="text-[10px] text-slate-400 flex h-full items-center justify-center">无图</span>}
                      </div>
                      <span className="font-mono font-bold text-slate-900 border border-slate-200 px-2 py-0.5 rounded-md bg-white">编号 NO. {p.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{p.title}</div>
                    <div className="text-slate-500 text-xs mt-1">{(p.type || 'static').toUpperCase()} / {p.theme}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-bold", p.status === 'selling' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {p.status === 'selling' ? '在售中' : '已售罄'}
                      </span>
                      {p.isHot && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">热门</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {console.log('Product row:', p.id, p.soldTo)}
                      <Users size={16} className={Array.isArray(p.soldTo) && p.soldTo.length > 0 ? "text-blue-500" : "text-slate-300"} />
                      <span className="font-bold text-slate-700">{Array.isArray(p.soldTo) ? p.soldTo.length : 0}所</span>
                      <button 
                        onClick={() => navigate(`/admin/product/sold/${p.id}`)}
                        className="ml-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                      >
                        管理记录
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button onClick={() => navigate(`/admin/product/edit/${p.id}`)} className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="编辑基本信息">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => startDelete(p.id, p.title)} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="永久删除">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    没有找到符合条件的作品
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
