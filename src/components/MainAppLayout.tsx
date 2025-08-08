
import React, { useState, useCallback, useEffect } from 'react';
import { User, TrackScanLog, ScanJob } from '../types';
import MainAppMenu from './MainAppMenu';
import ScanPage from './ScanPage';
import DashboardViewPage from './DashboardViewPage';
import JobConsole from './jobConsole/JobConsole';
import ProgressBar from './common/ProgressBar';
import AccountSettings from './AccountSettings';

interface MainAppLayoutProps {
  user: User;
  onLogout: () => void;
  previousScans: TrackScanLog[];
  jobs: ScanJob[];
  isAppDataLoading: boolean;
  appDataError: string | null;
  onRefreshAllData: () => void; // Callback to refresh all data
  onJobUpdate: (job?: ScanJob | Partial<ScanJob>) => void; // Callback after a job action
  onIndividualLogUpdate: (logId?: string) => void; // Callback after deleting a log
}

type ActiveView = 'dashboard' | 'scan' | 'jobs';

const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  user,
  onLogout,
  previousScans,
  jobs,
  isAppDataLoading,
  appDataError,
  onRefreshAllData,
  onJobUpdate,
  onIndividualLogUpdate,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [redirectToJobConsole, setRedirectToJobConsole] = useState<boolean>(false);
  const [showAccountSettings, setShowAccountSettings] = useState<boolean>(false);

  // redirect to job console when needed
  useEffect(() => {
    if (redirectToJobConsole) {
      setActiveView('jobs');
      setRedirectToJobConsole(false);
    }
  }, [redirectToJobConsole]);

  // creates job and redirects to console
  const handleJobCreated = useCallback((job?: ScanJob | Partial<ScanJob>) => {
    setRedirectToJobConsole(true);
    onJobUpdate(job);
  }, [onJobUpdate]);

  const getNavButtonClass = (viewType: ActiveView) => {
    const base = "px-3 py-1 text-black text-sm"; // VT323 default font size is larger
    // Apply Win95 border styles dynamically with enhanced 3D selection border
    const borderStyle = activeView === viewType
        ? 'win95-border-inset !shadow-none translate-x-[1px] translate-y-[1px] border-2 border-black/50 shadow-inner'
        : 'win95-border-outset hover:bg-gray-300';
    return `${base} ${borderStyle}`;
  };

  const totalJobs = jobs.length;
  const activeOrPendingJobs = jobs.filter(job =>
    job.status !== 'completed' &&
    job.status !== 'aborted' &&
    !job.status.startsWith('failed_') &&
    job.status !== 'completed_with_errors'
  ).length;


  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        minWidth: '100vw',
        width: '100%',
        overflow: 'hidden',
      }}
      className="flex flex-col items-center justify-start w-full"
    >
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }} className="flex flex-col items-center justify-start w-full">
        {/* Top navigation bar with Win95 border and margin */}
        <div
          className="mt-3 mb-4 flex justify-center w-full"
          style={{ width: '100%' }}
        >
        <nav
          className="flex items-center space-x-0.5 bg-[#C0C0C0] win95-border-outset px-2 py-1"
          style={{
            maxWidth: 1320, // slightly wider than before
            width: '99.5%', // slightly more horizontal space
            minWidth: 340,
            boxSizing: 'border-box',
            borderRadius: 0, // sharp corners for Win95 look
          }}
        >
        <button
          onClick={() => setActiveView('scan')}
          className={getNavButtonClass('scan')}
          aria-pressed={activeView === 'scan'}
        >
          New Scan Job
        </button>
        <button
          onClick={() => setActiveView('jobs')}
          className={getNavButtonClass('jobs')}
          aria-pressed={activeView === 'jobs'}
        >
          Job Console ({activeOrPendingJobs > 0 ? `${activeOrPendingJobs} Active / ` : ''}{totalJobs} Total)
        </button>
        <button
          onClick={() => setActiveView('dashboard')}
          className={getNavButtonClass('dashboard')}
          aria-pressed={activeView === 'dashboard'}
        >
          Dashboard ({previousScans.length} Logs)
        </button>
        <div className="flex-1" />
        <MainAppMenu
          onLogout={onLogout}
          onSpotifyConnect={() => window.open('https://accounts.spotify.com/en/login', '_blank')}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          user={user}
          navStyle={true}
        />
        </nav>
      </div>
      {isAppDataLoading && (
        <div className="p-4 win95-border-outset bg-[#C0C0C0] text-center mx-auto mt-2" style={{ maxWidth: 1250, width: '99%' }}>
          <ProgressBar text={`Loading ${activeView} data...`} />
          <p className="text-xs text-gray-700 text-center mt-1">This may take up to a minute.</p>
        </div>
      )}
      {appDataError && (
        <div className="p-3 win95-border-outset bg-yellow-200 text-black border border-black mb-2 mx-auto mt-2" style={{ maxWidth: 1250, width: '99%' }}>
          <p className="font-semibold text-center">Application Error:</p>
          <p className="text-center mb-1 whitespace-pre-line">{appDataError}</p>
          <div className="flex justify-center">
            <button onClick={onRefreshAllData} className="hover:bg-gray-300 px-3 py-1 win95-border-outset rounded">Retry Load</button>
          </div>
        </div>
      )}
      {!isAppDataLoading && !appDataError && (
        <div className="win95-border-outset bg-[#C0C0C0] mx-auto" style={{ maxWidth: 1250, width: '99%', minHeight: 400, marginBottom: 32, padding: 0 }}>
          <div className="p-2 sm:p-4">
            {activeView === 'scan' && (
              <ScanPage
                user={user}
                onJobCreated={handleJobCreated}
                onLogout={onLogout}
              />
            )}
            {activeView === 'jobs' && (
              <JobConsole
                jobs={jobs}
                onJobAction={onJobUpdate}
                isLoading={isAppDataLoading}
                onRefreshJobs={onRefreshAllData}
                onLogout={onLogout}
              />
            )}
            {activeView === 'dashboard' && (
              <DashboardViewPage
                user={user}
                previousScans={previousScans}
                jobs={jobs} // Pass jobs for filtering
                onDeleteScan={onIndividualLogUpdate}
                onClearAllScans={onRefreshAllData}
              />
            )}
          </div>
        </div>
      )}
      </div> {/* Close the content wrapper div */}

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          style={{ backdropFilter: 'blur(2px)' }}
        >
          <div className="w-full max-w-md px-4">
            <AccountSettings 
              user={user}
              onAccountDeleted={onLogout}
              onClose={() => setShowAccountSettings(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MainAppLayout);
