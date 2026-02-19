import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { EventDetailPage } from './pages/EventDetailPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { QueuePage } from './pages/QueuePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
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
      {
        path: '/events/:eventId/queue',
        element: <QueuePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
