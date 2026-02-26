const Index = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'white',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: 'black'
        }}>
          Welcome to Your Blank App
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666'
        }}>
          Start building your amazing project here!
        </p>
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'red',
          marginTop: '1rem'
        }}>
          DEBUG: If you can see this, the React app is working!
        </p>
      </div>
    </div>
  );
};

export default Index;
