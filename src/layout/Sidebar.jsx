import { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { personsImgs } from "../utils/images";
import { navigationLinks } from "../data/data";
import { SidebarContext } from "../context/sidebarContext";
import { useAuth } from "../context/AuthContext"; // 1. Import useAuth

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen } = useContext(SidebarContext);
  const { user, logout } = useAuth(); // 2. Lấy dữ liệu user và hàm logout
  const [sidebarClass, setSidebarClass] = useState("");

  useEffect(() => {
    if (isSidebarOpen) {
      setSidebarClass("-ml-[300px] max-[1200px]:-ml-[80px]");
    } else {
      setSidebarClass("");
    }
  }, [isSidebarOpen]);

  const handleLogout = () => {
    logout(); // 3. Sử dụng hàm logout từ Context để xóa sessionStorage
    navigate('/login');
  };

  return (
    <aside
        className={`
          bg-primary w-75 px-6 py-9
          transition-all duration-300
          flex flex-col

          max-[1400px]:px-5
          max-[1200px]:w-20
          max-[1200px]:px-3
          max-[420px]:-ml-20
          ${sidebarClass}
        `}
      >
      {/* PHẦN TRÊN: USER & NAV */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* USER INFO - Dữ liệu thật */}
        <div className="flex items-center gap-4 mb-7 shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-pumpkin">
            <img
              src={user?.avatar || personsImgs.Admin}
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white text-xl font-medium uppercase max-xl:hidden truncate">
            {user?.fullName || 'Admin'}
          </span>
        </div>

        {/* NAVIGATION - Tự cuộn nếu danh sách quá dài */}
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
                <li key={link.id} className="mb-2 mr-1 max-xl:flex max-xl:justify-center">
                  <Link
                    to={link.path}
                    className={`
                      flex items-center gap-3 h-11 px-4 rounded-lg
                      transition-all duration-300
                      ${isActive ? "bg-pumpkin shadow-xl" : "hover:bg-white/5"}
                      max-xl:w-8 max-xl:h-8 max-xl:p-0 max-xl:justify-center
                    `}
                  >
                    <img src={link.image} alt={link.title} className="w-6 h-6 shrink-0" />
                    <span className="capitalize text-white text-lg font-medium max-[1200px]:hidden">
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
            flex items-center gap-3 w-full
            h-11 px-4 rounded-lg
            text-white/70 hover:text-white
            hover:bg-red-500/20 transition-all duration-300
            max-xl:justify-center max-xl:px-0
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
          <span className="text-lg font-medium max-[1200px]:hidden">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;