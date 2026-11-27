
import { Navigate, Route, Routes } from 'react-router-dom'
import { Sidebar, MobileNav } from '@/components/layout/Layout'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import type { UserRole } from '@/types'

import ResetPasswordPage from '@/features/auth/ResetPasswordPage'
import LoginPage from '@/features/auth/LoginPage'
import RegisterPage from '@/features/auth/registerpage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import StudentsPage from '@/features/students/StudentsPage'
import ClassesPage from '@/features/classes/ClassesPage'
import FeesPage from '@/features/fees/FeesPage'
import AttendancePage from '@/features/attendance/AttendancePage'
import GradesPage from '@/features/grades/GradesPage'
import HomeworkPage from '@/features/homework/HomeworkPage'
import MessagesPage from '@/features/messages/MessagesPage'
import TimetablePage from '@/features/timetable/TimetablePage'
import UsersAdminPage from '@/features/settings/UsersAdminPage'

import SuperAdminDashboard from '@/features/super-admin/SuperAdminDashboard'
import SchoolsManagementPage from '@/features/super-admin/SchoolsManagementPage'
import UsersManagementPage from '@/features/super-admin/UsersManagementPage'

const ALL_ROLES: UserRole[] = [
  'admin',
  'enseignant',
  'parent',
  'eleve',
  'secretariat',
]

function AppShell() {
  return (
    <div className="flex min-h-screen bg-[var(--color-ivory)]">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Routes>
          {/* Administration Super Admin */}
          <Route element={<ProtectedRoute requireSuperAdmin />}>
            <Route
              path="/super-admin"
              element={<SuperAdminDashboard />}
            />
            <Route
              path="/super-admin/schools"
              element={<SchoolsManagementPage />}
            />
            <Route
              path="/super-admin/users"
              element={<UsersManagementPage />}
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute roles={ALL_ROLES} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/messages" element={<MessagesPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'secretariat']} />}>
            <Route path="/students" element={<StudentsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'enseignant']} />}>
            <Route path="/classes" element={<ClassesPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'enseignant', 'eleve']} />}>
            <Route path="/timetable" element={<TimetablePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'enseignant', 'secretariat', 'parent', 'eleve']} />}>
            <Route path="/grades" element={<GradesPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'enseignant', 'parent', 'eleve']} />}>
            <Route path="/homework" element={<HomeworkPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'enseignant', 'parent']} />}>
            <Route path="/attendance" element={<AttendancePage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'secretariat', 'parent']} />}>
            <Route path="/fees" element={<FeesPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/settings" element={<UsersAdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      <MobileNav />
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Routes protégées */}
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppShell />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
