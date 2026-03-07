import api from './api';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // Lưu ý: Backend nên trả về { user, accessToken }
      // và set Refresh Token vào HttpOnly Cookie trong Response Header
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Đăng nhập thất bại' };
    }
  },

  // Bạn có thể thêm register, logout ở đây sau này
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  }
};

export default authService;