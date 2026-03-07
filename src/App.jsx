import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './layout/Sidebar';
import Content from './layout/Content';
import Login from './components/login';
import Account from './components/Account';
import ApproveVehicles from './components/ContentMain/ApproveVehicles';

// ==========================================
// 1. COMPONENTS BẢO VỆ ROUTE
// ==========================================

// Kiểm tra: Nếu CHƯA đăng nhập thì chuyển về Login
// Nếu ĐÃ đăng nhập thì hiển thị nội dung bên trong (Outlet)
const ProtectedRoute = () => {
  // LƯU Ý: Cần đảm bảo bên trang Login.jsx đã lưu với key 'accessToken'
  // Ví dụ: localStorage.setItem('accessToken', token);
  const token = sessionStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Kiểm tra: Nếu ĐÃ đăng nhập rồi thì không cho vào trang Login nữa -> Đẩy về Home
const PublicRoute = () => {
  const token = sessionStorage.getItem('accessToken');

  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

// ==========================================
// 2. LAYOUT
// ==========================================

const MainLayout = () => {
  return (
    <div className='flex min-h-screen w-full overflow-hidden bg-secondary font-bai'>
      <Sidebar />
      <main className='flex-1'>
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* --- NHÓM ROUTE CÔNG KHAI (Login) --- */}
        {/* Dùng PublicRoute bao quanh để nếu đã login thì không vào đây được nữa */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* --- NHÓM ROUTE CẦN ĐĂNG NHẬP (Dashboard) --- */}
        {/* Dùng ProtectedRoute bao quanh để chặn người lạ */}
        <Route element={<ProtectedRoute />}>

          <Route path="/" element={<MainLayout />}>
            {/* Index: Mặc định vào Content khi truy cập "/" */}
            <Route index element={<Content />} />
            {/* Các route con khác */}
            <Route path="account" element={<Account />} />
            <Route path="approve-vehicles" element={<ApproveVehicles />} />

          </Route>

        </Route>

        {/* Route 404: Nếu nhập đường dẫn linh tinh thì quay về login hoặc trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;