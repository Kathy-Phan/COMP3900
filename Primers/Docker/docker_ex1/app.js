const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello World');
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully.');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
