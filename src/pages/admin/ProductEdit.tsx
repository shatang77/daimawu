import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, Product, ProductType, getBaseInventory } from '../../store/useStore';
import { ChevronLeft, Save, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNew = !id;
  
  const products = useStore(state => state.products);
  const addProduct = useStore(state => state.addProduct);
  const updateProduct = useStore(state => state.updateProduct);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  const [formData, setFormData] = useState<Partial<Product>>({
    id: '',
    title: '',
    type: 'static',
    cover: '',
    images: [],
    pages: 1,
    theme: '',
    tech: [],
    description: '',
    status: 'selling',
    isHot: false,
    soldTo: []
  });

  const [techInput, setTechInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isInitialLoadRef = useRef(false);

  useEffect(() => {
    isInitialLoadRef.current = false;
  }, [id, isNew]);

  useEffect(() => {
    if (!isNew && id) {
      const p = products.find(x => x.id === id);
      if (p && !isInitialLoadRef.current) {
        setFormData(prev => ({
          ...p,
          images: p.images || [],
          tech: p.tech || [],
          soldTo: p.soldTo || []
        }));
        isInitialLoadRef.current = true;
      }
    } else if (isNew && !isInitialLoadRef.current) {
      const usedIds = products.map(p => parseInt(p.id, 10)).filter(n => !isNaN(n));
      const maxId = usedIds.length > 0 ? Math.max(...usedIds) : 9;
      setFormData(prev => ({ 
        ...prev, 
        id: prev.id || String(maxId + 1).padStart(4, '0'),
        images: prev.images || [],
        tech: prev.tech || [],
        soldTo: prev.soldTo || []
      }));
      if (products.length > 0) isInitialLoadRef.current = true;
    }
  }, [id, isNew, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    if (!formData.id || !formData.title || !formData.theme) {
      setErrorMsg('请填写必填项(编号、标题、分类)');
      return;
    }

    // --- 🚨 致命警告：Base64 存储机制 ---
    // 当前版本通过 Base64 存储图片，这是导致数据库超时的罪魁祸首！
    // 待网站稳定后，必须删除此逻辑，迁移至 Supabase Storage!
    
    setIsSaving(true);
    try {
      if (isNew) {
        await addProduct(formData as Omit<Product, 'createdAt' | 'updatedAt'>);
        setSuccessMsg('发布成功！');
      } else {
        await updateProduct(formData.id!, formData);
        setSuccessMsg('保存成功！');
      }
      setTimeout(() => navigate('/admin/products'), 1000);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg('保存数据库失败: ' + (err.message || '未知错误'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 严厉的性能警告标记
    if (file.size > 200 * 1024) { 
      alert('⚠️警告：图片体积过大 (' + (file.size/1024).toFixed(0) + 'KB)。存储 Base64 会导致网页崩溃，建议压缩后再上传！');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, cover: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  // ... [其他 handleMultiImageUpload 等逻辑保持不变] ...
  
  // (为了简化，这里省略掉了部分未动的辅助函数，你可以保留原样)
  // ... (建议直接把 handleMultiImageUpload 等辅助函数完整照抄过来)

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24">
      {/* 结构保持与你原代码一致 */}
      <h1 className="text-2xl font-black mb-6">{isNew ? '发布新作品' : '编辑作品'}</h1>
      {/* ... 你的表单 UI ... */}
      <div className="p-4 bg-amber-50 text-amber-800 text-xs rounded-lg mb-4">
        ⚠️ 当前使用 Base64 图片存储，每张图会显著增加数据库负载。如遇发布失败，请检查图片大小并尽可能压缩优化。
      </div>
      {/* 表单剩余部分 */}
    </div>
  );
}