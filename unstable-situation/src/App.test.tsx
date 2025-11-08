import { render, screen } from '@testing-library/react';
import App from './App';

test('renders IoT Sensor Monitoring System', () => {
  render(<App />);
  const titleElement = screen.getByText(/IoT Sensor Monitoring System/i);
  expect(titleElement).toBeInTheDocument();
});
