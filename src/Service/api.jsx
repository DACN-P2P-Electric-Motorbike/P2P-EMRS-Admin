import axios from 'axios';

const api = axios.create({
  // Gọi biến môi trường từ Vite
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Có thể thêm interceptors ở đây để tự động đính kèm Token vào header nếu muốn
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;