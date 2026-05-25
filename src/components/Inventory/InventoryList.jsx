import React from 'react';
import { InventoryCard } from './InventoryCard';

export function InventoryList({ records, onEdit, onDelete }) {
  if (records.length === 0) {
    return (
      <div className="empty-state">
        <svg
          className="empty-icon"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="10" y="20" width="60" height="50" rx="6" fill="var(--text-light)" />
          <rect x="22" y="32" width="36" height="5" rx="2.5" fill="var(--bg-card)" />
          <rect x="22" y="44" width="28" height="5" rx="2.5" fill="var(--bg-card)" />
          <rect x="22" y="56" width="18" height="5" rx="2.5" fill="var(--bg-card)" />
          <polygon points="40,4 49,20 31,20" fill="var(--text-light)" />
          <polygon points="40,7 47,19 33,19" fill="var(--bg-card)" />
        </svg>
        <p>暂无库存信息</p>
      </div>
    );
  }

  return (
    <div id="inventoryList">
      {records.map((r) => (
        <InventoryCard
          key={r.id}
          record={r}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
