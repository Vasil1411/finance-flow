import React from 'react';
import { Icon } from './Icon';
import { Button } from './UI';

interface PrivacyModalProps {
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ maxWidth: '550px', padding: '24px' }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head" style={{ marginBottom: '16px' }}>
          <div>
            <span className="eyebrow">SECURITY & DATA</span>
            <h2>Privacy Policy</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="close" />
          </button>
        </div>
        
        <div style={{ color: '#475467', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
          <p>„FinanceFlow uses Google Gemini API to process images of receipts. The files you upload are processed only to extract amounts and items and are not stored or shared with third parties for commercial purposes.“</p>
          <p> Your personal data and financial records are protected and accessible only through your authenticated profile.</p>
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} type="button">Close</Button>
        </div>
      </div>
    </div>
  );
};