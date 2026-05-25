import React, { useState } from 'react';

export function CatManageModal({ isOpen, categories, onClose, onAddCategory, onDeleteCategory }) {
  const [newCatName, setNewCatName] = useState('');

  const handleAdd = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setNewCatName('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div
      className={`cat-overlay ${isOpen ? 'active' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cat-drawer">
        <div className="drawer-grabber"></div>
        <div className="cat-drawer-header">
          <span className="cat-drawer-title">分类管理</span>
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
        
        <div className="cat-list-manage">
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', padding: '16px 0', textAlign: 'center' }}>
              暂无分类，请添加
            </p>
          ) : (
            categories.map((cat) => (
              <div key={cat} className="cat-manage-item">
                <span>{cat}</span>
                <button
                  type="button"
                  className="btn-cat-del"
                  onClick={() => onDeleteCategory(cat)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cat-add-row">
          <input
            type="text"
            placeholder="输入新分类名称"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="btn-cat-add"
            onClick={handleAdd}
          >
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
