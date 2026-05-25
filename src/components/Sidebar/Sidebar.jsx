import React from 'react';

export function Sidebar({ categories, currentCategory, onSelect }) {
  return (
    <div className="category-sidebar">
      <div
        className={`cat-item ${currentCategory === '全部' ? 'active' : ''}`}
        onClick={() => onSelect('全部')}
      >
        全部
      </div>
      {categories.map((cat) => (
        <div
          key={cat}
          className={`cat-item ${currentCategory === cat ? 'active' : ''}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </div>
      ))}
    </div>
  );
}
