import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Button } from './UI';
import type { Transaction, TransactionType } from '../types/transaction';
import { useAddTransactionMutation, useUpdateTransactionMutation, useParseReceiptMutation } from '../services/transactionsApi';
import { useGetCategoriesQuery } from '../services/categoriesApi';

interface TransactionModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose, onSave }) => {
  const [type, setType] = useState<TransactionType>(transaction?.type || "EXPENSE");
  const [amountVal, setAmountVal] = useState<string>(transaction ? String(Math.abs(transaction.amount)) : "");
  const [dateVal, setDateVal] = useState<string>(transaction?.date || new Date().toISOString().split('T')[0]);
  const [descVal, setDescVal] = useState<string>(transaction?.description || "");
  const [categoryVal, setCategoryVal] = useState<string>(transaction?.category ? String(transaction.category) : "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Списък с артикули (поддържа име, цена и количество)
  const [scannedItems, setScannedItems] = useState<Array<{ name: string; price: string; quantity?: number }>>([]);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (transaction?.items && Array.isArray(transaction.items)) {
      setScannedItems(transaction.items);
    }
  }, [transaction]);

  const { data: categories = [] } = useGetCategoriesQuery();

  const filteredCategories = categories.filter((c: any) => 
    !c.type || c.type.toUpperCase() === type.toUpperCase()
  );

  const [addTransaction, { isLoading: isAdding }] = useAddTransactionMutation();
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();
  const [parseReceipt, { isLoading: isParsing }] = useParseReceiptMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);

    try {
      const result = await parseReceipt(file).unwrap();
      
      if (result.amount) setAmountVal(result.amount);
      if (result.type) setType(result.type as TransactionType);
      if (result.date) setDateVal(result.date);
      if (result.description) setDescVal(result.description);
      
      if (result.items && Array.isArray(result.items)) {
        setScannedItems(result.items);
      }

    } catch (err) {
      console.error("Failed to parse receipt with AI:", err);
      setErrorMessage("Неуспешно разпознаване на бележката. Можете да добавите артикулите и сумата ръчно по-долу.");
    }
  };

  const handleAddItem = () => {
    setScannedItems(prev => [...prev, { name: "", price: "", quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setScannedItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleRemoveItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const dataToSend = new FormData();
    dataToSend.append("amount", amountVal);
    dataToSend.append("type", type);
    dataToSend.append("date", dateVal);
    dataToSend.append("description", descVal);
    
    if (categoryVal) {
      dataToSend.append("category", categoryVal);
    }

    if (selectedFile) {
      dataToSend.append("receipt_file", selectedFile);
    }

    if (scannedItems.length > 0) {
      dataToSend.append("items", JSON.stringify(scannedItems));
    }

    try {
      if (transaction?.id) {
        await updateTransaction({ id: transaction.id, data: dataToSend }).unwrap();
      } else {
        await addTransaction(dataToSend).unwrap();
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={handleSubmit} onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">{transaction ? "UPDATE RECORD" : "NEW RECORD"}</span>
            <h2>{transaction ? "Edit transaction" : "Add transaction"}</h2>
            <p>Keep your finances accurate and up to date.</p>
          </div>
          <button type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        {errorMessage && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: '8px', color: '#B42318', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', color: '#B42318', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {!transaction && (
          <div style={{ marginBottom: '16px', padding: '14px', background: '#F8F9FC', borderRadius: '10px', border: '1px dashed #D0D5DD', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#344054', display: 'block' }}>Scan Receipt / Invoice</strong>
              <span style={{ fontSize: '0.8rem', color: '#667085' }}>
                {isParsing ? "🤖 AI is reading your document..." : "Upload image/PDF or fill manually below"}
              </span>
            </div>
            <label style={{ cursor: isParsing ? 'not-allowed' : 'pointer', background: '#526DE2', color: '#fff', padding: '8px 14px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500 }}>
              {isParsing ? "Scanning..." : "Upload file"}
              <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} disabled={isParsing} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* 📝 Секция за артикули с просторен дизайн и зелени отстъпки */}
        <div style={{ marginBottom: '20px', background: '#F8F9FC', border: '1px solid #EAECF0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#344054', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Transaction Items ({scannedItems.length})
            </span>
            <button 
              type="button" 
              onClick={handleAddItem}
              style={{ background: '#EEF2FF', color: '#4F46E5', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              + Add item manually
            </button>
          </div>
          
          {scannedItems.length > 0 ? (
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {scannedItems.map((item, idx) => {
                // Проверяваме дали редът е отстъпка
                const isDiscount = String(item.price).includes('-') || 
                                   item.name.toLowerCase().includes('отстъпка') || 
                                   item.name.toLowerCase().includes('discount') || 
                                   item.name.toLowerCase().includes('xtra');

                return (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center', 
                      background: isDiscount ? '#F0FDF4' : '#FFFFFF', // 🟢 Зелен фон за отстъпка
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      border: `1px solid ${isDiscount ? '#BBF7D0' : '#E5E7EB'}`,
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Item name (e.g. bananas, XTRA отстъпка)"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: '8px 12px', 
                        border: '1px solid #D1D5DB', 
                        borderRadius: '6px', 
                        fontSize: '0.9rem',
                        background: isDiscount ? '#F7FEE7' : '#FFFFFF',
                        color: isDiscount ? '#166534' : '#1F2937',
                        fontWeight: isDiscount ? 500 : 400,
                        outline: 'none'
                      }}
                      required
                    />
                    <input
                      type="text"
                      placeholder="0.00"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      style={{ 
                        width: '110px', 
                        padding: '8px 12px', 
                        border: `1px solid ${isDiscount ? '#86EFAC' : '#D1D5DB'}`, 
                        borderRadius: '6px', 
                        fontSize: '0.9rem', 
                        textAlign: 'right',
                        fontWeight: 600,
                        color: isDiscount ? '#15803D' : '#111827', // 🟢 Зелен цвят за сумата при отстъпка
                        background: isDiscount ? '#F7FEE7' : '#FFFFFF',
                        outline: 'none'
                      }}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                      title="Delete item"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px', color: '#6B7280', fontSize: '0.85rem', background: '#FFFFFF', borderRadius: '8px', border: '1px dashed #E5E7EB' }}>
              No items added yet. Upload a receipt or click „Add item manually“.
            </div>
          )}
        </div>
        
        <div className="type-toggle">
          <button
            type="button"
            className={type === "EXPENSE" ? "active expense-toggle" : ""}
            onClick={() => setType("EXPENSE")}
          >
            <Icon name="arrowUp" size={17} />
            Expense
          </button>
          <button
            type="button"
            className={type === "INCOME" ? "active income-toggle" : ""}
            onClick={() => setType("INCOME")}
          >
            <Icon name="arrowDown" size={17} />
            Income
          </button>
        </div>

        <div className="field amount-field">
          <label>Total Amount</label>
          <div>
            <span>$</span>
            <input
              name="amount"
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amountVal}
              onChange={(e) => setAmountVal(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Category</label>
            <select 
              name="category" 
              value={categoryVal} 
              onChange={(e) => setCategoryVal(e.target.value)} 
              required
            >
              <option value="" disabled>Select category...</option>
              {filteredCategories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input 
              name="date" 
              required 
              type="date" 
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <input
            name="description"
            required
            value={descVal}
            onChange={(e) => setDescVal(e.target.value)}
            placeholder="What was this transaction for?"
          />
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isAdding || isUpdating || isParsing}>
            {transaction ? "Save changes" : "Add transaction"}
          </Button>
        </div>
      </form>
    </div>
  );
};