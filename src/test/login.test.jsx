import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/login';
import { AuthProvider } from '../context/AuthContext';
import authService from '../Service/authService';

// 1. Mock authService và useNavigate
vi.mock('../Service/authService');
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Login Component (UC-01) - Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  // --- PHẦN 1: TEST VALIDATION ---
  it('nên hiển thị lỗi khi bỏ trống hoặc nhập sai định dạng email', async () => {
    renderLogin();
    
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Invalid email format/i)).toBeInTheDocument();
  });

  it('nên hiển thị lỗi khi mật khẩu ngắn hơn 6 ký tự', async () => {
    renderLogin();
    
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@gmail.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(await screen.findByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
  });

  // --- PHẦN 2: TEST GỌI REQUEST THÀNH CÔNG ---
  it('nên gọi authService.login và chuyển hướng khi đăng nhập thành công', async () => {
    const mockResponse = {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZWI5Y2ViNC1jNDBlLTQyNTgtODMzNC0zYWNjMmIwYTliNDciLCJlbWFpbCI6ImhvYW5nbG9uZzQzNGdsQGdtYWlsLmNvbSIsInJvbGVzIjpbIlJFTlRFUiIsIk9XTkVSIiwiQURNSU4iXSwiaWF0IjoxNzc0Mjc0OTAyLCJleHAiOjE3NzQ4Nzk3MDJ9.kRQigLNtpWP61vd9S92l0LQ-XjYJtFOJAjRILvb8Nn4',
      user: { id: '6eb9ceb4-c40e-4258-8334-3acc2b0a9b47', fullName: 'Long', email: 'hoanglong434gl@gmail.com' }
    };
    
    // Giả lập API trả về thành công
    authService.login.mockResolvedValue(mockResponse);

    renderLogin();

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'hoanglong434gl@gmail.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123456' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    });

    // Kiểm tra request được gọi đúng tham số
    expect(authService.login).toHaveBeenCalledWith('hoanglong434gl@gmail.com', '123456');

    // Kiểm tra hiển thị trạng thái thành công
    expect(await screen.findByText(/Login Successful!/i)).toBeInTheDocument();

    // Đợi và kiểm tra việc điều hướng về trang chủ
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/');
    }, { timeout: 2000 });
  });

  // --- PHẦN 3: TEST GỌI REQUEST THẤT BẠI ---
  it('nên hiển thị thông báo lỗi khi thông tin đăng nhập sai (API Error)', async () => {
    const apiError = { message: 'Invalid credentials' };
    
    // Giả lập API trả về lỗi
    authService.login.mockRejectedValue(apiError);

    renderLogin();

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    });

    // Kiểm tra lỗi hiển thị từ API trả về
    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  // --- PHẦN 4: TEST CÁC TÍNH NĂNG PHỤ ---
  it('nên chuyển đổi hiển thị mật khẩu khi nhấn icon', () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/Password/i);
    const toggleBtn = screen.getByRole('button', { name: '' }); // Password toggle SVG button

    expect(passwordInput.type).toBe('password');
    
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');
  });
});