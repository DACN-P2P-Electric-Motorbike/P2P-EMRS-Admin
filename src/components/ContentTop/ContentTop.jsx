import { iconsImgs } from "../../utils/images";
import { useContext } from "react";
import { SidebarContext } from "../../context/sidebarContext";

const ContentTop = () => {
  const { toggleSidebar } = useContext(SidebarContext);

  return (
    <div className="flex justify-between items-center mb-8"> {/* .main-content-top */}
      <div className="flex items-center"> {/* .content-top-left */}
        <button 
          type="button" 
          className="flex items-center mr-3" /* .sidebar-toggler */
          onClick={() => toggleSidebar()}
        >
          <img src={iconsImgs.menu} alt="menu" className="w-5" /> {/* .sidebar-toggler img */}
        </button>
        <h3 className="text-white text-[20px] font-semibold"> {/* .content-top-title */}
          Home
        </h3>
      </div>

      <div className="flex items-center"> {/* .content-top-btns */}
        <button type="button" className="ml-[18px]"> {/* .content-top-btn */}
          <img 
            src={iconsImgs.search} 
            alt="search" 
            className="w-6 transition-all hover:brightness-0 hover:invert" /* .content-top-btn img & hover */
          />
        </button>
        
        <button className="ml-[18px] relative"> {/* .content-top-btn */}
          <img 
            src={iconsImgs.bell} 
            alt="notification" 
            className="w-6 transition-all hover:brightness-0 hover:invert" 
          />
          {/* Dot thông báo nếu bạn cần thêm logic */}
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-primary"></span>
        </button>
      </div>
    </div>
  );
};

export default ContentTop;