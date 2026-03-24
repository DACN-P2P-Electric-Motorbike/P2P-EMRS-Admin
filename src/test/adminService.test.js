import adminService from '../Service/adminService';
import api from '../Service/api';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Giả lập instance axios 'api'
vi.mock('../Service/api');

describe('AdminService - Unit Tests (UC-10, 11, 12)', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('updateUserStatus: Phải gửi đúng Body PATCH để kích hoạt/khóa user (image_2858dc.png)', async () => {
    api.patch.mockResolvedValue({ data: { status: 'success' } });
    const userId = 'u-999';
    const newStatus = 'ACTIVE';

    await adminService.updateUserStatus(userId, newStatus);
    
    expect(api.patch).toHaveBeenCalledWith(`/admin/users/${userId}/status`, { 
      status: newStatus 
    });
  });

  // --- UC-10: DUYỆT XE MÁY ĐIỆN ---

  test('getVehicles: Phải gọi đúng URL với phân trang và lọc (image_538be6.png)', async () => {
    api.get.mockResolvedValue({ data: { status: 'success' } });
    
    const params = { page: 1, limit: 10, status: 'PENDING_APPROVAL' };
    await adminService.getVehicles(params);
    
    expect(api.get).toHaveBeenCalledWith('/admin/vehicles', { params });
  });

  test('updateVehicleStatus: Phải gửi đúng Body PATCH để duyệt/từ chối xe (image_5371de.png)', async () => {
    api.patch.mockResolvedValue({ data: { status: 'success' } });
    const vehicleId = 'v-123';
    const newStatus = 'AVAILABLE';

    await adminService.updateVehicleStatus(vehicleId, newStatus);
    
    expect(api.patch).toHaveBeenCalledWith(`/admin/vehicles/${vehicleId}/status`, { 
      status: newStatus 
    });
  });

  // --- UC-12: BÁO CÁO & THỐNG KÊ (DASHBOARD) ---

  test('getDashboardStats: Phải lấy dữ liệu thống kê theo kỳ báo cáo', async () => {
    api.get.mockResolvedValue({ data: { status: 'success' } });
    
    const params = { period: 'this_month' };
    await adminService.getDashboardStats(params);
    
    expect(api.get).toHaveBeenCalledWith('/admin/dashboard', { params });
  });

  // --- KIỂM THỬ XỬ LÝ LỖI (ERROR HANDLING) ---

  test('Phải ném lỗi (throw error) khi API trả về lỗi', async () => {
    const errorResponse = { response: { data: { message: 'Unauthorized' } } };
    api.get.mockRejectedValue(errorResponse);
    
    await expect(adminService.getUsers()).rejects.toEqual(errorResponse.response.data);
  });
});