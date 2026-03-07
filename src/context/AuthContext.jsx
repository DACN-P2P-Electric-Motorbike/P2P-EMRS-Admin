import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

// 1. Tạo Context
export const AuthContext = createContext(null);

// 2. Tạo Provider (Component này cực kỳ quan trọng)
export const AuthProvider = ({ children }) => {
  // 1. Khởi tạo State bằng cách đọc trực tiếp từ sessionStorage
  const [accessToken, setAccessToken] = useState(
    sessionStorage.getItem('accessToken') || null
  );
  
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
    // Vì user là object nên phải dùng JSON.parse để chuyển từ string về object
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token);

    // 2. Lưu cả hai vào sessionStorage
    sessionStorage.setItem('accessToken', token);
    sessionStorage.setItem('user', JSON.stringify(userData)); // Lưu object user
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    sessionStorage.clear(); // Xóa sạch khi logout
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated: !!accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// 3. Tạo Hook để sử dụng nhanh
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('Lỗi rồi! Bạn phải bọc ứng dụng trong <AuthProvider> thì mới dùng được useAuth nhé.');
  }
  return context;
};