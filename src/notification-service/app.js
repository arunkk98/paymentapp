const express = require('express');
const amqp = require('amqplib');

const app = express();
const PORT = process.env.PORT || 5002;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq.payment-system.svc.cluster.local:5672';

async function consumeQueue() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('PAYMENT_EVENTS', { durable: true });

    console.log('Notification Service listening for PAYMENT_EVENTS...');
    channel.consume('PAYMENT_EVENTS', (msg) => {
      if (msg !== null) {
        const txn = JSON.parse(msg.content.toString());
        console.log(`[Notification Engine] Alert sent to ${txn.recipient} for $${txn.amount} (Txn: ${txn.transactionId})`);
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error('Consumer error:', err.message);
  }
}
consumeQueue();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'notification-service' });
});

app.listen(PORT, () => {
  console.log(`Notification Service listening on port ${PORT}`);
});
