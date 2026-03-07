// src/services/adminService.js
import api from './api';

const adminService = {

  // Hàm lấy dữ liệu thống kê cho dashboard
  getDashboardStats: async (params = {}) => {
    try {
      // params có thể chứa { period: 'this_month', startDate: '...', endDate: '...' }
      const response = await api.get('/admin/dashboard', { params });
      return response.data; // Trả về object chứa metrics, chart_data, transactions
    } catch (error) {
      throw error.response?.data || { message: 'Không thể lấy dữ liệu thống kê' };
    }
  },

  // Hàm lấy danh sách xe với phân trang và lọc trạng thái
  getVehicles: async (params = {}) => {
    try {
      const response = await api.get('/admin/vehicles', { params });
      return response.data; // Trả về { status, data: { data: [], pagination: {} } }
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi lấy danh sách xe' };
    }
  },

  // Hàm cập nhật trạng thái xe
  updateVehicleStatus: async (vehicleId, status) => {
    try {
      const response = await api.patch(`/admin/vehicles/${vehicleId}/status`, { 
        status: status // Gửi body { "status": "AVAILABLE" } hoặc "REJECTED"
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Lỗi cập nhật trạng thái xe' };
    }
  }

};

export default adminService;