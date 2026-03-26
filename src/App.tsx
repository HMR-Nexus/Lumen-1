import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { TechnicianLayout } from '@/components/layout/TechnicianLayout'
import { ContractorLayout } from '@/components/layout/ContractorLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { TechDashboard } from '@/pages/technician/TechDashboard'
import { ContractorDashboard } from '@/pages/contractor/ContractorDashboard'
import { ROUTES } from '@/config/routes'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* Technician routes */}
          <Route element={<ProtectedRoute allowedRoles={['technician']} />}>
            <Route element={<TechnicianLayout />}>
              <Route path={ROUTES.TECHNICIAN.DASHBOARD} element={<TechDashboard />} />
            </Route>
          </Route>

          {/* Contractor routes */}
          <Route element={<ProtectedRoute allowedRoles={['contractor']} />}>
            <Route element={<ContractorLayout />}>
              <Route path={ROUTES.CONTRACTOR.DASHBOARD} element={<ContractorDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
