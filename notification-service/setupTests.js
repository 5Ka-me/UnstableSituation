// Suppress console.error logs during testing to keep output clean
const originalError = console.error;

beforeAll(() => {
  console.error = (...args) => {
    // Suppress specific error messages that are expected during testing
    const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
    
    if (
      message.includes('Failed to connect to SignalR Hub') ||
      message.includes('Failed to connect to RabbitMQ') ||
      message.includes('Error processing RabbitMQ message') ||
      message.includes('RabbitMQ connection error')
    ) {
      return; // Suppress these expected error logs during tests
    }
    
    // Keep all other error logs
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});