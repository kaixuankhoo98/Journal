import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout';
import { CalendarContainer } from './features/calendar/components';
import { TaskForm } from './features/tasks/components';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <CalendarContainer />
      </MainLayout>
      <TaskForm />
    </QueryClientProvider>
  );
}

export default App;
