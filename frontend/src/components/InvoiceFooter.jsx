import React from 'react';

/**
 * Matches the reference exactly:
 *  ─────────────────────────────────────────────────────── (3px line)
 *  Regd office : [address]  (centered, bold)
 *  PAN: [val]    IE Code : [val]    CIN: [val]
 *  Email :[val]  [website]          Tel : [val]
 */
const InvoiceFooter = ({ settings }) => {
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
        Regd office : {settings.registeredOffice || settings.address}
      </div>

      {/* Row 2 – PAN | IE Code | CIN */}
      <div style={st.grid}>
        <div style={st.cell}>
          <span style={st.label}>PAN: </span>
          <span style={st.value}>{settings.pan}</span>
        </div>
        <div style={st.cell}>
          <span style={st.label}>IE Code : </span>
          <span style={st.value}>{settings.ieCode}</span>
        </div>
        <div style={st.cell}>
          <span style={st.label}>CIN: </span>
          <span style={st.value}>{settings.cin}</span>
        </div>
      </div>

      {/* Row 3 – Email | Website | Tel */}
      <div style={st.grid}>
        <div style={st.cell}>
          <span style={st.label}>Email :</span>
          <span style={st.value}>{settings.email}</span>
        </div>
        <div style={{ ...st.cell, fontWeight: 400, color: '#000' }}>
          {settings.website}
        </div>
        <div style={st.cell}>
          <span style={st.label}>Tel : </span>
          <span style={st.value}>{settings.telephone || settings.phone}</span>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFooter;
