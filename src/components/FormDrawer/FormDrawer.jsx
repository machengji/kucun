import React, { useState, useEffect, useRef } from 'react';

export function FormDrawer({
  isOpen,
  record,
  categories,
  onClose,
  onSave,
  onShowToast,
  onTriggerCamera,
  compressImage,
  tempCapturedImage,        // 从主 App 传过来的临时拍照数据
  clearTempCapturedImage,   // 拍照完成用于重置的方法
  onShowActionSheet         // 通知父组件展示 Action Sheet（在 DOM 最外层渲染，避免堆叠上下文遮挡）
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('未分类');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState(null);

  const fileInputRef = useRef(null);

  // 当 isOpen 或正在编辑的 record 改变时，重置/填充表单
  useEffect(() => {
    if (isOpen) {
      if (record) {
        setName(record.name);
        setCategory(record.category || '未分类');
        setStock(record.stock.toString());
        setImage(record.image);
      } else {
        setName('');
        setCategory(categories.length > 0 ? categories[0] : '未分类');
        setStock('');
        setImage(null);
      }
    }
  }, [isOpen, record, categories]);

  // 当收到主 App 拍照捕获到的临时图片时，将其同步填充到表单中
  useEffect(() => {
    if (tempCapturedImage) {
      setImage(tempCapturedImage);
      clearTempCapturedImage();
    }
  }, [tempCapturedImage, clearTempCapturedImage]);

  // 当 categories 改变时，确保选择的分类符合可用范围
  useEffect(() => {
    if (!record && isOpen) {
      setCategory(categories.length > 0 ? categories[0] : '未分类');
    }
  }, [categories, record, isOpen]);

  // 点击照片区域 → 通知父组件弹出 Action Sheet
  const handlePhotoClick = () => {
    onShowActionSheet();
  };

  // 当从 Action Sheet 选择"相册"后，父组件会调用此方法触发隐藏的 file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 传统文件选择器更改时的处理逻辑 (降级处理)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        // 调用我们自定义 Hook 的压缩方法进行前端压缩
        const compressed = await compressImage(ev.target.result, 800, 0.72);
        setImage(compressed);
      } catch (err) {
        onShowToast('图片处理失败');
      }
    };
    reader.readAsDataURL(file);
    
    // 清空 input 保证同名文件可重复触发 change 事件
    e.target.value = '';
  };

  // 保存表单
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedStock = parseInt(stock, 10);

    if (!trimmedName) {
      onShowToast('请输入商品名称');
      return;
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      onShowToast('请输入有效的库存数量');
      return;
    }

    onSave({
      id: record ? record.id : null,
      name: trimmedName,
      category,
      stock: parsedStock,
      image
    });
  };

  // 暴露 triggerFileInput 给父组件，通过 ref 或直接通过 prop 回调均可。
  // 此处使用 useEffect 在挂载时把方法注册到父级
  useEffect(() => {
    // 将 triggerFileInput 方法挂载到 window 上，供 App.jsx 调用
    // 使用更优雅的自定义事件来解耦
    const handleAlbumTrigger = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };
    window.addEventListener('trigger-album-select', handleAlbumTrigger);
    return () => {
      window.removeEventListener('trigger-album-select', handleAlbumTrigger);
    };
  }, []);

  return (
    <div
      className={`overlay ${isOpen ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer">
        <div className="drawer-grabber"></div>
        <div className="drawer-header">
          <span style={{ width: '28px' }}></span>
          <span className="drawer-title">
            {record ? '编辑库存' : '新增库存'}
          </span>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>商品名称</label>
            <input
              type="text"
              placeholder="请输入商品名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.length === 0 ? (
                <option value="未分类">未分类</option>
              ) : (
                categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label>库存数量</label>
            <input
              type="number"
              placeholder="请输入库存数量"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>商品照片（可选）</label>
            <div className="photo-preview" onClick={handlePhotoClick}>
              {image ? (
                <img src={image} alt="商品预览" />
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', color: 'var(--text-tertiary)' }}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="photo-hint">点击拍照或选择图片</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <button type="submit" className="btn-submit">
            保存
          </button>
        </form>
      </div>
    </div>
  );
}
