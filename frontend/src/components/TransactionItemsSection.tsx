import React from 'react';

export interface TransactionItem {
  name: string;
  price: string;
  quantity?: number;
}

interface TransactionItemsSectionProps {
  items: TransactionItem[];
  onAddItem: () => void;
  onItemChange: (index: number, field: keyof TransactionItem, value: string | number) => void;
  onRemoveItem: (index: number) => void;
}

const isDiscountItem = (item: TransactionItem): boolean => {
  const lowerName = item.name.toLowerCase();
  return (
    String(item.price).includes('-') ||
    lowerName.includes('отстъпка') ||
    lowerName.includes('discount') ||
    lowerName.includes('xtra')
  );
};

export const TransactionItemsSection: React.FC<TransactionItemsSectionProps> = ({
  items,
  onAddItem,
  onItemChange,
  onRemoveItem,
}) => {
  return (
    <div
      style={{
        marginBottom: '20px',
        background: '#F8F9FC',
        border: '1px solid #EAECF0',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#344054',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Transaction Items ({items.length})
        </span>
        <button
          type="button"
          onClick={onAddItem}
          style={{
            background: '#EEF2FF',
            color: '#4F46E5',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          + Add item manually
        </button>
      </div>

      {items.length > 0 ? (
        <div
          style={{
            maxHeight: '250px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '4px',
          }}
        >
          {items.map((item, idx) => {
            const isDiscount = isDiscountItem(item);

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  background: isDiscount ? '#F0FDF4' : '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${isDiscount ? '#BBF7D0' : '#E5E7EB'}`,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
              >
                <input
                  type="text"
                  placeholder="Item name (e.g. bananas, XTRA отстъпка)"
                  value={item.name}
                  onChange={(e) => onItemChange(idx, 'name', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    background: isDiscount ? '#F7FEE7' : '#FFFFFF',
                    color: isDiscount ? '#166534' : '#1F2937',
                    fontWeight: isDiscount ? 500 : 400,
                    outline: 'none',
                  }}
                  required
                />
                <input
                  type="text"
                  placeholder="0.00"
                  value={item.price}
                  onChange={(e) => onItemChange(idx, 'price', e.target.value)}
                  style={{
                    width: '110px',
                    padding: '8px 12px',
                    border: `1px solid ${isDiscount ? '#86EFAC' : '#D1D5DB'}`,
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: isDiscount ? '#15803D' : '#111827',
                    background: isDiscount ? '#F7FEE7' : '#FFFFFF',
                    outline: 'none',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => onRemoveItem(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9CA3AF';
                  }}
                  title="Delete item"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            color: '#6B7280',
            fontSize: '0.85rem',
            background: '#FFFFFF',
            borderRadius: '8px',
            border: '1px dashed #E5E7EB',
          }}
        >
          No items added yet. Upload a receipt or click „Add item manually“.
        </div>
      )}
    </div>
  );
};