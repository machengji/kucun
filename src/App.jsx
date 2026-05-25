import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { InventoryList } from './components/Inventory/InventoryList';
import { FormDrawer } from './components/FormDrawer/FormDrawer';
import { CameraModal } from './components/CameraModal/CameraModal';
import { CatManageModal } from './components/CatManage/CatManageModal';
import { Toast } from './components/Toast/Toast';
import { useCamera } from './hooks/useCamera';
import { useCompress } from './hooks/useCompress';

const STORAGE_KEY = 'inventory_records';
const CAT_KEY = 'inventory_categories';

function App() {
  // ===== 核心状态定义 =====
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [currentCategory, setCurrentCategory] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 各种半屏抽屉/弹窗的显隐状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  
  // 当前正在编辑的商品对象 (null 代表新增)
  const [editingRecord, setEditingRecord] = useState(null);
  
  // 拍照完成后，临时传递给表单预览的 base64 状态
  const [tempImage, setTempImage] = useState(null);
  
  // 简易 Toast 提示框状态
  const [toastMsg, setToastMsg] = useState('');

  // ===== 核心 Hook 实例 =====
  const { stream, isActive, startCamera, stopCamera, capture } = useCamera();
  const { compressImage } = useCompress();

  // ===== 数据生命周期：加载本地 LocalStorage 数据 =====
  useEffect(() => {
    const localRecords = localStorage.getItem(STORAGE_KEY);
    const localCats = localStorage.getItem(CAT_KEY);

    if (localRecords) {
      setRecords(JSON.parse(localRecords));
    }
    if (localCats) {
      setCategories(JSON.parse(localCats));
    }
  }, []);

  // ===== 吐司提示触发器 =====
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
  }, []);

  const handleCloseToast = useCallback(() => {
    setToastMsg('');
  }, []);

  // ===== 核心操作：保存记录 (新增或修改) =====
  const handleSaveRecord = useCallback((formData) => {
    let updatedRecords = [...records];
    const timestamp = new Date().toLocaleString('zh-CN');
    const DEFAULT_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="background:%23f1f5f9"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

    if (formData.id) {
      // 编辑更新模式
      updatedRecords = updatedRecords.map((r) =>
        r.id === formData.id
          ? {
              ...r,
              name: formData.name,
              category: formData.category,
              stock: formData.stock,
              image: formData.image || DEFAULT_IMAGE,
              timestamp
            }
          : r
      );
      showToast('修改成功！');
    } else {
      // 新增保存模式
      updatedRecords.unshift({
        id: Date.now(),
        name: formData.name,
        category: formData.category,
        stock: formData.stock,
        image: formData.image || DEFAULT_IMAGE,
        timestamp
      });
      showToast('保存成功！');
    }

    setRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
    setIsFormOpen(false);
    setEditingRecord(null);
  }, [records, showToast]);

  // ===== 核心操作：删除记录 =====
  const handleDeleteRecord = useCallback((id) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showToast('已删除');
  }, [records, showToast]);

  // ===== 核心操作：新增分类 =====
  const handleAddCategory = useCallback((name) => {
    if (categories.includes(name)) {
      showToast('分类已存在');
      return;
    }
    const updated = [...categories, name];
    setCategories(updated);
    localStorage.setItem(CAT_KEY, JSON.stringify(updated));
    showToast('分类已添加');
  }, [categories, showToast]);

  // ===== 核心操作：删除分类 =====
  const handleDeleteCategory = useCallback((name) => {
    if (!window.confirm(`删除分类「${name}」？该分类下的商品将自动变为“未分类”`)) return;
    
    // 过滤掉当前分类
    const updatedCats = categories.filter((c) => c !== name);
    setCategories(updatedCats);
    localStorage.setItem(CAT_KEY, JSON.stringify(updatedCats));

    // 该分类下所有的商品自动变更为“未分类”
    const updatedRecords = records.map((r) =>
      r.category === name ? { ...r, category: '未分类' } : r
    );
    setRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));

    // 如果当前选中的是刚删掉的分类，返回“全部”页面
    if (currentCategory === name) {
      setCurrentCategory('全部');
    }
    showToast('分类已删除');
  }, [categories, records, currentCategory, showToast]);

  // ===== 打开编辑记录的抽屉 =====
  const handleOpenEdit = useCallback((record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  }, []);

  // ===== 打开新增记录的抽屉 =====
  const handleOpenAdd = useCallback(() => {
    setEditingRecord(null);
    setIsFormOpen(true);
  }, []);

  // ===== Action Sheet 回调 =====
  const handleShowActionSheet = useCallback(() => {
    setShowActionSheet(true);
  }, []);

  // 选择摄像头拍照
  const handleCameraSelect = useCallback(async () => {
    setShowActionSheet(false);
    try {
      setIsCameraOpen(true);
    } catch (err) {
      setIsCameraOpen(false);
      showToast('摄像头调取失败，已切换至相册选择');
      window.dispatchEvent(new Event('trigger-album-select'));
    }
  }, [showToast]);

  // 选择从手机相册上传
  const handleAlbumSelect = useCallback(() => {
    setShowActionSheet(false);
    // 通过自定义事件通知 FormDrawer 触发其内部的 file input
    window.dispatchEvent(new Event('trigger-album-select'));
  }, []);

  // 拍照捕获完毕的回调
  const handleCameraCapture = useCallback((dataUrl) => {
    setTempImage(dataUrl);
    setIsCameraOpen(false);
  }, []);

  // ===== 过滤后的商品数据运算 =====
  const filteredRecords = records.filter((r) => {
    // 1. 分类筛选
    const matchCat = currentCategory === '全部' || r.category === currentCategory;
    // 2. 搜索关键字筛选
    const matchKeyword =
      !searchKeyword ||
      r.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(searchKeyword.toLowerCase()));

    return matchCat && matchKeyword;
  });

  return (
    <>
      {/* 顶部搜索栏 */}
      <div className="topbar">
        <div className="search-bar">
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="请输入产品名称、分类进行搜索"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        <div className="topbar-actions">
          <button
            className="icon-btn"
            onClick={() => setIsCatOpen(true)}
            title="分类管理"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 主体布局 */}
      <div className="main-layout">
        {/* 左侧分类侧边栏 */}
        <Sidebar
          categories={categories}
          currentCategory={currentCategory}
          onSelect={setCurrentCategory}
        />

        {/* 右侧商品内容区 */}
        <div className="content-area">
          <InventoryList
            records={filteredRecords}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteRecord}
          />
        </div>
      </div>

      {/* 右下角 FAB 悬浮新增按钮 */}
      <button
        className="fab"
        onClick={handleOpenAdd}
        title="新增商品"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* 新增/编辑库存表单抽屉 */}
      <FormDrawer
        isOpen={isFormOpen}
        record={editingRecord}
        categories={categories}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
          setShowActionSheet(false);
        }}
        onSave={handleSaveRecord}
        onShowToast={showToast}
        onTriggerCamera={handleCameraSelect}
        compressImage={compressImage}
        tempCapturedImage={tempImage}
        clearTempCapturedImage={() => setTempImage(null)}
        onShowActionSheet={handleShowActionSheet}
      />

      {/* 摄像头拍照弹层 */}
      <CameraModal
        isOpen={isCameraOpen}
        startCamera={startCamera}
        stopCamera={stopCamera}
        capture={capture}
        onCapture={handleCameraCapture}
        onClose={() => setIsCameraOpen(false)}
      />

      {/* 分类管理弹层 */}
      <CatManageModal
        isOpen={isCatOpen}
        categories={categories}
        onClose={() => setIsCatOpen(false)}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* iOS 风格 Action Sheet — 在 DOM 最外层渲染，避免被 FormDrawer 的 backdrop-filter 堆叠上下文遮挡 */}
      {showActionSheet && (
        <div className="action-sheet-overlay" onClick={() => setShowActionSheet(false)}>
          <div className="action-sheet-container" onClick={(e) => e.stopPropagation()}>
            <div className="action-sheet-title">选择图片来源</div>
            <button type="button" className="action-sheet-btn" onClick={handleCameraSelect}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              使用摄像头拍照
            </button>
            <button type="button" className="action-sheet-btn" onClick={handleAlbumSelect}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              从手机相册选择
            </button>
            <button type="button" className="action-sheet-btn btn-cancel" onClick={() => setShowActionSheet(false)}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* 简易吐司弹窗 */}
      <Toast message={toastMsg} onClose={handleCloseToast} />
    </>
  );
}

export default App;
