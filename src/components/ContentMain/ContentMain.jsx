import { useState, useEffect } from 'react';
import adminService from "../../Service/adminService";
import { dashboardData } from "../../data/data"; // Import Mock Data để dự phòng
import MetricCards from "../Dashboard/MetricCards";
import RevenueChart from "../Dashboard/RevenueChart";
import RecentTransactions from "../Dashboard/RecentTransactions";
import VehicleOverview from "../Dashboard/VehicleOverview";

const ContentMain = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const result = await adminService.getDashboardStats({ period });

        // Kiểm tra dữ liệu API trả về
        if (result && result.status === "success" && result.data) {
          setData(result.data);
        } else {
          // API trả về rỗng -> Dùng Mock Data
          setData(dashboardData.data);
        }
      } catch (err) {
        // API lỗi kết nối -> Dùng Mock Data
        console.error("Lỗi API, đang sử dụng dữ liệu dự phòng:", err);
        setData(dashboardData.data);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white">
        <div className="w-10 h-10 border-4 border-pumpkin/20 border-t-pumpkin rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse">Đang đồng bộ dữ liệu hệ thống P2P...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-y-5 max-[1200px]:gap-y-3">
      {/* Header & Filter */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Thống kê quản trị</h2>
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-[#212121] border border-white/10 text-white rounded-lg px-4 py-2 outline-none focus:border-pumpkin text-sm"
        >
          <option value="this_month">Tháng này</option>
          <option value="last_month">Tháng trước</option>
          <option value="this_year">Năm nay</option>
          <option value="all_time">Tất cả thời gian</option>
        </select>
      </div>

      {/* Dữ liệu hiển thị (Thực tế hoặc Mock tùy vào kết quả gọi API) */}
      <MetricCards metrics={data.metrics} />

      <div className="grid gap-x-4 max-[1200px]:gap-x-3 grid-cols-3 max-[992px]:grid-cols-1 max-[992px]:gap-y-5">
          <div className="lg:col-span-2">
              <RevenueChart chartData={data.chart_data} />
          </div>
          <div className="lg:col-span-1">
              <VehicleOverview vehicles={data.metrics.vehicles} />
          </div>
      </div>

      <div className="w-full">
          <RecentTransactions transactions={data.recent_transactions} />
      </div>
    </div>
  );
};

export default ContentMain;