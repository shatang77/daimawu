import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, SoldRecord } from '../../store/useStore';
import { ChevronLeft, Plus, Trash2, ShieldAlert, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ProductSold() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const products = useStore(state => state.products);
  const addSoldRecord = useStore(state => state.addSoldRecord);
  const deleteSoldRecord = useStore(state => state.deleteSoldRecord);
  const updateSoldRecord = useStore(state => state.updateSoldRecord);

  const product = React.useMemo(() => products.find(p => p.id === id), [products, id]);

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [school, setSchool] = useState('');
  const [note, setNote] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SoldRecord>>({});

  // 历史学校自动补全建议
  const allSoldRecords = React.useMemo(() => products.flatMap(p => p.soldTo || []), [products]);
  const suggestions = React.useMemo(() => {
    if (!school) return [];
    const uniqueSchools = Array.from(new Set<string>(allSoldRecords.map(r => r.school)));
    return uniqueSchools.filter(s => s.toLowerCase().includes(school.toLowerCase()) && s !== school).slice(0, 5);
  }, [allSoldRecords, school]);

  if (!product) {
    return <div className="p-8 text-center text-slate-500">找不到对应作品</div>;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school.trim()) return;
    
    const currentSoldTo = product.soldTo || [];
    if (currentSoldTo.some(s => s.school.trim() === school.trim())) {
      alert(`⚠️ 警告：该学校【${school}】已经购买过本作品，根据防撞车规则，不能重复添加！`);
      return;
    }

    try {
      await addSoldRecord(product.id, { school: school.trim(), date, note: note.trim() });
      setSchool('');
      setNote('');
      // 成功提醒
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4';
      toast.innerText = '✅ 记录已成功录入库中';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert('❌ 录入失败：' + (err.message || '未知错误'));
    }
  };

  const handleDelete = (sId: string, schoolName: string) => {
    if (window.confirm(`确定要删除学校【${schoolName}】的购买记录吗？查重库中将消失！`)) {
      deleteSoldRecord(product.id, sId);
    }
  };

  const startEditing = (record: SoldRecord) => {
    setEditingId(record.id);
    setEditForm(record);
  };

  const saveEditing = async () => {
    if (!editForm.school?.trim()) return;
    
    const currentSoldTo = product.soldTo || [];
    // Check duplication if changing school name
    const isNewName = editForm.school.trim() !== currentSoldTo.find((s: SoldRecord)=>s.id===editingId)?.school?.trim();
    if (isNewName && currentSoldTo.some(s => s.school.trim() === editForm.school?.trim() && s.id !== editingId)) {
        alert("此学校名已经在记录中了，不能重复！");
        return;
    }

    try {
      await updateSoldRecord(product.id, editingId!, editForm);
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      console.error(err);
      alert('❌ 修改失败：' + (err.message || '未知错误'));
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-slate-900">售出防重记录管理</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 mb-8">
        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
          {product.cover ? <img src={product.cover} className="w-full h-full object-cover" alt="" /> : <span className="text-xs text-slate-400 w-full h-full flex items-center justify-center">无图</span>}
        </div>
        <div>
          <div className="font-mono text-sm font-bold text-slate-500 mb-1">编号 NO. {product.id}</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{product.title}</h2>
          <div className="flex gap-2 text-xs">
             <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">当前记录：<strong className="text-blue-600">{(product.soldTo || []).length}</strong> 条</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左侧：添加新记录表单 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[1.5rem] shadow-[0_10px_30px_rgb(0,0,0,0.03)] border border-slate-100 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 pb-4">
              <Plus size={18} className="bg-slate-900 text-white rounded-full p-0.5" /> 录入新学校
            </h3>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1 relative">
                <label className="text-xs font-bold text-slate-500 uppercase">购买学校全称 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={school} 
                  onChange={e => setSchool(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-sm outline-none focus:border-blue-500 font-bold" 
                  placeholder="如：北京理工大学" 
                  required
                />
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  {suggestions.map((s, index) => (
                    <div 
                      key={`${s}-${index}`}
                      className="px-4 py-3 text-sm hover:bg-blue-50 text-slate-700 font-bold cursor-pointer transition-colors"
                      onClick={() => setSchool(s)}
                    >
                      {s}
                    </div>
                  ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">购买日期</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-sm outline-none focus:border-blue-500 font-bold" 
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">闲鱼备注 (可选)</label>
                <input 
                  type="text" 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-sm outline-none focus:border-blue-500" 
                  placeholder="买家ID等信息" 
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-transform flex justify-center items-center gap-2 mt-6"
              >
                立即添加到库
              </button>
            </form>
          </div>
        </div>

        {/* 右侧：记录列表 */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-1">
            <ShieldAlert className="text-blue-500" size={20} /> 已经登记保护的名录
          </h3>
          
          {(!product.soldTo || product.soldTo.length === 0) ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center text-slate-400 flex flex-col items-center">
              <div className="text-4xl mb-2 grayscale opacity-50">📂</div>
              <div className="font-bold">暂无出售记录，敞开售卖吧！</div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Using a reverse mapping so newest shows at top visually if wanted, but keep order stable */}
              {[...product.soldTo].reverse().map((s, index) => (
                <div key={`${s.id}-${index}`} className="bg-white rounded-2xl p-5 shadow-[0_5px_15px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-all">
                  
                  {editingId === s.id ? (
                    <div className="flex-1 space-y-3">
                       <input 
                         type="text" 
                         value={editForm.school || ''} 
                         onChange={e => setEditForm({...editForm, school: e.target.value})}
                         className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 font-bold"
                       />
                       <div className="flex gap-2">
                         <input 
                           type="date" 
                           value={editForm.date || ''} 
                           onChange={e => setEditForm({...editForm, date: e.target.value})}
                           className="w-32 border border-blue-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500"
                         />
                         <input 
                           type="text" 
                           value={editForm.note || ''} 
                           onChange={e => setEditForm({...editForm, note: e.target.value})}
                           placeholder="备注"
                           className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500"
                         />
                       </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-black text-slate-800 text-lg mb-1">{s.school}</h4>
                      <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-400">
                        <span className="bg-slate-50 px-2 py-1 rounded-md">📆 {s.date && !isNaN(new Date(s.date).getTime()) ? format(new Date(s.date), 'yyyy-MM-dd') : '无效日期'}</span>
                        {s.note && <span className="bg-slate-50 px-2 py-1 rounded-md">📝 {s.note}</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 self-end sm:self-center shrink-0">
                    {editingId === s.id ? (
                      <>
                        <button onClick={saveEditing} className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-xl transition-colors">
                          <CheckCircle2 size={18} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                          <XCircle size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(s)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="编辑记录">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(s.id, s.school)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="删除记录">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
