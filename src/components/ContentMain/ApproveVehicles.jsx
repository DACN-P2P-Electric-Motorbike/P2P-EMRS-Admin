import { useState, useEffect, useCallback } from 'react';
import adminService from '../../Service/adminService';

const conditionLabel = (value) => {
  const labels = {
    NEW: 'Xe mới',
    LIKE_NEW: 'Như mới',
    GOOD: 'Tốt',
    FAIR: 'Khá',
    NEEDS_MAINTENANCE: 'Cần bảo trì',
  };
  return labels[value] || value;
};

const batteryTypeLabel = (value) => {
  const labels = {
    FIXED_NON_REMOVABLE: 'Pin liền xe',
    REMOVABLE: 'Pin tháo rời',
    SWAPPABLE: 'Pin có thể đổi',
  };
  return labels[value] || value;
};

const formatServiceDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('vi-VN');
};

const ApproveVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'PENDING_APPROVAL', 
    page: 1,
    limit: 10
  });

  // State quản lý Modal
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [trustScoreData, setTrustScoreData] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [selectedOwnerName, setSelectedOwnerName] = useState('');

  const fetchVehicles = useCallback(async () => {
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
  }, [filters]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleStatusUpdate = async (id, newStatus) => {
    const confirmMsg = newStatus === 'AVAILABLE'
      ? "Bạn có chắc chắn muốn PHÊ DUYỆT xe này không?"
      : "Bạn có chắc chắn muốn TỪ CHỐI xe này không?";

    if (window.confirm(confirmMsg)) {
      try {
        await adminService.updateVehicleStatus(id, newStatus);
        alert(newStatus === 'AVAILABLE' ? "Đã duyệt xe thành công!" : "Đã từ chối xe.");
        fetchVehicles(); 
      } catch (err) {
        alert("Thao tác thất bại: " + (err.message || "Lỗi không xác định"));
      }
    }
  };

  // Hàm gọi API lấy Trust Score của chủ xe
  const handleViewTrustScore = async (ownerId, ownerName) => {
    setLoadingScore(true);
    setSelectedOwnerName(ownerName);
    try {
      const result = await adminService.getUserTrustScore(ownerId);
      if (result.status === "success") {
        setTrustScoreData(result.data);
      }
    } catch (err) {
      alert("Không thể tải thông tin Trust Score: " + (err.message || "Lỗi hệ thống"));
    } finally {
      setLoadingScore(false);
    }
  };

  return (
    <div className="p-6 text-white bg-primary-dark min-h-screen relative">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-white">
          Duyệt xe máy điện
        </h2>
        
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
                      src={v.vehicle_info.images?.[0]} 
                      alt="vehicle" 
                      className="w-20 h-12 object-cover rounded-lg border border-white/10 cursor-pointer"
                      onClick={() => setSelectedVehicle(v)}
                    />
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-white">{v.vehicle_info.brand}</div>
                    <div className="text-sm text-gray-400">{v.vehicle_info.model}</div>
                  </td>
                  <td className="p-5">
                    <div className="text-sm font-semibold text-pumpkin">{v.owner.full_name}</div>
                    <div className="text-xs text-gray-500">{v.owner.email}</div>
                  </td>
                  <td className="p-5 font-mono text-pumpkin">{v.vehicle_info.plate_number}</td>
                  <td className="p-5 text-sm text-gray-400">
                    {new Date(v.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-2 max-w-[160px]">
                      {/* Nhóm nút Xem thông tin */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedVehicle(v)}
                          className="flex-1 py-1 px-2 bg-white/10 text-white rounded text-[11px] font-medium hover:bg-white/20 transition-all"
                        >
                          Chi tiết xe
                        </button>
                        <button
                          onClick={() => handleViewTrustScore(v.owner.id, v.owner.full_name)}
                          className="flex-1 py-1 px-2 bg-pumpkin/20 text-pumpkin rounded text-[11px] font-medium hover:bg-pumpkin hover:text-white transition-all"
                        >
                          Chủ xe (Score)
                        </button>
                      </div>

                      {/* Nhóm nút Phê duyệt / Từ chối */}
                      {v.status === 'PENDING_APPROVAL' && (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleStatusUpdate(v.id, 'AVAILABLE')}
                            className="flex-1 py-1 bg-green-500/20 text-green-400 rounded text-[11px] font-bold hover:bg-green-500 hover:text-white transition-all"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(v.id, 'REJECTED')}
                            className="flex-1 py-1 bg-red-500/20 text-red-400 rounded text-[11px] font-bold hover:bg-red-500 hover:text-white transition-all"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}

                      {v.status !== 'PENDING_APPROVAL' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-center ${
                          v.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {v.status === 'AVAILABLE' ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ TỪ CHỐI'}
                        </span>
                      )}
                    </div>
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

      {/* ================= MODAL CHI TIẾT XE ================= */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary border border-white/10 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-pumpkin uppercase">Chi tiết phương tiện</h3>
              <button onClick={() => setSelectedVehicle(null)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <img 
                src={selectedVehicle.vehicle_info.images?.[0]} 
                alt="Full vehicle" 
                className="w-full h-48 object-cover rounded-xl border border-white/10 shadow-inner"
              />
              <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-lg border border-white/5">
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Thương hiệu</span>
                  <span className="font-semibold text-white">{selectedVehicle.vehicle_info.brand}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Mẫu xe (Model)</span>
                  <span className="font-semibold text-white">{selectedVehicle.vehicle_info.model || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Biển số xe</span>
                  <span className="font-mono font-bold text-pumpkin">{selectedVehicle.vehicle_info.plate_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs uppercase">Năm đăng ký đầu</span>
                  <span className="font-semibold text-white">{selectedVehicle.vehicle_info.first_registration_year || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông số nguồn điện & Pin</h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3 rounded-lg">
                  <p>Tình trạng: <b className="text-white">{conditionLabel(selectedVehicle.vehicle_info.condition) || 'N/A'}</b></p>
                  <p>Loại Pin: <b className="text-white">{batteryTypeLabel(selectedVehicle.vehicle_info.battery_type) || 'N/A'}</b></p>
                  <p>Sức khỏe pin (SOH): <b className="text-green-400">{selectedVehicle.vehicle_info.battery_health != null ? `${selectedVehicle.vehicle_info.battery_health}%` : 'N/A'}</b></p>
                  <p>Chu kỳ sạc: <b className="text-white">{selectedVehicle.vehicle_info.battery_cycle_count ?? 'N/A'} lần</b></p>
                  <p className="col-span-2 border-t border-white/5 pt-2 mt-1">
                    Bảo dưỡng gần nhất: <b className="text-white">{formatServiceDate(selectedVehicle.vehicle_info.battery_last_serviced_at) || 'Chưa ghi nhận'}</b>
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
              <button onClick={() => setSelectedVehicle(null)} className="px-5 py-2 bg-white/10 hover:bg-white/20 text-sm rounded-lg transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ĐIỂM UY TÍN (TRUST SCORE) ================= */}
      {(loadingScore || trustScoreData) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-primary border border-white/10 rounded-xl max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-lg font-bold text-pumpkin uppercase">Hồ sơ uy tín thành viên</h3>
                <p className="text-xs text-gray-400 mt-0.5">Chủ xe: <span className="text-white font-semibold">{selectedOwnerName}</span></p>
              </div>
              <button onClick={() => setTrustScoreData(null)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-5">
              {loadingScore ? (
                <div className="text-center py-10 text-gray-400">Đang đồng bộ điểm tin cậy...</div>
              ) : (
                <>
                  {/* Trạng thái Tổng quan */}
                  <div className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl">
                    <div>
                      <div className="text-xs text-gray-400 uppercase">Điểm tin cậy hiện tại</div>
                      <div className="text-4xl font-black text-pumpkin mt-1">{trustScoreData.trustScore} <span className="text-sm font-normal text-gray-400">/ 100</span></div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 font-bold text-xs rounded-full border border-green-500/20 uppercase tracking-wide">
                        {trustScoreData.status}
                      </span>
                      <div className="text-sm font-bold text-white mt-2">Hạng {trustScoreData.tier?.level}: {trustScoreData.tier?.label}</div>
                    </div>
                  </div>

                  {/* Quyền lợi thành viên */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/5 p-3 rounded-lg space-y-1">
                      <p className="text-gray-400">Đăng xe máy điện:</p>
                      <p className={`font-bold ${trustScoreData.tier?.canRegisterVehicle ? 'text-green-400' : 'text-red-400'}`}>
                        {trustScoreData.tier?.canRegisterVehicle ? '✓ Được phép đăng xe' : '✕ Bị khóa đăng xe'}
                      </p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg space-y-1">
                      <p className="text-gray-400">Đặt xe đồng thời tối đa:</p>
                      <p className="font-bold text-white">{trustScoreData.tier?.maxConcurrentBookings} đơn hàng</p>
                    </div>
                  </div>

                  {/* Sự kiện biến động điểm gần nhất */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lịch sử biến động điểm</h4>
                    <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                      {trustScoreData.recentEvents?.map((event) => (
                        <div key={event.id} className="p-3 bg-white/5 border border-white/5 rounded-lg text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-pumpkin">{event.reason}</span>
                            <span className={`font-bold ${event.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {event.delta >= 0 ? `+${event.delta.toFixed(1)}` : event.delta.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-500">
                            <span>Biến động từ: {event.scoreBefore.toFixed(1)} → {event.scoreAfter.toFixed(1)}</span>
                            <span>{new Date(event.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          
                          {/* Điểm số thành phần chi tiết từ siêu dữ liệu metadata */}
                          {event.metadata && (
                            <div className="mt-2 grid grid-cols-3 gap-1 pt-2 border-t border-white/5 text-[10px] text-gray-400">
                              <span>KYC: <b>{event.metadata.kycScore}</b></span>
                              <span>Đánh giá: <b>{event.metadata.ratingScore}</b></span>
                              <span>Hoạt động: <b>{event.metadata.activityScore}</b></span>
                              <span>Đúng giờ: <b>{event.metadata.punctualityScore}</b></span>
                              <span>Tranh chấp: <b>{event.metadata.disputeRate}%</b></span>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!trustScoreData.recentEvents || trustScoreData.recentEvents.length === 0) && (
                        <p className="text-center py-4 text-gray-500 text-xs">Chưa có sự kiện biến động điểm nào gần đây.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
              <button onClick={() => setTrustScoreData(null)} className="px-5 py-2 bg-white/10 hover:bg-white/20 text-sm rounded-lg transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveVehicles;