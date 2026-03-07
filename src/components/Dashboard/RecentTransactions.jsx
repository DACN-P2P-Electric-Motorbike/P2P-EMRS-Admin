import PropTypes from 'prop-types';

const RecentTransactions = ({ transactions }) => {
  return (
    <div className="bg-primary rounded-xl p-6 border border-white/5">
      <h3 className="text-lg font-semibold text-white mb-6">Giao dịch mới nhất</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-white/5 text-sm">
              <th className="pb-4">Người dùng</th>
              <th className="pb-4">Loại xe</th>
              <th className="pb-4">Số tiền</th>
              <th className="pb-4">Trạng thái</th>
              <th className="pb-4">Ngày</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 font-medium">{t.user_name}</td>
                <td className="py-4 text-gray-400">{t.vehicle_name}</td>
                <td className="py-4 font-semibold text-pumpkin">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount)}
                </td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    t.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="py-4 text-sm text-gray-500">
                  {new Date(t.date).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ĐỊNH NGHĨA PROPTYPES
RecentTransactions.propTypes = {
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      user_name: PropTypes.string,
      vehicle_name: PropTypes.string,
      amount: PropTypes.number,
      status: PropTypes.string,
      date: PropTypes.string
    })
  ).isRequired
};

export default RecentTransactions;