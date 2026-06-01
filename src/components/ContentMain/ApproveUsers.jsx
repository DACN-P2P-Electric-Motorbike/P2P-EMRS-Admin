import { useState, useEffect, useCallback } from 'react';
import adminService from '../../Service/adminService';

const ApproveUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    role: '',
    status: ''
  });

  // State quản lý Modal Trust-Score
  const [selectedUser, setSelectedUser] = useState(null);
  const [trustScoreData, setTrustScoreData] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State cho Form điều chỉnh điểm
  const [adjustment, setAdjustment] = useState({
    delta: '',
    reason: ''
  });
  const [submittingScore, setSubmittingScore] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams = { 
        page: filters.page, 
        limit: filters.limit 
      };

      if (filters.role) cleanParams.role = filters.role;
      if (filters.status) cleanParams.status = filters.status;

      const result = await adminService.getUsers(cleanParams);
      
      if (result.status === "success") {
        setUsers(result.data.data);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      console.error("Lỗi fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [filters.page, filters.role, filters.status, fetchUsers]);

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const actionText = newStatus === 'ACTIVE' ? 'KÍCH HOẠT' : 'KHÓA';

    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này không?`)) {
      try {
        await adminService.updateUserStatus(userId, newStatus);
        alert(`Đã ${actionText} tài khoản thành công!`);
        fetchUsers(); 
      } catch (err) {
        alert("Thao tác thất bại: " + (err.message || "Lỗi không xác định"));
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 
    }));
  };

  // --- Logic xử lý Trust-Score ---
  
  // Mở Modal và lấy thông tin chi tiết Trust Score từ API GET
  const handleOpenTrustScoreModal = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setLoadingScore(true);
    setAdjustment({ delta: '', reason: '' }); // Reset form
    
    try {
      // Đảm bảo bạn đã định nghĩa hàm này trong adminService
      const response = await adminService.getUserTrustScore(user.id);
      if (response.status === "success") {
        setTrustScoreData(response.data);
      }
    } catch (err) {
      alert("Không thể tải thông tin Trust-Score: " + (err.message || "Lỗi hệ thống"));
      setIsModalOpen(false);
    } finally {
      setLoadingScore(false);
    }
  };

  // Gửi cập nhật điểm lên API PATCH
  const handleAdjustScoreSubmit = async (e) => {
    e.preventDefault();
    if (!adjustment.delta || !adjustment.reason.trim()) {
      alert("Vui lòng điền đầy đủ mức thay đổi và lý do.");
      return;
    }

    setSubmittingScore(true);
    try {
      const payload = {
        delta: parseInt(adjustment.delta, 10),
        reason: adjustment.reason
      };

      // Đảm bảo bạn đã định nghĩa hàm này trong adminService
      const response = await adminService.adjustUserTrustScore(selectedUser.id, payload);
      
      if (response.status === "success") {
        alert(response.message || "Điều chỉnh điểm uy tín thành công!");
        // Cập nhật lại thông tin hiển thị tại chỗ
        setTrustScoreData(prev => ({
          ...prev,
          trustScore: response.data.trustScore,
          tier: response.data.tier
        }));
        // Reset form điền điểm
        setAdjustment({ delta: '', reason: '' });
        // Tải lại thông tin chi tiết (để cập nhật bảng recentEvents nếu cần)
        const refreshResponse = await adminService.getUserTrustScore(selectedUser.id);
        if (refreshResponse.status === "success") {
          setTrustScoreData(refreshResponse.data);
        }
      }
    } catch (err) {
      alert("Điều chỉnh điểm thất bại: " + (err.message || "Lỗi không xác định"));
    } finally {
      setSubmittingScore(false);
    }
  };

  return (
    <div className="p-6 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Phê duyệt người dùng</h2>
        
        <div className="flex gap-4">
          <select 
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="bg-primary border border-white/10 text-white rounded-lg px-4 py-2 outline-none focus:border-pumpkin text-sm cursor-pointer hover:border-pumpkin/50 transition-colors"
          >
            <option value="">Tất cả vai trò</option>
            <option value="RENTER">Người thuê</option>
            <option value="OWNER">Chủ xe</option>
          </select>

          <select 
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="bg-primary border border-white/10 text-white rounded-lg px-4 py-2 outline-none focus:border-pumpkin text-sm cursor-pointer hover:border-pumpkin/50 transition-colors"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="BLOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải danh sách người dùng...</div>
      ) : (
        <div className="bg-primary rounded-xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-white/5 text-xs uppercase tracking-widest">
                <th className="p-5">Họ tên</th>
                <th className="p-5">Email</th>
                <th className="p-5">Vai trò</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-5 font-medium">{user.fullName}</td>
                    <td className="p-5 text-gray-400 text-sm">{user.email}</td>
                    <td className="p-5">
                      <div className="flex gap-1">
                        {user.roles.map((role, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold uppercase">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-2">
                        {/* NÚT MỚI: Hồ sơ & Trust-Score */}
                        <button
                          onClick={() => handleOpenTrustScoreModal(user)}
                          className="px-3 py-1.5 bg-pumpkin/20 text-pumpkin hover:bg-pumpkin hover:text-white rounded-md text-xs font-bold transition-all shadow-sm"
                        >
                          Hồ sơ & Điểm uy tín
                        </button>

                        <button 
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${
                              user.status === 'ACTIVE' 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' 
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Kích hoạt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 italic">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="p-5 flex justify-between items-center border-t border-white/5 bg-black/10">
            <span className="text-xs text-gray-500">
              Tổng số: {pagination.total || 0} người dùng
            </span>
            <div className="flex gap-2">
              <button 
                disabled={filters.page === 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-20 text-sm hover:bg-white/10 transition-colors"
              >
                Trước
              </button>
              <span className="flex items-center px-4 text-pumpkin font-bold text-sm">
                 Trang {pagination.page || 1} / {pagination.totalPages || 1}
              </span>
              <button 
                disabled={filters.page === pagination.totalPages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-20 text-sm hover:bg-white/10 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CHI TIẾT HỒ SƠ & ĐIỀU CHỈNH TRUST SCORE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-primary border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl text-white">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wide">Hồ sơ điểm uy tín</h3>
                <p className="text-sm text-gray-400 mt-1">Thành viên: <span className="text-white font-medium">{selectedUser?.fullName}</span> ({selectedUser?.email})</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl font-semibold transition-colors"
              >
                &times;
              </button>
            </div>

            {loadingScore ? (
              <div className="text-center py-20 text-gray-400">Đang tải dữ liệu hồ sơ uy tín...</div>
            ) : (
              <div className="p-6 space-y-6">
                
                {/* 1. Tổng quan điểm & Tier hiện tại */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Điểm uy tín</span>
                    <span className="text-4xl font-extrabold text-pumpkin">{trustScoreData?.trustScore}</span>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Hạng hiện tại</span>
                    <span className="text-lg font-bold text-green-400 block mt-1">{trustScoreData?.tier?.label} (Cấp {trustScoreData?.tier?.level})</span>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-sm space-y-1 text-gray-300">
                    <div>• Đặt xe đồng thời tối đa: <span className="text-white font-bold">{trustScoreData?.tier?.maxConcurrentBookings}</span></div>
                    <div>• Quyền tạo đơn đặt xe: <span className={trustScoreData?.tier?.canCreateBooking ? "text-green-400 font-medium" : "text-red-400 font-medium"}>{trustScoreData?.tier?.canCreateBooking ? "Cho phép" : "Khóa"}</span></div>
                    <div>• Quyền đăng ký xe: <span className={trustScoreData?.tier?.canRegisterVehicle ? "text-green-400 font-medium" : "text-red-400 font-medium"}>{trustScoreData?.tier?.canRegisterVehicle ? "Cho phép" : "Khóa"}</span></div>
                  </div>
                </div>

                {/* 2. Cảnh báo hoạt động nếu có */}
                {trustScoreData?.activeWarnings && trustScoreData.activeWarnings.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wide mb-2">⚠️ Cảnh báo đang hoạt động</h4>
                    <ul className="list-disc list-inside text-sm text-red-300/90 space-y-1">
                      {trustScoreData.activeWarnings.map((warn, index) => (
                        <li key={index}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Grid chia 2 bên: Lịch sử và Form cập nhật */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  
                  {/* Cột Trái: Form điều chỉnh điểm thủ công (PATCH) */}
                  <div className="lg:col-span-5 bg-black/20 p-5 rounded-xl border border-white/5 h-fit">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide mb-4 border-b border-white/5 pb-2">
                      Điều chỉnh điểm thủ công
                    </h4>
                    <form onSubmit={handleAdjustScoreSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Lượng điểm thay đổi (Delta)</label>
                        <input 
                          type="number"
                          placeholder="Ví dụ: -10 hoặc 5"
                          value={adjustment.delta}
                          onChange={(e) => setAdjustment(prev => ({ ...prev, delta: e.target.value }))}
                          className="w-full bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pumpkin transition-colors"
                          required
                        />
                        <span className="text-[11px] text-gray-500 mt-1 block">Điền số âm (-) để trừ điểm, số dương để cộng điểm.</span>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 font-bold uppercase mb-1.5">Lý do điều chỉnh (Audit Reason)</label>
                        <textarea 
                          rows="3"
                          placeholder="Nhập lý do chi tiết..."
                          value={adjustment.reason}
                          onChange={(e) => setAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full bg-primary border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-pumpkin transition-colors resize-none"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingScore}
                        className="w-full py-2 bg-pumpkin hover:bg-pumpkin/90 text-white font-bold rounded-lg text-sm transition-colors shadow disabled:opacity-50"
                      >
                        {submittingScore ? "Đang xử lý..." : "Cập nhật thay đổi"}
                      </button>
                    </form>
                  </div>

                  {/* Cột Phải: Biến động lịch sử gần đây */}
                  <div className="lg:col-span-7 space-y-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide border-b border-white/5 pb-2">
                      Lịch sử biến động gần đây
                    </h4>
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {trustScoreData?.recentEvents && trustScoreData.recentEvents.length > 0 ? (
                        trustScoreData.recentEvents.map((event) => (
                          <div key={event.id} className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-400 uppercase tracking-wide">{event.type}</span>
                              <span className={`font-extrabold px-1.5 py-0.5 rounded text-[10px] ${
                                event.delta >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {event.delta >= 0 ? `+${event.delta}` : event.delta} điểm
                              </span>
                            </div>
                            <div className="text-gray-300"><span className="text-gray-500">Lý do:</span> {event.reason}</div>
                            <div className="text-gray-400 flex justify-between pt-1 border-t border-white/5 text-[11px]">
                              <span>Điểm: {event.scoreBefore} → {event.scoreAfter}</span>
                              <span>{new Date(event.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 italic text-center py-6">Chưa có sự kiện biến động nào được ghi nhận.</div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
              >
                Đóng hồ sơ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveUsers;