import { Navigate, createBrowserRouter } from 'react-router-dom';
import { isAuthenticated } from './auth/storage';
import { RequireAuth } from './components/RequireAuth';
import { EventDetailPage } from './pages/EventDetailPage';
import { LoginPage } from './pages/LoginPage';

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? '/events/1' : '/login'} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/events/:eventId',
        element: <EventDetailPage />,
      },
    ],
  },
  {
    path: '*',
    element: <RootRedirect />,
  },
]);
