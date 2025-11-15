import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Monitoring System', () => {
  render(<App />);
  const titleElement = screen.getByText(/Monitoring System/i);
  expect(titleElement).toBeInTheDocument();
});
