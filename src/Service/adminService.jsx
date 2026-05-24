// src/services/adminService.js
import api from "./api";

const adminService = {
  // Hàm lấy dữ liệu thống kê cho dashboard
  getDashboardStats: async (params = {}) => {
    try {
      // params có thể chứa { period: 'this_month', startDate: '...', endDate: '...' }
      const response = await api.get("/admin/dashboard", { params });
      return response.data; // Trả về object chứa metrics, chart_data, transactions
    } catch (error) {
      throw (
        error.response?.data || { message: "Không thể lấy dữ liệu thống kê" }
      );
    }
  },

  // Hàm lấy danh sách xe với phân trang và lọc trạng thái
  getVehicles: async (params = {}) => {
    try {
      const response = await api.get("/admin/vehicles", { params });
      return response.data; // Trả về { status, data: { data: [], pagination: {} } }
    } catch (error) {
      throw error.response?.data || { message: "Lỗi lấy danh sách xe" };
    }
  },

  // Hàm cập nhật trạng thái xe
  updateVehicleStatus: async (vehicleId, status) => {
    try {
      const response = await api.patch(`/admin/vehicles/${vehicleId}/status`, {
        status: status, // Gửi body { "status": "AVAILABLE" } hoặc "REJECTED"
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi cập nhật trạng thái xe" };
    }
  },

  // Hàm lấy danh sách người dùng với phân trang và lọc trạng thái
  getUsers: async (params = {}) => {
    try {
      const response = await api.get("/admin/users", { params });
      return response.data; // Trả về { status, data: { data: [], pagination: {} } }
    } catch (error) {
      throw error.response?.data || { message: "Lỗi lấy danh sách người dùng" };
    }
  },

  // Giả định endpoint cập nhật trạng thái người dùng
  // updateUserStatus: async (userId, status) => {
  //   return await api.patch(`/admin/users/${userId}/status`, { status });
  // },

  // Hàm cập nhật trạng thái người dùng
  updateUserStatus: async (userId, status) => {
    try {
      // Endpoint: /admin/users/{id}/status | Method: PATCH
      const response = await api.patch(`/admin/users/${userId}/status`, {
        status: status, // Body: { "status": "ACTIVE" } hoặc "BANNED"
      });
      return response.data;
    } catch (error) {
      throw (
        error.response?.data || {
          message: "Lỗi cập nhật trạng thái người dùng",
        }
      );
    }
  },

  getKycSubmissions: async (params = {}) => {
    try {
      const response = await api.get("/admin/kyc", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi lấy danh sách KYC" };
    }
  },

  reviewKycSubmission: async (verificationId, payload) => {
    try {
      const response = await api.patch(
        `/admin/kyc/${verificationId}/review`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi duyệt KYC" };
    }
  },

  getHandoverReviewQueue: async (limit = 50) => {
    try {
      const response = await api.get("/handover/admin/queue", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi lấy hàng chờ bàn giao" };
    }
  },

  getFinancialQueue: async (limit = 50) => {
    try {
      const response = await api.get("/financial/admin/queue", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi lấy hàng chờ tài chính" };
    }
  },

  reviewPostTripCharge: async (chargeId, payload) => {
    try {
      const response = await api.patch(
        `/financial/charges/${chargeId}/status`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi cập nhật phí sau chuyến" };
    }
  },

  captureApprovedCharges: async (bookingId) => {
    try {
      const response = await api.post(
        `/financial/bookings/${bookingId}/capture-approved`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi khấu trừ tiền cọc" };
    }
  },

  releaseDeposit: async (bookingId) => {
    try {
      const response = await api.post(
        `/financial/bookings/${bookingId}/release-deposit`,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi ghi nhận hoàn cọc" };
    }
  },

  createOrRefreshOwnerPayout: async (bookingId) => {
    try {
      const response = await api.post(`/financial/bookings/${bookingId}/payout`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi cập nhật payout owner" };
    }
  },

  updateOwnerPayoutStatus: async (payoutId, payload) => {
    try {
      const response = await api.patch(
        `/financial/payouts/${payoutId}/status`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi xử lý payout owner" };
    }
  },

  getIncidentQueue: async (limit = 50) => {
    try {
      const response = await api.get("/incidents/admin/queue", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi lấy hàng chờ sự cố" };
    }
  },

  reviewIncidentReport: async (incidentId, payload) => {
    try {
      const response = await api.patch(
        `/incidents/${incidentId}/status`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Lỗi cập nhật sự cố" };
    }
  },
};

export default adminService;
