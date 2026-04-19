import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map, Copy, CheckCircle2, ArrowRight } from 'lucide-react';
import { useStore, ProductType } from '../store/useStore';
import { cn, getFuzzyDate } from '../lib/utils';
import { format } from 'date-fns';

export default function Check() {
  const navigate = useNavigate();
  const products = useStore(state => state.products);

  const [currentStep, setCurrentStep] = useState(1);
  const [queryType, setQueryType] = useState<ProductType>('static');
  
  const [schoolKeyword, setSchoolKeyword] = useState('');
  const [productTheme, setProductTheme] = useState('');
  const [productId, setProductId] = useState('');
  const [fidelityFilter, setFidelityFilter] = useState<'all'|'high'|'low'>('all');
  
  const [hasSearched, setHasSearched] = useState(false);

  const handleSelectType = (type: ProductType) => {
    setQueryType(type);
    setCurrentStep(2);
    setHasSearched(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolKeyword.trim() && (productId.trim() || productTheme.trim() || queryType === 'figma')) {
      setHasSearched(true);
    } else if (!productId.trim() && !productTheme.trim()) {
      alert("请输入作品编号或主题~");
    }
  };

  const results = () => {
    if (!hasSearched) return [];
    
    const kwSchool = schoolKeyword.toLowerCase().trim();
    const kwId = productId.toLowerCase().trim();
    const kwTheme = productTheme.toLowerCase().trim();
    const hits: Array<{ product: any; record: any }> = [];

    products.forEach(p => {
      if (p.type !== queryType) return;
      
      const matchId = kwId ? p.id.toLowerCase().includes(kwId) : true;
      const matchTheme = kwTheme ? (p.theme.toLowerCase().includes(kwTheme) || p.title.toLowerCase().includes(kwTheme)) : true;
      
      if (!matchId || !matchTheme) return;

      // Filter by fidelity for figma
      if (queryType === 'figma' && fidelityFilter !== 'all') {
         // Determine fidelity logic from boolean `hasInteraction`. Let's assume hasInteraction=true means 'high' fidelity
         const isHigh = !!p.hasInteraction;
         if (fidelityFilter === 'high' && !isHigh) return;
         if (fidelityFilter === 'low' && isHigh) return;
      }
      
      p.soldTo.forEach(record => {
        if (record.school.toLowerCase().includes(kwSchool)) {
          hits.push({ product: p, record });
        }
      });
    });

    return hits;
  };

  const searchResults = results();

  const handleCopy = () => {
    const typeLabel = queryType === 'static' ? 'Web网页' : queryType === 'ps' ? 'PS设计' : 'Figma设计';
    const msg = `哈喽，我想了解【${typeLabel} - ${productTheme.trim() || '未知主题'}】，编号【${productId.trim() || '未知'}】，我的学校关键词是【${schoolKeyword.trim()}】。`;
    navigator.clipboard.writeText(msg);
    alert('复制成功！快去发送给闲鱼客服吧~ 💖');
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-[4px] px-1 font-black shadow-sm">{part}</mark> 
        : part
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF9FB] pb-24 overflow-x-hidden">
      
      {/* 头部大块 */}
      <div className="bg-gradient-to-b from-[#FFB6C1] to-[#FF9EAE] rounded-b-[3rem] px-6 pt-6 pb-12 shadow-[0_10px_40px_rgb(255,182,193,0.4)] text-white relative lg:max-w-4xl lg:mx-auto lg:rounded-[3rem] lg:mt-8 animate-in fade-in duration-500">
        <div className="absolute top-4 right-4 text-6xl opacity-30 font-emoji mix-blend-overlay pointer-events-none">✨</div>
        <div className="absolute bottom-4 left-6 text-6xl opacity-20 font-emoji mix-blend-overlay pointer-events-none rotate-12">🔍</div>
        <h1 className="text-3xl lg:text-4xl font-black mb-3 drop-shadow-sm flex items-center gap-2">自助查重站</h1>
        <p className="font-bold opacity-90 text-sm lg:text-base leading-relaxed">彻底拒绝撞车！极简两步，即可查询历史售出记录。</p>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 -mt-8 relative z-10">
        
        {/* 查询卡片 */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-pink-100/50 mb-8 border border-white min-h-[300px]">
          
          {currentStep === 1 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both">
              <div className="flex items-center gap-2 mb-6">
                 <div className="bg-[#FFB6C1] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm">1</div>
                 <h2 className="text-xl font-black text-slate-800">请选择你要查询的类型</h2>
              </div>
              
              <div className="space-y-4">
                {[
                  { id: 'static', label: 'Web网页', emoji: '🧑‍💻', desc: 'HTML, CSS, JS 代码' },
                  { id: 'ps', label: 'PS设计', emoji: '🎨', desc: 'Photoshop 视觉稿' },
                  { id: 'figma', label: 'Figma 设计 原型图', emoji: '🧸', desc: '包含高保真 / 低保真' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectType(t.id as ProductType)}
                    className="w-full bg-slate-50 hover:bg-pink-50 border-2 border-transparent hover:border-pink-200 p-5 rounded-[1.5rem] flex items-center justify-between group transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {t.emoji}
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-black text-slate-800 mb-0.5">{t.label}</div>
                        <div className="text-xs font-bold text-slate-400">{t.desc}</div>
                      </div>
                    </div>
                    <ArrowRight className="text-slate-300 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                   <div className="bg-[#FFB6C1] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm">2</div>
                   <h2 className="text-xl font-black text-slate-800">填写详情信息</h2>
                </div>
                <button 
                  onClick={() => { setCurrentStep(1); setHasSearched(false); }}
                  className="text-xs font-bold text-slate-400 hover:text-pink-500 bg-slate-50 px-3 py-1.5 rounded-full transition-colors"
                >
                  重选类型
                </button>
              </div>

              <form onSubmit={handleSearch} className="space-y-5">
                <div className="bg-slate-50 p-5 rounded-[1.5rem] space-y-5">
                  <div>
                     <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">查询学校名称关键字 <span className="text-rose-500">*</span></label>
                     <input 
                       type="text" 
                       value={schoolKeyword}
                       onChange={e => { setSchoolKeyword(e.target.value); setHasSearched(false); }}
                       placeholder="如：北京、清华" 
                       className="w-full bg-white border-none rounded-xl py-4 px-5 text-sm font-bold text-slate-800 shadow-sm placeholder-slate-300 focus:ring-2 focus:ring-[#FFB6C1] transition-shadow outline-none"
                       required
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">主题 (选填)</label>
                       <input 
                         type="text" 
                         value={productTheme}
                         onChange={e => { setProductTheme(e.target.value); setHasSearched(false); }}
                         placeholder="如：蛋糕" 
                         className="w-full bg-white border-none rounded-xl py-4 px-5 text-sm font-bold text-slate-800 shadow-sm placeholder-slate-300 focus:ring-2 focus:ring-[#FFB6C1] transition-shadow outline-none"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">商品编号</label>
                       <input 
                         type="text" 
                         value={productId}
                         onChange={e => { setProductId(e.target.value); setHasSearched(false); }}
                         placeholder="如：0010" 
                         className="w-full bg-white border-none rounded-xl py-4 px-5 text-sm font-bold text-slate-800 shadow-sm placeholder-slate-300 focus:ring-2 focus:ring-[#FFB6C1] transition-shadow outline-none"
                       />
                    </div>
                  </div>

                  {queryType === 'figma' && (
                    <div>
                       <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2 block">保真度过滤 (选填)</label>
                       <select 
                         value={fidelityFilter}
                         onChange={e => { setFidelityFilter(e.target.value as 'all'|'high'|'low'); setHasSearched(false); }}
                         className="w-full bg-white border-none rounded-xl py-4 px-5 text-sm font-bold text-slate-800 shadow-sm placeholder-slate-300 focus:ring-2 focus:ring-[#FFB6C1] transition-shadow outline-none"
                       >
                         <option value="all">不限保真度</option>
                         <option value="high">高保真</option>
                         <option value="low">低保真</option>
                       </select>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 font-bold px-2 text-center">提示：条件越详细查询越精准哦</p>

                <button type="submit" className="w-full bg-gradient-to-r from-[#FFB6C1] to-[#FF9EAE] text-white py-4 rounded-2xl font-black text-lg shadow-[0_8px_20px_rgb(255,182,193,0.5)] active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2">
                  <Search size={22} className="stroke-[3]" /> 开始查询
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 查询结果 */}
        {hasSearched && currentStep === 2 && (
          <div className="animate-in zoom-in-95 duration-400 fade-in fill-mode-both">
            {searchResults.length === 0 ? (
              <div className="bg-white border-2 border-green-100 rounded-[2rem] p-8 text-center shadow-lg shadow-green-50/50 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-50 rounded-full blur-xl"></div>
                <div className="text-5xl mb-4 animate-bounce">🎉</div>
                <h3 className="text-2xl font-black text-green-600 mb-2">安全！没有售出过该校</h3>
                <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed px-4">
                  太棒了，【{highlightText(schoolKeyword, schoolKeyword)}】还未购买过符合条件的模板！赶快点击下方告诉客服吧~
                </p>
                <button onClick={handleCopy} className="bg-green-500 hover:bg-green-400 text-white font-extrabold py-4 px-8 rounded-2xl shadow-xl shadow-green-200 active:scale-95 transition-all w-full flex items-center justify-center gap-2 text-base">
                   <Copy size={20} /> 一键复制给闲鱼客服
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-black text-rose-500 mb-4 px-2 flex items-center gap-2">
                   ⚠️ 哎呀，找到相似的购买记录！
                </h3>
                <div className="space-y-4">
                  {searchResults.map((hit, idx) => (
                    <div key={idx} className="bg-white rounded-[2rem] p-5 shadow-sm border border-rose-100 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="absolute top-0 right-0 w-2 h-full bg-rose-300"></div>
                      <div>
                        <div className="text-xl font-black text-slate-800 mb-1 leading-snug">
                          {highlightText(hit.record.school, schoolKeyword)}
                        </div>
                        <div className="text-xs font-bold text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded-md">
                          出售时间: {getFuzzyDate(hit.record.date)}
                        </div>
                      </div>
                      
                      <div onClick={() => navigate(`/detail/${hit.product.id}`)} className="bg-rose-50 rounded-xl p-3 flex items-center justify-between cursor-pointer active:bg-rose-100 transition-colors">
                        <div>
                          <div className="text-xs font-black text-rose-400 mb-0.5">编号 NO. {hit.product.id}</div>
                          <div className="text-sm font-extrabold text-rose-900">{hit.product.title}</div>
                        </div>
                        <span className="text-rose-600 font-black text-xs shrink-0 bg-white px-3 py-1.5 rounded-lg shadow-sm">看详情</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 底部还有个兜底的复制按钮给不听劝的用户 */}
                <div className="mt-8 text-center pt-8 border-t border-rose-100 border-dashed">
                  <p className="text-slate-400 font-bold text-xs mb-3">想继续咨询客服可点击按钮直接复制哦</p>
                  <button onClick={handleCopy} className="bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-600 font-extrabold py-3 px-6 rounded-2xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2 mx-auto">
                     <Copy size={16} /> 复制查重信息发给客服
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
