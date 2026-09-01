import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/i18n';
import { classNames } from '@/lib/utils';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, lang } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/app/overview', icon: LayoutDashboard, label: t('overview', lang) },
    { to: '/app/admin-reports', icon: ClipboardList, label: t('reports', lang) },
    { to: '/app/admin-workers', icon: Users, label: t('workers', lang) },
    { to: '/app/admin-departments', icon: Building2, label: t('departments', lang) },
    { to: '/app/admin-analytics', icon: BarChart3, label: t('analytics', lang) },
    { to: '/app/admin-settings', icon: Settings, label: t('settings', lang) },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 font-bold text-white">
            O
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">OorFix</div>
            <div className="text-[10px] text-slate-400">Admin Console</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2">
            <div className="text-xs font-semibold text-slate-700">{profile?.name}</div>
            <div className="text-[10px] text-slate-400">{profile?.ward}</div>
          </div>
          <button
            onClick={() => {
              signOut();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            {t('logout', lang)}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 font-bold text-white">
              O
            </div>
            <span className="text-sm font-bold">OorFix Admin</span>
          </div>
          <div className="hidden text-sm text-slate-500 md:block">
            {profile?.ward || 'All wards'}
          </div>
          <div className="flex items-center gap-2">
            <button className="relative rounded-lg p-2 hover:bg-slate-100" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="hidden text-right md:block">
                <div className="text-xs font-semibold text-slate-700">{profile?.name}</div>
                <div className="text-[10px] text-slate-400">Admin</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                {profile?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* mobile nav */}
        <nav className="flex overflow-x-auto border-b border-slate-200 bg-white px-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-medium',
                  isActive ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-500'
                )
              }
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
