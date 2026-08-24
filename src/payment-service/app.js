const express = require('express');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5678;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq.payment-system.svc.cluster.local:5672';

let channel;

async function connectQueue() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('PAYMENT_EVENTS', { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (err) {
    console.error('RabbitMQ connection error:', err.message);
  }
}
connectQueue();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'payment-service' });
});

app.post('/transfer', async (req, res) => {
  const { sender, recipient, amount } = req.body;
  if (!sender || !recipient || !amount) {
    return res.status(400).json({ error: 'Missing required fields: sender, recipient, amount' });
  }

  const transaction = {
    transactionId: `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
    sender,
    recipient,
    amount,
    currency: 'USD',
    status: 'SUCCESS',
    timestamp: new Date()
  };

  // Publish event to RabbitMQ
  if (channel) {
    channel.sendToQueue('PAYMENT_EVENTS', Buffer.from(JSON.stringify(transaction)), { persistent: true });
  }

  res.status(200).json({
    message: 'Payment processed successfully',
    transaction
  });
});

app.listen(PORT, () => {
  console.log(`Payment Service listening on port ${PORT}`);
});

