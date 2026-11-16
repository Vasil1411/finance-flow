import React from 'react';
import { Button } from './UI';
import { Icon } from './Icon';

interface TermsModalProps {
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="modal-card" style={{ background: '#fff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '30px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <button 
          onClick={onClose} 
          type="button" 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}
        >
          <Icon name="close" size={20} />
        </button>

        <span style={{ color: '#4F46E5', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em' }}>LEGAL</span>
        <h2 style={{ margin: '8px 0 16px 0', fontSize: '1.5rem', color: '#1D2939' }}>Terms of Service</h2>

        <div style={{ color: '#475467', fontSize: '0.925rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p>
            „This application is provided for educational and portfolio purposes. The author does not assume any responsibility for financial decisions or data accuracy.“
          </p>
          <p>
            By using FinanceFlow, you agree that the application is provided "as is", without any warranties of any kind, express or implied.
          </p>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #EAECF0', paddingTop: '20px' }}>
          <Button type="button" onClick={onClose} style={{ width: 'auto', padding: '10px 24px' }}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};