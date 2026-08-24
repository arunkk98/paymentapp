const express = require('express');
const amqp = require('amqplib');
const helmet = require('helmet');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const PORT = process.env.PORT || 5679;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq.payment-system.svc.cluster.local:5672';

async function consumeQueue() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('PAYMENT_EVENTS', { durable: true });

    console.log('Notification Service waiting for messages in PAYMENT_EVENTS...');

    channel.consume('PAYMENT_EVENTS', (msg) => {
      if (msg !== null) {
        try {
          const paymentData = JSON.parse(msg.content.toString());
          console.log(`[Notification Worker] Sent notification for Txn ID: ${paymentData.transactionId} to ${paymentData.recipient}`);
          channel.ack(msg);
        } catch (parseError) {
          console.error('Error parsing queue message payload:', parseError.message);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (err) {
    console.error('RabbitMQ consumer connection error:', err.message);
  }
}
consumeQueue();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'notification-service' });
});

app.use((err, req, res, next) => {
  console.error('Internal Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Notification Service listening on port ${PORT}`);
});
