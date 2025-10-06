import { useState } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import Feed from '../components/dashboard/Feed';
import Profile from '../components/dashboard/Profile';
import Explore from '../components/dashboard/Explore';
import Messages from '../components/dashboard/Messages';
import Notifications from '../components/dashboard/Notifications';

type View = 'feed' | 'profile' | 'explore' | 'messages' | 'notifications';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState<View>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const renderView = () => {
    switch (currentView) {
      case 'feed':
        return <Feed onProfileClick={(userId) => { setSelectedUserId(userId); setCurrentView('profile'); }} />;
      case 'profile':
        return <Profile userId={selectedUserId} />;
      case 'explore':
        return <Explore onProfileClick={(userId) => { setSelectedUserId(userId); setCurrentView('profile'); }} />;
      case 'messages':
        return <Messages />;
      case 'notifications':
        return <Notifications onProfileClick={(userId) => { setSelectedUserId(userId); setCurrentView('profile'); }} />;
      default:
        return <Feed onProfileClick={(userId) => { setSelectedUserId(userId); setCurrentView('profile'); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex pt-16">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />

        <main className="flex-1 ml-0 lg:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
