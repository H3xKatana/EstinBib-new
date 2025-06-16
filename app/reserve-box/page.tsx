export default function NotAvailablePage() {
    return (
      <div style={{
        height: '100vh',
    
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        color: '#b91c1c', // red-600
        fontFamily: 'sans-serif'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Not available yet</h1>
        <p style={{ fontSize: '1rem' }}>This page is currently under construction.</p>
      </div>
    );
  }
  