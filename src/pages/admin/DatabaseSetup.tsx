import React from 'react';
import { Database, Copy, CheckCircle, ExternalLink } from 'lucide-react';

export default function DatabaseSetup() {
  const [copied, setCopied] = React.useState(false);

  const sqlCode = `
-- 1. 创建商品表
create table if not exists products (
  id text primary key,
  type text,
  title text,
  cover text,
  images jsonb default '[]'::jsonb,
  pages integer,
  theme text,
  tech jsonb,
  price text,
  description text,
  status text,
  "isHot" boolean,
  "hasInteraction" boolean,
  "soldTo" jsonb default '[]'::jsonb,
  "createdAt" text,
  "updatedAt" text
);

-- 如果表面已经存在，添加 images 列（防呆）
alter table products add column if not exists images jsonb default '[]'::jsonb;

-- 2. 创建系统设置表 (用于存储管理员)
create table if not exists settings (
  id text primary key,
  admin_emails jsonb
);

-- 3. 关闭行级安全策略以允许国内客户端顺畅读写
alter table products disable row level security;
alter table settings disable row level security;

-- 最后：将您的创始账号写入数据库
insert into settings (id, admin_emails) 
values ('roles', '["lanu2617@gmail.com"]'::jsonb) 
on conflict do nothing;
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-slate-100">
        <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <Database size={48} className="mb-4 text-emerald-200" />
          <h1 className="text-3xl font-black mb-2">系统底层升级：国内直连数据库配置</h1>
          <p className="text-emerald-50">为了您的国内客户能够免翻墙极速访问您的商品，请按照以下 2 个步骤完成 Supabase 数据库直连配置。</p>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold flex items-center mb-4">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm mr-3">1</span>
              获取并填入连接秘钥
            </h2>
            <div className="text-slate-600 text-sm space-y-2 mb-4 bg-slate-50 p-4 rounded-xl">
              <p>1. 前往 <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline inline-flex items-center">Supabase 官网 <ExternalLink size={14} className="ml-1" /></a> 免费注册一个账号并新建一个 Project。</p>
              <p>2. 进入新建的项目，点击左下角的 <b>Settings</b> -{'>'} <b>API</b>。</p>
              <p>3. 找到 <b>Project URL</b> 和 <b>Project API keys (anon public)</b>。</p>
              <div className="bg-yellow-50/50 p-2 rounded text-xs border border-yellow-200 mt-2 mb-2">
                <p className="font-bold text-yellow-800">当前系统读取到的环境变量状态：</p>
                <p><b>URL:</b> {import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL : <span className="text-rose-500">❌ 未读取到</span>}</p>
                <p><b>KEY:</b> {import.meta.env.VITE_SUPABASE_ANON_KEY ? (import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...') : <span className="text-rose-500">❌ 未读取到</span>}</p>
                <p className="font-bold text-rose-600 mt-1">初始化错误信息：</p>
                <p className="text-rose-500 font-mono text-xs overflow-x-auto max-w-full block whitespace-pre-wrap word-wrap break-words">{window.localStorage.getItem('temp_sb_err') || '无'}</p>
              </div>
              <p>在您的代码项目根目录找到 <code className="bg-slate-200 px-1 py-0.5 rounded text-rose-500">.env</code> 文件（如果没有请自己新建一个改名成 .env）：</p>
              <pre className="mt-2 bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-xs">
                VITE_SUPABASE_URL=您刚复制的URL{'\n'}
                VITE_SUPABASE_ANON_KEY=您刚复制的长长的AnonKey
              </pre>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold flex items-center mb-4">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm mr-3">2</span>
              一键建表 (在控制台运行)
            </h2>
            <div className="text-slate-600 text-sm space-y-2 mb-4 bg-slate-50 p-4 rounded-xl">
              <p>1. 在 Supabase 左侧菜单点击 <b>SQL Editor</b>，然后点击 <b>New Query</b> (新建查询)。</p>
              <p>2. 复制下方所有的 SQL 代码，粘贴进去并点击右下角的绿色 <b>Run</b> 按钮。</p>
            </div>
            
            <div className="relative group">
              <div className="absolute right-4 top-4 flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 p-2 rounded-lg backdrop-blur shadow transition-all flex items-center"
                >
                  {copied ? <CheckCircle size={16} className="text-green-400 mr-2" /> : <Copy size={16} className="mr-2" />}
                  <span className="text-xs font-bold">{copied ? '已复制' : '复制 SQL'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto text-xs font-mono border border-slate-800 code-block">
                {sqlCode}
              </pre>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium max-w-sm">⚠️ 提示：配置完成后并保存代码，网页将会自动刷新并进入全新的系统。</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              配置好了，刷新页面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
