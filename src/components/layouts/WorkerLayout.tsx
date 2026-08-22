import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, Home, LogOut, ClipboardList, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/lib/i18n';
import { classNames } from '@/lib/utils';

export function WorkerLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, lang } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/app/tasks', icon: ClipboardList, label: t('myTasks', lang) },
    { to: '/app/tasks-map', icon: MapPin, label: t('nearby', lang) },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 bg-blue-700 text-white shadow-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 font-bold">
              O
            </div>
            <div>
              <div className="text-base font-bold leading-none">OorFix Worker</div>
              <div className="text-[10px] text-blue-100">{profile?.name || 'Worker'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg p-2 hover:bg-white/10" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <button
              onClick={() => {
                signOut();
                navigate('/login');
              }}
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                classNames(
                  'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium',
                  isActive ? 'text-blue-600' : 'text-slate-500'
                )
              }
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/app/home"
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-slate-500"
          >
            <Home size={22} />
            <span>{t('home', lang)}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
