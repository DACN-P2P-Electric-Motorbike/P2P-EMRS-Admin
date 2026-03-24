import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Giả lập sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Vitest sử dụng 'vi' thay cho 'jest'
window.confirm = vi.fn();
window.alert = vi.fn();