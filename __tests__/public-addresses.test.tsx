import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import PublicAddresses from '../app/(tabs)/public-addresses';

// Use a mock-prefixed variable so Jest allows it inside factory
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../firebaseConfig', () => ({ db: {} }));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(async () => ({
    docs: [
      { id: 'a1', data: () => ({ name: 'Spot 1', description: 'Desc', latitude: 1, longitude: 2, isPublic: true, user: 'user@test.com' }) },
    ],
  })),
  getDoc: jest.fn(async () => ({ exists: () => true, data: () => ({ avatarUrl: 'https://example.com/u.jpg' }) })),
  doc: jest.fn(),
}));

describe('PublicAddresses', () => {
  it('renders public list and navigates to comments', async () => {
    const { getByText, queryByText } = render(<PublicAddresses />);
    await waitFor(() => expect(getByText('Spot 1')).toBeTruthy());

    const btn = getByText('Voir commentaires');
    fireEvent.press(btn);
    expect(mockPush).toHaveBeenCalled();

    // The description should render too
    expect(queryByText('Desc')).toBeTruthy();
  });
});
