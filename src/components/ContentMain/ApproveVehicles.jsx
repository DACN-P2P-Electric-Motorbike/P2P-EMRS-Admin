import { useState, useEffect } from 'react';
import adminService from '../../Service/adminService';
import PropTypes from 'prop-types';

const ApproveVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'PENDING_APPROVAL', // Mặc định lọc xe chờ duyệt
    page: 1,
    limit: 10
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const result = await adminService.getVehicles(filters);
      if (result.status === "success") {
        setVehicles(result.data.data);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách xe:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const handleApprove = async (id) => {
    if (window.confirm("Xác nhận phê duyệt xe này?")) {
      try {
        await adminService.approveVehicle(id);
        alert("Phê duyệt thành công!");
        fetchVehicles(); // Tải lại danh sách
      } catch (err) {
        alert("Lỗi: " + err.message);
      }
    }
  };

  // Hàm xử lý chung cho Duyệt và Từ chối
  const handleStatusUpdate = async (id, newStatus) => {
    const confirmMsg = newStatus === 'AVAILABLE'
      ? "Bạn có chắc chắn muốn PHÊ DUYỆT xe này không?"
      : "Bạn có chắc chắn muốn TỪ CHỐI xe này không?";

    if (window.confirm(confirmMsg)) {
      try {
        await adminService.updateVehicleStatus(id, newStatus);
        alert(newStatus === 'AVAILABLE' ? "Đã duyệt xe thành công!" : "Đã từ chối xe.");
        
        // Tải lại danh sách xe để cập nhật giao diện
        fetchVehicles(); 
      } catch (err) {
        alert("Thao tác thất bại: " + (err.message || "Lỗi không xác định"));
      }
    }
  };

  return (
    <div className="p-6 text-white bg-primary-dark min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-white">
          Duyệt xe máy điện
        </h2>
        
        {/* Bộ lọc trạng thái từ Swagger */}
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
          className="bg-primary border border-white/10 text-white rounded-lg px-4 py-2 outline-none focus:border-pumpkin"
        >
          <option value="PENDING_APPROVAL">Chờ phê duyệt</option>
          <option value="AVAILABLE">Đang hoạt động</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải danh sách xe...</div>
      ) : (
        <div className="bg-primary rounded-xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-white/5 text-sm uppercase">
                <th className="p-5">Hình ảnh</th>
                <th className="p-5">Thông tin xe</th>
                <th className="p-5">Chủ sở hữu</th>
                <th className="p-5">Biển số</th>
                <th className="p-5">Ngày đăng ký</th>
                <th className="p-5">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-5">
                    <img 
                      src={v.vehicle_info.images[0]} 
                      alt="vehicle" 
                      className="w-20 h-12 object-cover rounded-lg border border-white/10"
                    />
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-white">{v.vehicle_info.brand}</div>
                    <div className="text-sm text-gray-400">{v.vehicle_info.model}</div>
                  </td>
                  <td className="p-5">
                    <div className="text-sm">{v.owner.full_name}</div>
                    <div className="text-xs text-gray-500">{v.owner.email}</div>
                  </td>
                  <td className="p-5 font-mono text-pumpkin">{v.vehicle_info.plate_number}</td>
                  <td className="p-5 text-sm text-gray-400">
                    {new Date(v.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-5">
                    {v.status === 'PENDING_APPROVAL' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatusUpdate(v.id, 'AVAILABLE')}
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-md text-xs font-bold hover:bg-green-500 hover:text-white transition-all"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(v.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-md text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                    {/* Hiển thị trạng thái khác nếu xe đã được xử lý */}
                    {v.status !== 'PENDING_APPROVAL' && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        v.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                        {v.status}
                    </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Component */}
          <div className="p-5 flex justify-between items-center border-t border-white/5">
            <span className="text-sm text-gray-400">
              Tổng cộng: <b>{pagination.total}</b> xe
            </span>
            <div className="flex gap-2">
              <button 
                disabled={filters.page === 1}
                onClick={() => setFilters({...filters, page: filters.page - 1})}
                className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-30"
              >
                Trước
              </button>
              <span className="px-4 py-2 bg-pumpkin text-white rounded-lg">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={filters.page === pagination.totalPages}
                onClick={() => setFilters({...filters, page: filters.page + 1})}
                className="px-4 py-2 bg-white/5 rounded-lg disabled:opacity-30"
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

ApproveVehicles.propTypes = {
    // Không có props nào được truyền vào, nhưng nếu có, bạn có thể định nghĩa ở đây
};
export default ApproveVehicles;