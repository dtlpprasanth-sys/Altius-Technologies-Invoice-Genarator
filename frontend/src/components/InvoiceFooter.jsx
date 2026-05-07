import React from 'react';

/**
 * Matches the reference exactly:
 *  ─────────────────────────────────────────────────────── (3px line)
 *  Regd office : [address]  (centered, bold)
 *  PAN: [val]    IE Code : [val]    CIN: [val]
 *  Email :[val]  [website]          Tel : [val]
 */
const InvoiceFooter = ({ settings = {}, data = {} }) => {
  const isDraft = data.status === 'draft';
  const biz = isDraft ? settings : (data.businessDetails || {});
  
  const st = {
    wrap: {
      width: '100%',
      paddingTop: 12,
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    },
    divider: {
      borderTop: '3px solid #000',
      marginBottom: 8,
    },
    address: {
      textAlign: 'center',
      fontSize: '9.5pt',
      fontWeight: 700,
      marginBottom: 5,
      lineHeight: 1.4,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      fontSize: '9pt',
      marginBottom: 2,
    },
    cell: {
      textAlign: 'center',
      whiteSpace: 'nowrap',
    },
    label: { color: '#000', fontWeight: 700 },
    value: { fontWeight: 400, color: '#000' },
  };

  return (
    <div style={st.wrap}>
      <div style={st.divider} />

      {/* Row 1 – Regd Office */}
      <div style={st.address}>
        Regd office : {isDraft 
          ? (settings.registeredOffice || settings.address || data.businessAddress || '') 
          : (data.businessDetails?.registeredOffice || settings.registeredOffice || data.businessAddress || settings.address)}
      </div>

      {/* Row 2 – PAN | IE Code | CIN */}
      <div style={st.grid}>
        <div style={st.cell}>
          <span style={st.label}>PAN: </span>
          <span style={st.value}>{isDraft ? (settings.pan || data.businessPan) : (data.businessPan || settings.pan)}</span>
        </div>
        <div style={st.cell}>
          <span style={st.label}>IE Code : </span>
          <span style={st.value}>{isDraft ? (settings.ieCode || data.ieCode) : (data.ieCode || settings.ieCode)}</span>
        </div>
        <div style={st.cell}>
          <span style={st.label}>CIN: </span>
          <span style={st.value}>{isDraft ? (settings.cin || data.cin) : (data.cin || settings.cin)}</span>
        </div>
      </div>

      {/* Row 3 – Email | Website | Tel */}
      <div style={st.grid}>
        <div style={st.cell}>
          <span style={st.label}>Email :</span>
          <span style={st.value}>{isDraft ? (settings.email || data.businessDetails?.email) : (data.businessDetails?.email || settings.email)}</span>
        </div>
        <div style={{ ...st.cell, fontWeight: 400, color: '#000' }}>
          {isDraft ? (settings.website || data.website) : (data.website || settings.website)}
        </div>
        <div style={st.cell}>
          <span style={st.label}>Tel : </span>
          <span style={st.value}>{isDraft 
            ? (settings.telephone || settings.phone || data.businessDetails?.telephone || '') 
            : (data.businessDetails?.telephone || settings.telephone || data.businessDetails?.phone || settings.phone)}</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFooter;
