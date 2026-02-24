import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app title and connect prompt when not authenticated', () => {
  render(<App />);
  expect(screen.getByText(/Oura Heart Rate History/i)).toBeInTheDocument();
  expect(screen.getByText(/Connect to Your Oura Ring/i)).toBeInTheDocument();
});
