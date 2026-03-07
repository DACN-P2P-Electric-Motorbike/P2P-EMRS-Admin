import { useState } from 'react';
import authService from '../Service/authService'; // Import service đã tạo
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const { login } = useAuth();
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const handleSubmit = async (e) => {
  e.preventDefault();
  if (isLoading) return;

  // --- Logic Validation Giữ Nguyên ---
  const newErrors = {};
  if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
  if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    return;
  }

  // ... (phần kiểm tra email, password của bạn)
  setIsLoading(true);

  try {
    // Gọi login từ service
    const data = await authService.login(formData.email, formData.password);
    console.log('Login data:', data);

      if (data.accessToken) {
        // Lưu vào bộ nhớ (Context) thay vì localStorage
        login(data.user, data.accessToken);

        setIsSuccess(true);
        setTimeout(() => {
          navigate('/'); // Dùng useNavigate của react-router-dom
        }, 1500);
      }
  } catch (err) {
    // Nhận lỗi từ throw trong service
    console.error('Login error:', err);
    setErrors({
      email: err.message || 'Login failed',
      password: ' '
    });
    setShake(true);
    setTimeout(() => setShake(false), 500);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="
      font-sans min-h-screen w-full flex items-center justify-center p-5
      bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)]
    ">
      <div className={`
        w-full max-w-105 perspective-[1000px]
        ${shake ? 'animate-shake' : ''}
      `}>
        {/* Glassmorphism Card */}
        <div className="
          relative overflow-hidden
          bg-white/10 backdrop-blur-xl border border-white/20
          rounded-3xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]
          transition-all duration-500
          hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]
        ">
          
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent opacity-0 transition-all duration-500 hover:opacity-100 hover:animate-[slide_1s_ease-in-out_infinite]" />

          {isSuccess ? (
            /* Success State */
            <div className="text-center py-10 animate-[fade-in-up_0.5s_ease-out]">
              <div className="w-[60px] h-[60px] bg-green-500 rounded-full flex items-center justify-center mx-auto mb-5 text-white text-2xl shadow-lg shadow-green-500/30">
                ✓
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">Login Successful!</h3>
              <p className="text-white/80">Redirecting to dashboard...</p>
            </div>
          ) : (
            /* Login Form */
            <>
              <div className="text-center mb-8">
                <h2 className="text-[2rem] font-bold text-white mb-2 drop-shadow-sm">Welcome Back</h2>
                <p className="text-white/80 text-base">Sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* --- Input Group Component --- */}
                {[
                  { id: 'email', type: 'email', label: 'Email Address' },
                  { id: 'password', type: showPassword ? 'text' : 'password', label: 'Password', isPass: true }
                ].map((field) => (
                  <div key={field.id} className="mb-6 relative group">
                    <div className="relative flex flex-col">
                      {/* Input Field */}
                      <input 
                        type={field.type}
                        id={field.id}
                        name={field.id}
                        value={formData[field.id]}
                        onChange={handleInputChange}
                        required
                        placeholder=" " 
                        className={`
                          peer w-full px-4 py-4 pt-5 pb-2 
                          bg-white/10 border rounded-xl text-white text-base
                          outline-none backdrop-blur-md transition-all duration-300
                          placeholder-shown:pt-4 placeholder-shown:pb-4
                          focus:bg-white/15 focus:-translate-y-0.5 focus:shadow-[0_8px_25px_rgba(6,182,212,0.2)]
                          ${errors[field.id] 
                            ? 'border-red-500 bg-red-500/10' 
                            : 'border-white/20 focus:border-[#06b6d4]'}
                        `}
                      />
                      
                      {/* Floating Label (Sử dụng kỹ thuật Peer) */}
                      <label 
                        htmlFor={field.id}
                        className={`
                          absolute left-4 top-4 text-white/70 text-base pointer-events-none transition-all duration-300 origin-[0]
                          peer-focus:-translate-y-3 peer-focus:scale-85 peer-focus:text-[#06b6d4] peer-focus:font-medium
                          peer-not-placeholder-shown:-translate-y-3 peer-not-placeholder-shown:scale-85
                          ${errors[field.id] ? 'text-red-400' : ''}
                        `}
                      >
                        {field.label}
                      </label>

                      {/* Password Toggle */}
                      {field.isPass && (
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1"
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          )}
                        </button>
                      )}

                      {/* Animated Bottom Border */}
                      <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-gradient-to-r from-[#06b6d4] to-[#6366f1] transition-all duration-300 -translate-x-1/2 peer-focus:w-full rounded-full"></span>
                    </div>
                    
                    {/* Error Message */}
                    <span className={`block text-red-400 text-xs font-medium mt-1.5 ml-1 transition-all duration-300 ${errors[field.id] ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                      {errors[field.id]}
                    </span>
                  </div>
                ))}

                {/* Options: Remember & Forgot Pass */}
                <div className="flex flex-wrap justify-between items-center mb-8 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      name="remember"
                      checked={formData.remember}
                      onChange={handleInputChange}
                      className="hidden peer"
                    />
                    <div className="w-[18px] h-[18px] border-2 border-white/30 rounded flex items-center justify-center bg-white/10 backdrop-blur-md transition-all duration-300 peer-checked:bg-[#06b6d4] peer-checked:border-[#06b6d4] peer-checked:scale-110 group-hover:border-white/50">
                      <span className="text-white text-[11px] font-bold opacity-0 peer-checked:opacity-100">✓</span>
                    </div>
                    <span className="text-white/90 text-sm select-none group-hover:text-white transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-[#06b6d4] text-sm font-medium relative hover:text-white transition-colors after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-[#06b6d4] after:transition-all hover:after:w-full">
                    Forgot password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full py-4 px-6 rounded-xl text-white font-semibold text-base
                    bg-gradient-to-br from-[#6366f1] to-[#06b6d4]
                    shadow-[0_4px_15px_rgba(99,102,241,0.4)]
                    relative overflow-hidden transition-all duration-300
                    hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.6)]
                    active:translate-y-0
                    disabled:opacity-80 disabled:cursor-not-allowed
                    before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full
                    before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
                    before:transition-all before:duration-500 hover:before:left-[100%]
                  "
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>


              {/* Social Buttons */}
              <div className="flex gap-3 mb-6">
                
              </div>

              <div className="text-center">
                <p className="text-white/80 text-sm">
                  Don't have an account? <a href="#" className="text-[#06b6d4] font-medium hover:text-white hover:underline transition-colors">Sign up</a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;