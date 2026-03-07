import { useState, useEffect } from 'react';
// import { userDetails } from '../data/data';
import { personsImgs } from "../utils/images"; // Import data mẫu
import { useAuth } from '../context/AuthContext';

const Account = () => {
  // State quản lý dữ liệu form (để có thể gõ/sửa được)
  // const [formData, setFormData] = useState(userDetails);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    fullName: user?.fullName || "",
    joinDate: user?.joinDate || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    bio: user?.bio || ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        joinDate: user.joinDate,
        email: user.email,
        phone: user.phone,
        address: user.address,
        bio: user.bio
      });
    }
  }, [user]);

  // Xử lý khi nhập liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý lưu (Giả lập)
  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    alert("Cập nhật thông tin thành công!");
    console.log("Data saved:", formData);
  };

  return (
    <div className="p-6 max-[1400px]:p-4 text-white font-bai">
      {/* Page Title */}
      <h2 className="text-2xl font-bold mb-6 text-white uppercase tracking-wide">
        Thông tin tài khoản
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN: PROFILE CARD --- */}
        <div className="bg-primary rounded-xl p-6 shadow-lg h-fit text-center border border-white/5">
          <div className="relative w-32 h-32 mx-auto mb-4 group">
            <img 
              src={personsImgs.Admin}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover border-4 border-pumpkin shadow-lg shadow-pumpkin/20"
            />
            {/* Hover to change avatar overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
          </div>
          
          {/* <h3 className="text-xl font-bold">{formData.firstName} {formData.lastName}</h3> */}
          <h3 className="text-xl font-bold">{formData.fullName}</h3>
          <p className="text-gray-400 text-sm mb-4">Admin</p>
          
          <div className="flex justify-center gap-2 mb-6">
             <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30">
               Active
             </span>
             <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-xs font-medium">
               Joined {formData.joinDate}
             </span>
          </div>

          <button className="w-full py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-sm">
            Change Password
          </button>
        </div>

        {/* --- RIGHT COLUMN: DETAILS FORM --- */}
        <div className="lg:col-span-2 bg-primary rounded-xl p-6 shadow-lg border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-pumpkin">General Information</h3>
            <button 
              onClick={() => !isEditing && setIsEditing(true)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isEditing 
                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500 hidden' // Ẩn nút Edit khi đang sửa
                  : 'bg-pumpkin/10 text-pumpkin hover:bg-pumpkin hover:text-white'}
              `}
            >
              Edit Profile
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">First Name</label>
              <input 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditing}
                className="
                  w-full px-4 py-3 rounded-lg bg-[#2a2a35] text-white
                  border border-transparent focus:border-pumpkin outline-none
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all
                "
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Last Name</label>
              <input 
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg bg-[#2a2a35] text-white border border-transparent focus:border-pumpkin outline-none disabled:opacity-60 transition-all"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg bg-[#2a2a35] text-white border border-transparent focus:border-pumpkin outline-none disabled:opacity-60 transition-all"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Phone Number</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg bg-[#2a2a35] text-white border border-transparent focus:border-pumpkin outline-none disabled:opacity-60 transition-all"
              />
            </div>

            {/* Address (Full Width) */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-gray-400">Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg bg-[#2a2a35] text-white border border-transparent focus:border-pumpkin outline-none disabled:opacity-60 transition-all"
              />
            </div>

             {/* Bio (Full Width) */}
             <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-gray-400">Bio</label>
              <textarea 
                name="bio"
                rows="4"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 rounded-lg bg-[#2a2a35] text-white border border-transparent focus:border-pumpkin outline-none disabled:opacity-60 transition-all resize-none"
              ></textarea>
            </div>

            {/* Action Buttons (Only show when editing) */}
            {isEditing && (
              <div className="md:col-span-2 flex justify-end gap-3 mt-4 animate-[fade-in-up_0.3s_ease-out]">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-pumpkin text-white font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-pumpkin/30"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Account;