import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(process.env.REACT_APP_BACKEND_URL)
      .then(response => {
        console.log('Great!', response);
        if (!response.ok) {
          throw new Error('Bad response');
        }
        return response.text();
      })
      .then(text => {
        setMessage(text);
      })
      .catch(err => {
        setMessage('FAILED, as something related to fetching backend data is not working :(');
      });
  }, []);

  return (
    <div>
      <h1>Test: {message}</h1>
    </div>
  );
}

export default App;