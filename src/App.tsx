import { HashRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/hooks/useToast'
import MainLayout from '@/layouts/MainLayout'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'

import Home from '@/pages/Home'
import Gallery from '@/pages/Gallery'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Profile from '@/pages/Profile'
import AccessDenied from '@/pages/AccessDenied'
import NotFound from '@/pages/NotFound'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminPhotos from '@/pages/admin/AdminPhotos'
import AdminSettings from '@/pages/admin/AdminSettings'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/access-denied" element={<AccessDenied />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Route>

            <Route
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/photos" element={<AdminPhotos />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
