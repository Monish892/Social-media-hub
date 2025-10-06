import { Bell, Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: any) => void;
}

const Header = ({ currentView, onViewChange }: HeaderProps) => {
  const { profile, signOut } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden text-slate-300 hover:text-cyan-400 transition-colors"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            SocialHub
          </h1>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, posts..."
              onClick={() => onViewChange('explore')}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onViewChange('notifications')}
            className="relative p-2 text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <Bell className="w-6 h-6" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {profile?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2">
                <button
                  onClick={() => { onViewChange('profile'); setShowUserMenu(false); }}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  My Profile
                </button>
                <button
                  onClick={signOut}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
