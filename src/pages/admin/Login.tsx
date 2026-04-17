import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ShieldCheck, Lock, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const loginManagerWithEmail = useStore(state => state.loginManagerWithEmail);
  const isAdminLoggedIn = useStore(state => state.isAdminLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdminLoggedIn) {
      navigate('/admin/dashboard');
    }
  }, [isAdminLoggedIn, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    try {
      await loginManagerWithEmail(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || '邮箱或密码错误，请重试。');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="bg-white/80 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-500 text-center">
        <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200 mx-auto">
          <ShieldCheck className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">安全控制台</h1>
        <p className="text-slate-500 text-sm mb-8 font-medium">仅限系统授权管理员登录，无授权请勿尝试。</p>

        <form onSubmit={handleEmailLogin} className="space-y-4 text-left mt-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">后台账号</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ShieldCheck size={18} className="text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-4 pl-11 pr-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-200 outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">管理密码</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-4 pl-11 pr-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-200 outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-rose-600 text-white rounded-2xl py-4 text-sm font-bold shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-transform flex items-center justify-center mt-2"
          >
            <LogIn size={18} className="mr-2" /> 验证并进入
          </button>
        </form>

        {error && <p className="mt-6 text-sm text-rose-500 font-bold px-2 bg-rose-50 py-3 rounded-xl border border-rose-100">{error}</p>}
        
        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <button onClick={() => navigate('/')} className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors">
            &larr; 返回前台首页
          </button>
        </div>
      </div>
    </div>
  );
}
