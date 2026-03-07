// src/components/Dashboard/RevenueChart.jsx
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import PropTypes from 'prop-types';

const RevenueChart = ({ chartData }) => {
  return (
    <div className="bg-primary p-6 rounded-xl border border-white/5 shadow-lg h-[400px]">
      <h3 className="text-lg font-semibold text-white mb-6 uppercase tracking-wider">Xu hướng kinh doanh</h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f36e21" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f36e21" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#212121', border: '1px solid #ffffff10', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          
          <Legend verticalAlign="top" height={36} iconType="circle" />

          {/* Doanh thu */}
          <Area 
            name="Doanh thu (VND)"
            type="monotone" 
            dataKey="revenue" 
            stroke="#f36e21" 
            fillOpacity={1} 
            fill="url(#colorRev)" 
            strokeWidth={3}
          />

          {/* Lượt đặt xe */}
          <Area 
            name="Lượt đặt xe"
            type="monotone" 
            dataKey="bookings" 
            stroke="#6366f1" 
            fillOpacity={0} 
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

RevenueChart.propTypes = {
  chartData: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.string,
      revenue: PropTypes.number,
      bookings: PropTypes.number,
    })
  ).isRequired,
};

export default RevenueChart;