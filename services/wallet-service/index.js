const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// In-memory store for demo only
const balances = { 'user-1': 1000 };

app.get('/balance/:userId', (req, res) => {
  const { userId } = req.params;
  res.json({ userId, balance: balances[userId] || 0 });
});

app.post('/adjust', (req, res) => {
  const { userId, amount } = req.body;
  if (typeof userId !== 'string' || typeof amount !== 'number') {
    return res.status(400).json({ error: 'userId (string) and amount (number) required' });
  }
  const prev = balances[userId] || 0;
  const next = prev + amount;
  if (next < 0) return res.status(400).json({ error: 'insufficient funds' });
  balances[userId] = next;
  res.json({ userId, balance: next });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`wallet-service listening on ${port}`));
