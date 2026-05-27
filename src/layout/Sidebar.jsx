import { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { personsImgs } from "../utils/images";
import { navigationLinks } from "../data/data";
import { SidebarContext } from "../context/sidebarContext";
import { useAuth } from "../context/AuthContext"; 

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen } = useContext(SidebarContext);
  const { user, logout } = useAuth(); 
  const [sidebarClass, setSidebarClass] = useState("");

  // Điều chỉnh class dịch chuyển theo tư duy Mobile-First
  useEffect(() => {
    if (isSidebarOpen) {
      setSidebarClass("-ml-20 min-[1200px]:-ml-[300px]");
    } else {
      setSidebarClass("");
    }
  }, [isSidebarOpen]);

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  return (
    <aside
        className={`
          bg-primary flex flex-col shrink-0 transition-all duration-300
          
          /* Mặc định cho màn hình nhỏ (Dưới 1200px) */
          w-20 px-3 py-9
          
          /* Khi màn hình lớn (Từ 1200px trở lên) */
          min-[1200px]:w-[300px] min-[1200px]:px-6
          
          max-[420px]:-ml-20
          ${sidebarClass}
        `}
      >
      {/* PHẦN TRÊN: USER & NAV */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* USER INFO */}
        <div className="flex items-center gap-4 mb-7 shrink-0 justify-center min-[1200px]:justify-start">
          <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-pumpkin shrink-0">
            <img
              src={user?.avatar || personsImgs.Admin}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>
          {/* SỬA LỖI: Mặc định hidden, lên màn hình lớn mới hiện block */}
          <span className="text-white text-xl font-medium uppercase hidden min-[1200px]:block truncate">
            {user?.fullName || 'Admin'}
          </span>
        </div>

        {/* NAVIGATION */}
        <nav
          className="
            flex-1 overflow-y-auto pr-1
            scrollbar-thin scrollbar-thumb-pumpkin scrollbar-track-transparent
          "
        >
          <ul>
            {navigationLinks.map((link) => {
              const isActive = link.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.path);

              return (
                <li key={link.id} className="mb-2 flex justify-center min-[1200px]:block">
                  <Link
                    to={link.path}
                    className={`
                      flex items-center gap-3 rounded-lg transition-all duration-300
                      ${isActive ? "bg-pumpkin shadow-xl" : "hover:bg-white/5"}
                      
                      /* Màn hình nhỏ: Biến thành ô vuông chứa icon canh giữa */
                      w-11 h-11 justify-center px-0
                      
                      /* Màn hình lớn: Trả lại full width và canh trái */
                      min-[1200px]:w-full min-[1200px]:h-11 min-[1200px]:px-4 min-[1200px]:justify-start
                    `}
                  >
                    <img src={link.image} alt={link.title} className="w-6 h-6 shrink-0" />
                    
                    {/* SỬA LỖI: Mặc định ẩn chữ, lên màn hình lớn mới hiện block + Chống rớt dòng */}
                    <span className="text-white text-lg font-medium hidden min-[1200px]:block whitespace-nowrap">
                      {link.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* PHẦN DƯỚI: NÚT ĐĂNG XUẤT */}
      <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-3 w-full h-11 rounded-lg
            text-white/70 hover:text-white
            hover:bg-red-500/20 transition-all duration-300
            justify-center px-0 min-[1200px]:px-4 min-[1200px]:justify-start
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke="currentColor"
            className="w-6 h-6 shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          
          {/* SỬA LỖI: Ẩn text chữ logout ở màn hình nhỏ */}
          <span className="text-lg font-medium hidden min-[1200px]:block whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;