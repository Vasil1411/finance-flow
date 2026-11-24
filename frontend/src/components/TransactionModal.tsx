import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Button } from './UI';
import { TransactionItemsSection, type TransactionItem } from './TransactionItemsSection';
import type { Transaction, TransactionType } from '../types/transaction';
import { useAddTransactionMutation, useUpdateTransactionMutation, useParseReceiptMutation } from '../services/transactionsApi';
import { useGetCategoriesQuery } from '../services/categoriesApi';

interface TransactionModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: () => void;
}

function formatScalarOrList(val: any): string {
  if (Array.isArray(val)) {
    return val.map((item) => formatScalarOrList(item)).filter(Boolean).join(", ");
  }
  if (val && typeof val === "object") {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${formatScalarOrList(v)}`)
      .filter(Boolean)
      .join(" | ");
  }
  if (val === undefined || val === null || val === "") {
    return "";
  }
  return String(val);
}

function extractApiErrorMessage(err: any): string {
  const data = err?.data;

  if (!data) {
    const fallback = err?.error || err?.message;
    return fallback ? String(fallback) : "Failed to save transaction. Please try again.";
  }

  if (typeof data === 'string') {
    if (data.trim().startsWith("<")) {
      return `Server error (${err?.status || "unknown"}). Check backend logs.`;
    }
    return data;
  }

  if (typeof data === 'object') {
    const parts: string[] = [];

    if (data.error !== undefined && data.error !== null) {
      const errText = formatScalarOrList(data.error);
      if (errText) parts.push(errText);
    }

    if (data.available_amount !== undefined) {
      parts.push(`Available in fund: €${data.available_amount}`);
    }

    if (data.requested_amount !== undefined) {
      parts.push(`Requested additional: €${data.requested_amount}`);
    }

    if (parts.length > 0) {
      return parts.join(" • ");
    }

    if (data.detail !== undefined && data.detail !== null) {
      const detailText = formatScalarOrList(data.detail);
      if (detailText) return detailText;
    }

    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return formatScalarOrList(data.non_field_errors);
    }

    const fieldMessages: string[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (key === "fund_source") continue;
      const formatted = formatScalarOrList(val);
      if (formatted) {
        fieldMessages.push(`${key}: ${formatted}`);
      }
    }

    if (fieldMessages.length > 0) {
      return fieldMessages.join(" | ");
    }
  }

  return `Failed to save transaction (${err?.status || "error"}). Please try again.`;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose, onSave }) => {
  const [type, setType] = useState<TransactionType>(transaction?.type || "EXPENSE");
  const [amountVal, setAmountVal] = useState<string>(transaction ? String(Math.abs(transaction.amount)) : "");
  const [dateVal, setDateVal] = useState<string>(transaction?.date || new Date().toISOString().split('T')[0]);
  const [descVal, setDescVal] = useState<string>(transaction?.description || "");
  const [categoryVal, setCategoryVal] = useState<string>(transaction?.category ? String(transaction.category) : "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scannedItems, setScannedItems] = useState<TransactionItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (transaction?.items && Array.isArray(transaction.items)) {
      setScannedItems(transaction.items);
    } else {
      setScannedItems([]);
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
      setErrorMessage("Failed to parse receipt. Please check the file and try again.");
    }
  };

  const handleAddItem = () => {
    setScannedItems((prev) => [...prev, { name: "", price: "", quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    setScannedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setScannedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const dataToSend = new FormData();
    dataToSend.append("amount", amountVal);
    dataToSend.append("type", type);
    dataToSend.append("date", dateVal);
    dataToSend.append("description", descVal);

    if (categoryVal) {
      dataToSend.append("category", categoryVal);
    }

    const existingGoalId = (transaction as any)?.saving_goal;
    if (existingGoalId !== undefined && existingGoalId !== null) {
      dataToSend.append("saving_goal", String(existingGoalId));
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
    } catch (err: any) {
      console.error("Failed to save transaction:", err);
      setErrorMessage(extractApiErrorMessage(err));
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

        <TransactionItemsSection
          items={scannedItems}
          onAddItem={handleAddItem}
          onItemChange={handleItemChange}
          onRemoveItem={handleRemoveItem}
        />

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
            <span>€</span>
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