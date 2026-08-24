const express = require('express');
const crypto = require('crypto');
const amqp = require('amqplib');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// 1. Security headers and server fingerprint obfuscation
app.disable('x-powered-by');
app.use(helmet());

// 2. CORS and payload parsing limits to mitigate DoS
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST']
}));
app.use(express.json({ limit: '10kb' }));

const PORT = process.env.PORT || 5678;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq.payment-system.svc.cluster.local:5672';

let channel;

async function connectQueue() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('PAYMENT_EVENTS', { durable: true });
    console.log('Payment Service connected to RabbitMQ');
  } catch (err) {
    console.error('RabbitMQ connection error:', err.message);
  }
}
connectQueue();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'payment-service' });
});

// Transfer endpoint
app.post('/transfer', async (req, res, next) => {
  try {
    const { sender, recipient, amount } = req.body;
    if (!sender || !recipient || !amount) {
      return res.status(400).json({ error: 'Missing required fields: sender, recipient, amount' });
    }

    // Cryptographically secure transaction ID generation
    const transactionId = `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const transaction = {
      transactionId,
      sender,
      recipient,
      amount,
      currency: 'USD',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    };

    // Publish event to RabbitMQ
    if (channel) {
      channel.sendToQueue('PAYMENT_EVENTS', Buffer.from(JSON.stringify(transaction)), { persistent: true });
    }

    return res.status(200).json({
      message: 'Payment processed successfully',
      transaction
    });
  } catch (error) {
    return next(error);
  }
});

// Centralized error handling to prevent stack trace leaks
app.use((err, req, res, next) => {
  console.error('Internal Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Payment API Microservice listening on port ${PORT}`);
});
