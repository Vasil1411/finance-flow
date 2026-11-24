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

function formatEuro(val: any): string {
  const num = Number(val);
  if (Number.isFinite(num)) {
    return `€${num.toFixed(2)}`;
  }
  return String(val);
}

function formatPeriodLabel(fundSource?: string): string {
  if (!fundSource) return "";
  const match = fundSource.match(/\((\d{4})-(\d{2})\)/);
  if (!match) return "";
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIdx, 1));
  if (Number.isNaN(date.getTime())) return ` for ${match[1]}-${match[2]}`;
  const monthName = date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return ` for ${monthName} ${year}`;
}

function extractFriendlyText(val: any): string {
  if (val === undefined || val === null || val === "") return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    return val.map(extractFriendlyText).filter(Boolean).join(", ");
  }
  if (typeof val === "object") {
    if (typeof val.error === "string") return val.error.trim();
    if (typeof val.message === "string") return val.message.trim();
    return Object.entries(val)
      .filter(([k]) => k !== "fund_source" && k !== "status")
      .map(([, v]) => extractFriendlyText(v))
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

function extractApiErrorMessage(err: any): string {
  const data = err?.data;

  if (!data) {
    return "Couldn't save your transaction. Please check your connection and try again.";
  }

  if (typeof data === "string") {
    if (data.trim().startsWith("<")) {
      return "We hit a temporary server issue while saving your transaction. Please try again.";
    }
    return data.trim();
  }

  if (typeof data === "object") {
    const errObj =
      data.errors && typeof data.errors === "object"
        ? data.errors
        : data;

    const rawError = typeof errObj.error === "string" ? errObj.error : "";
    const available = errObj.available_amount;
    const requested = errObj.requested_amount;
    const period = formatPeriodLabel(typeof errObj.fund_source === "string" ? errObj.fund_source : "");

    if (rawError.toLowerCase().includes("insufficient funds")) {
      const sentence = `Not enough money left in your savings budget${period}.`;
      const details: string[] = [];
      if (requested !== undefined) {
        details.push(`you tried to add ${formatEuro(requested)} extra`);
      }
      if (available !== undefined) {
        details.push(`${formatEuro(available)} available`);
      }
      return details.length > 0 ? `${sentence} (${details.join(", ")})` : sentence;
    }

    const specificError = extractFriendlyText(errObj.error);
    if (specificError) {
      return specificError;
    }

    if (data.errors && typeof data.errors === "object") {
      const nestedMsg = extractFriendlyText(data.errors);
      if (nestedMsg) return nestedMsg;
    }

    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail.trim();
    }

    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return extractFriendlyText(data.non_field_errors);
    }

    for (const [key, val] of Object.entries(errObj)) {
      if (["status", "message", "errors", "fund_source", "available_amount", "requested_amount"].includes(key)) {
        continue;
      }
      const fieldMsg = extractFriendlyText(val);
      if (fieldMsg) {
        return fieldMsg;
      }
    }

    if (typeof data.message === "string" && data.message.trim() && data.message !== "Request processing failed.") {
      return data.message.trim();
    }
  }

  return "Couldn't save your transaction. Please review your details and try again.";
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
      setErrorMessage("Couldn't read that receipt. Please try another image or PDF, or enter the details manually.");
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