import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../app/(tabs)/profile';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, col, id) => ({ db, col, id })),
  getDoc: jest.fn(async () => ({ exists: () => true, data: () => ({ avatarUrl: '' }) })),
  setDoc: jest.fn(async () => void 0),
}));

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(async () => void 0),
}));

jest.mock('../firebaseConfig', () => ({
  auth: { currentUser: { email: 'user@test.com', uid: 'UID123' } },
  db: {},
  storage: {},
}));

const mockUploadBytes = jest.fn(async () => void 0);
const mockGetDownloadURL = jest.fn(async () => 'https://example.com/avatar.jpg');
jest.mock('firebase/storage', () => ({
  ref: jest.fn((_s, path) => ({ path })),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file://mock.jpg' }] })),
}));

global.fetch = jest.fn(async () => ({ blob: async () => new Blob() })) as any;

describe('ProfileScreen', () => {
  it('allows changing profile photo (happy path)', async () => {
    const { getByText } = render(<ProfileScreen />);
    const btn = getByText('Changer la photo');
    fireEvent.press(btn);

    await waitFor(() => expect(mockUploadBytes).toHaveBeenCalled());
    const { setDoc } = require('firebase/firestore');
    await waitFor(() => expect(setDoc).toHaveBeenCalled());
  });
});


