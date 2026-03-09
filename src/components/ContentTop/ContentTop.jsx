import { iconsImgs } from "../../utils/images";
import { useContext } from "react";
import { SidebarContext } from "../../context/sidebarContext";
import AdminNotificationBell from "../AdminNotificationBell";

const ContentTop = () => {
  const { toggleSidebar } = useContext(SidebarContext);

  return (
    <div className="flex justify-between items-center mb-8">
      {" "}
      {/* .main-content-top */}
      <div className="flex items-center">
        {" "}
        {/* .content-top-left */}
        <button
          type="button"
          className="flex items-center mr-3" /* .sidebar-toggler */
          onClick={() => toggleSidebar()}
        >
          <img src={iconsImgs.menu} alt="menu" className="w-5" />{" "}
          {/* .sidebar-toggler img */}
        </button>
        <h3 className="text-white text-[20px] font-semibold">
          {" "}
          {/* .content-top-title */}
          Trang chủ
        </h3>
      </div>
      <div className="flex items-center">
        {" "}
        {/* .content-top-btns */}
        <button type="button" className="ml-[18px]">
          {" "}
          {/* .content-top-btn */}
          <img
            src={iconsImgs.search}
            alt="search"
            className="w-6 transition-all hover:brightness-0 hover:invert" /* .content-top-btn img & hover */
          />
        </button>
        <AdminNotificationBell />
      </div>
    </div>
  );
};

export default ContentTop;
