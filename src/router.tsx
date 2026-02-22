import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { EventDetailPage } from './pages/EventDetailPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { QueuePage } from './pages/QueuePage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';

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
    path: '/events/:eventId',
    element: <EventDetailPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/events/:eventId/seats',
        element: <SeatSelectionPage />,
      },
      {
        path: '/events/:eventId/seats/queue',
        element: <QueuePage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
