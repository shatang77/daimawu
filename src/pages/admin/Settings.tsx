import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ShieldAlert, Users, Trash2, Plus, Download, Database } from 'lucide-react';

export default function Settings() {
  const logout = useStore(state => state.logoutAdmin);
  const isSuperAdmin = useStore(state => state.isSuperAdmin);
  const adminEmails = useStore(state => state.adminEmails);
  const updateAdminEmails = useStore(state => state.updateAdminEmails);
  const [newEmail, setNewEmail] = useState('');

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) return alert("请输入有效邮箱");
    if (adminEmails.includes(newEmail)) return alert("该邮箱已在白名单中");
    if (newEmail === 'lanu2617@gmail.com') return alert("不能添加超级管理员");
    
    updateAdminEmails([...adminEmails, newEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    if (confirm(`确定要移除 ${email} 的管理员权限吗？`)) {
      updateAdminEmails(adminEmails.filter(e => e !== email));
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-300 max-w-2xl mx-auto space-y-6">
      <div className="mb-4">
         <h1 className="text-2xl font-black text-slate-900">安全设置</h1>
         <p className="text-slate-500 mt-2">身份授权信息</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
             <Database size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">本地稳定存储模式已开启</h2>
            <p className="text-slate-500 text-xs mt-1">数据直接存储在当前服务器，不受外部服务商配额影响</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <a 
            href="/api/settings/backup" 
            download="db_backup.json"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-all hover:bg-blue-700"
          >
            <Download size={18} /> 下载数据库全量备份
          </a>
          <button 
            onClick={() => logout()}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-md active:scale-[0.98] transition-transform"
          >
            退出管理系统
          </button>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
           <div className="flex items-center gap-2 mb-6 text-slate-800">
             <Users size={20} className="text-blue-500" />
             <h2 className="text-lg font-bold">后台授权人员管理</h2>
           </div>
           
           <p className="text-xs text-slate-500 mb-6 bg-slate-50 p-4 rounded-xl">
             在此添加的邮箱，可以使用 Google 一键登录，或在登录页输入邮箱密码进入系统 (使用邮箱密码功能需要您在 Firebase 开启 Email/Password 提供商并创建对应账号)。
           </p>

           <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-sm text-slate-700">lanu2617@gmail.com</span>
                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-md">超级管理员</span>
              </div>
              
              {adminEmails.map((email) => (
                <div key={email} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                  <span className="font-medium text-sm text-slate-700">{email}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">普通管理员</span>
                    <button 
                       onClick={() => handleRemoveEmail(email)}
                       className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                       title="移除该账号"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
           </div>

           <div className="flex items-center gap-2">
             <input 
               type="email" 
               value={newEmail}
               onChange={(e) => setNewEmail(e.target.value)}
               placeholder="输入授权新邮箱，如：staff@example.com" 
               className="flex-1 bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-blue-200 outline-none placeholder:text-slate-400"
             />
             <button 
               onClick={handleAddEmail}
               className="bg-blue-600 text-white p-3 rounded-xl active:scale-[0.98] transition-transform shadow-md shadow-blue-600/20"
             >
               <Plus size={20} />
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
