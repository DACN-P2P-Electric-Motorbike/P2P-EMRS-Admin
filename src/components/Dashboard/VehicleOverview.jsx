import PropTypes from 'prop-types';

const VehicleOverview = ({ vehicles }) => {
  const stats = [
    { label: 'Sẵn sàng', count: vehicles.available, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Đang thuê', count: vehicles.rented, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Bảo trì', count: vehicles.maintenance, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Chờ duyệt', count: vehicles.pendingApproval, color: 'text-pumpkin', bg: 'bg-pumpkin/10' },
  ];

  return (
    <div className="bg-primary rounded-xl p-6 border border-white/5 h-full">
      <h3 className="text-lg font-semibold text-white mb-6">Trạng thái đội xe ({vehicles.total})</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((item, idx) => (
          <div key={idx} className={`${item.bg} p-4 rounded-xl border border-white/5`}>
            <p className="text-gray-400 text-xs mb-1 uppercase">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 py-2 text-sm text-pumpkin border border-pumpkin/20 rounded-lg hover:bg-pumpkin hover:text-white transition-all">
        Quản lý danh sách xe
      </button>
    </div>
  );
};

// ĐỊNH NGHĨA PROPTYPES
VehicleOverview.propTypes = {
  vehicles: PropTypes.shape({
    total: PropTypes.number,
    available: PropTypes.number,
    rented: PropTypes.number,
    maintenance: PropTypes.number,
    pendingApproval: PropTypes.number
  }).isRequired
};

export default VehicleOverview;