import React, { useState } from 'react';
import { TermsModal } from './TermsModal';
import { PrivacyModal } from './PrivacyModal';

export const Footer: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  return (
    <>
      <footer style={{
        marginTop: '40px', // Даваме му въздух от съдържанието отгоре
        padding: '20px 32px',
        borderTop: '1px solid #EAECF0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        fontSize: '0.85rem',
        color: '#667085',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div>
          <span>© {new Date().getFullYear()} FinanceFlow. Portfolio Project.</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button 
            type="button" 
            onClick={() => setActiveModal('terms')} 
            style={{ background: 'none', border: 'none', color: '#667085', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
          >
            Terms of Service
          </button>
          <button 
            type="button" 
            onClick={() => setActiveModal('privacy')} 
            style={{ background: 'none', border: 'none', color: '#667085', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
          >
            Privacy Policy
          </button>
        </div>
      </footer>

      {activeModal === 'terms' && <TermsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'privacy' && <PrivacyModal onClose={() => setActiveModal(null)} />}
    </>
  );
};