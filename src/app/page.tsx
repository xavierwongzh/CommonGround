'use client';

import { AppProvider } from '@/context/AppContext';
import { TopBar } from '@/components/TopBar';
import { LocationSidebar } from '@/components/LocationSidebar';
import { MapView } from '@/components/MapView';
import { RightPanel } from '@/components/RightPanel';
import { ToastContainer } from '@/components/ToastContainer';

export default function Home() {
  return (
    <AppProvider>
      <div className="flex flex-col h-full">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <LocationSidebar />
          <MapView />
          <RightPanel />
        </div>
      </div>
      <ToastContainer />
    </AppProvider>
  );
}
