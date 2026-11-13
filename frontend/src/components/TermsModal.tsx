import React from 'react';
import { Icon } from './Icon';
import { Button } from './UI';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ maxWidth: '550px', padding: '24px' }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head" style={{ marginBottom: '16px' }}>
          <div>
            <span className="eyebrow">LEGAL</span>
            <h2>Terms of Service</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="close" />
          </button>
        </div>
        
        <div style={{ color: '#475467', fontSize: '0.9rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
          <p>„This application is provided for educational and portfolio purposes. The author does not assume any responsibility for errors in the automatic recognition of financial data by artificial intelligence.“</p>
          <p>By using FinanceFlow, you agree that the application is provided "as is", without any warranties of any kind, express or implied.</p>
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} type="button">Close</Button>
        </div>
      </div>
    </div>
  );
};