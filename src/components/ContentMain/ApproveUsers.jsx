import { useState, useEffect, useCallback } from 'react';
import adminService from '../../Service/adminService';
import PropTypes from 'prop-types';

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Khởi tạo params với các giá trị bắt buộc
      const cleanParams = { 
        page: filters.page, 
        limit: filters.limit 
      };

      // 2. Logic "Làm sạch" API: Chỉ thêm vào link nếu có giá trị thực (không rỗng)
      // Điều này giúp tạo ra URL như: .../users?status=ACTIVE&page=1&limit=10
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

  // 3. Logic useEffect mới: 
  // Gọi API bất cứ khi nào page, role hoặc status thay đổi.
  // Hàm fetchUsers bên trên sẽ tự động xử lý việc "sạch hóa" URL.
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
      page: 1 // Luôn reset về trang 1 khi lọc mới
    }));
  };

  return (
    <div className="p-6 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Phê duyệt người dùng</h2>
        
        {/* Bộ lọc linh hoạt cho 2 trường hợp: Vai trò và Trạng thái */}
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
                <th className="p-5">Hành động</th>
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
    </div>
  );
};

export default ApproveUsers;