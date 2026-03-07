import ReactDOM from 'react-dom/client'
import App from './App.jsx';
import { SidebarProvider } from './context/sidebarContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <SidebarProvider>
    <AuthProvider> {/* BẮT BUỘC: Mọi thứ dùng useAuth phải nằm trong này */}
      <App />
    </AuthProvider>
  </SidebarProvider>
)
