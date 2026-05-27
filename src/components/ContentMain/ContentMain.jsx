import { useState, useEffect } from 'react';
import adminService from "../../Service/adminService";
import { dashboardData } from "../../data/data";
import MetricCards from "../Dashboard/MetricCards";
import RevenueChart from "../Dashboard/RevenueChart";
import RecentTransactions from "../Dashboard/RecentTransactions";
import VehicleOverview from "../Dashboard/VehicleOverview";

const ContentMain = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  
  // Bổ sung State cho Custom Date
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Chuẩn bị tham số truyền đi dựa trên bộ lọc
        const params = {};
        if (isCustomDate && startDate && endDate) {
          params.startDate = startDate;
          params.endDate = endDate;
        } else {
          params.period = period;
        }

        const result = await adminService.getDashboardStats(params);

        if (result && result.status === "success" && result.data) {
          setData(result.data);
        } else {
          setData(dashboardData.data);
        }
      } catch (err) {
        console.error("Lỗi API, đang sử dụng dữ liệu dự phòng:", err);
        setData(dashboardData.data);
      } finally {
        setLoading(false);
      }
    };

    // Chỉ gọi API khi chọn period HOẶC khi đã điền đủ cả ngày bắt đầu và kết thúc
    if (!isCustomDate || (startDate && endDate)) {
      fetchDashboardData();
    }
  }, [period, isCustomDate, startDate, endDate]);

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
      {/* Header & Filter Chuyên Nghiệp - Dạng Tabs */}
<div className="flex flex-wrap justify-between items-center mb-4 gap-4 p-4 rounded-xl">
  <div>
    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Thống kê quản trị</h2>
    <p className="text-xs text-white/50 mt-0.5">Theo dõi hoạt động và doanh thu hệ thống P2P</p>
  </div>
  
  <div className="flex items-center gap-4 flex-wrap">
    {/* Thanh chọn Tab điều hướng bộ lọc */}
      <div className="flex bg-[#212121] border border-white/10 p-1 rounded-xl shadow-inner">
        <button 
          type="button"
          onClick={() => setIsCustomDate(false)}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
            !isCustomDate 
              ? 'bg-pumpkin text-white shadow-md' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Mốc thời gian cố định
        </button>
        <button 
          type="button"
          onClick={() => setIsCustomDate(true)}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
            isCustomDate 
              ? 'bg-pumpkin text-white shadow-md' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Chọn ngày tùy ý
        </button>
      </div>

      {/* Hiển thị Input tương ứng theo Tab đang chọn */}
      <div className="animate-fade-in">
        {!isCustomDate ? (
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[#212121] border border-white/10 text-white rounded-xl px-4 py-2 outline-none focus:border-pumpkin text-sm h-[38px] transition-colors cursor-pointer"
          >
            <option value="this_month">Tháng này</option>
            <option value="last_month">Tháng trước</option>
            <option value="this_year">Năm nay</option>
            <option value="all_time">Tất cả thời gian</option>
          </select>
        ) : (
          <div className="flex items-center gap-2 bg-[#212121] px-3 py-1.5 border border-white/10 rounded-xl h-[38px]">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-xs outline-none cursor-pointer inverted-scheme-color"
            />
            <span className="text-white/30 text-xs font-medium">đến</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-xs outline-none cursor-pointer inverted-scheme-color"
            />
          </div>
        )}
      </div>
    </div>
  </div>

      {/* Dữ liệu hiển thị */}
      <MetricCards metrics={data.metrics} />

      <div className="grid gap-x-4 grid-cols-3 max-[992px]:grid-cols-1 gap-y-5">
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

