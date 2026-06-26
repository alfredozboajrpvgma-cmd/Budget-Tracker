import { lazy, Suspense } from 'react';
import { Box } from '@mui/material';
import LazyFallback from './LazyFallback';

const Dashboard = lazy(() => import('./Dashboard'));
const AnalyticsView = lazy(() => import('./AnalyticsView'));
const TransactionsView = lazy(() => import('./TransactionsView'));
const ProfileView = lazy(() => import('./ProfileView'));
const GoalsView = lazy(() => import('./GoalsView'));

interface ViewContainerProps {
  currentView: string;
  addGoalTrigger?: number;
  addExpenseTrigger?: number;
}

const ViewContainer = ({ currentView, addGoalTrigger = 0, addExpenseTrigger = 0 }: ViewContainerProps) => {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Suspense fallback={<LazyFallback minHeight={320} />}>
        {currentView === 'home' && <Dashboard />}
        {currentView === 'goals' && <GoalsView addTrigger={addGoalTrigger} />}
        {currentView === 'analytics' && <AnalyticsView />}
        {currentView === 'profile' && <ProfileView />}
      </Suspense>
      <Suspense fallback={null}>
        <TransactionsView addTrigger={addExpenseTrigger} />
      </Suspense>
    </Box>
  );
};

export default ViewContainer;
