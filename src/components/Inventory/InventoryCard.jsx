import React from 'react';

export function InventoryCard({ record, onEdit, onDelete }) {
  return (
    <div className="record-card">
      <img
        src={record.image}
        alt={record.name}
        loading="lazy"
      />
      <div className="record-info">
        <div className="name">{record.name}</div>
        <span className="cat-tag">{record.category || '未分类'}</span>
        <div className="stock">库存: {record.stock} 件</div>
        <div className="time">{record.timestamp}</div>
      </div>
      <div className="record-actions">
        <button
          className="action-btn-icon btn-icon-edit"
          onClick={() => onEdit(record)}
          title="编辑商品"
        >
          {/* 高阶极简 Pencil 线条 SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          className="action-btn-icon btn-icon-del"
          onClick={() => onDelete(record.id)}
          title="删除商品"
        >
          {/* 高阶极简 Trash 线条 SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
