import amqp from 'amqplib';

let connection = null;
let channel = null;

export async function connectToRabbitMQ(messageHandler) {
  try {
    const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
    const exchangeName = process.env.RABBITMQ_EXCHANGE_NAME || 'meter-data-exchange';
    const queueName = process.env.RABBITMQ_QUEUE_NAME || 'meter-data-queue';
    const routingKey = process.env.RABBITMQ_ROUTING_KEY || 'meter.data';

    console.log(`Connecting to RabbitMQ at ${rabbitMQUrl}...`);
    
    connection = await amqp.connect(rabbitMQUrl);
    channel = await connection.createChannel();

    // Assert exchange
    await channel.assertExchange(exchangeName, 'topic', {
      durable: true
    });

    // Assert queue
    await channel.assertQueue(queueName, {
      durable: true
    });

    // Bind queue to exchange
    await channel.bindQueue(queueName, exchangeName, routingKey);

    console.log(`Connected to RabbitMQ. Exchange: ${exchangeName}, Queue: ${queueName}, RoutingKey: ${routingKey}`);

    // Consume messages
    await channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          const count = Array.isArray(content) ? content.length : 1;
          console.log(`Received message from RabbitMQ: ${count} sensor reading(s)`);

          // Pass the entire content (array or single object) to the handler
          await messageHandler(content);

          // Acknowledge message
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing RabbitMQ message:', error);
          // Reject message and requeue
          channel.nack(msg, false, true);
        }
      }
    }, {
      noAck: false
    });

    console.log('Waiting for messages from RabbitMQ...');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
    });

    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

export async function closeRabbitMQConnection() {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
}

