// src/components/Dashboard/MetricCards.jsx
import { iconsImgs } from "../../utils/images";
import PropTypes from 'prop-types';

const MetricCards = ({ metrics }) => {
  const cardData = [
    {
      title: "Tổng doanh thu",
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(metrics.revenue.total),
      growth: metrics.revenue.growth_percent,
      icon: "💰", // Bạn có thể thay bằng iconsImgs tương ứng
      color: "text-green-400"
    },
    {
      title: "Lượt đặt xe",
      value: metrics.bookings.total,
      growth: metrics.bookings.growth_percent,
      icon: "🏍️",
      color: "text-blue-400"
    },
    {
      title: "Người dùng mới",
      value: metrics.users.total,
      growth: metrics.users.growth_percent,
      icon: "👥",
      color: "text-purple-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cardData.map((card, index) => (
        <div key={index} className="bg-primary p-6 rounded-xl border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium uppercase mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-white">{card.value}</h3>
              <div className="flex items-center mt-2">
                <span className={`text-xs font-bold ${card.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {card.growth >= 0 ? '↑' : '↓'} {Math.abs(card.growth)}%
                </span>
                <span className="text-gray-500 text-[10px] ml-2">so với tháng trước</span>
              </div>
            </div>
            <div className="text-3xl opacity-80 group-hover:scale-110 transition-transform">
              {card.icon}
            </div>
          </div>
          {/* Đường line trang trí phía dưới */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pumpkin/20 to-transparent" />
        </div>
      ))}
    </div>
  );
};

// ĐỊNH NGHĨA PROPTYPES
MetricCards.propTypes = {
  metrics: PropTypes.shape({
    revenue: PropTypes.shape({
      total: PropTypes.number,
      growth_percent: PropTypes.number
    }),
    bookings: PropTypes.shape({
      total: PropTypes.number,
      growth_percent: PropTypes.number
    }),
    users: PropTypes.shape({
      total: PropTypes.number,
      growth_percent: PropTypes.number
    })
  }).isRequired
};

export default MetricCards;