import { render, waitFor } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import App from './App';

describe('App', () => {
  test('renders without crashing', async () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeInTheDocument();
    // Wait for async state updates in ConversationSidebar to complete
    await waitFor(() => {
      expect(container.querySelector('[data-teststate="ready"]')).toBeInTheDocument();
    });
  });
});
