import { AdminAuthProvider } from './contexts/AdminAuthContext';
import AppRouter from './router/AppRouter';
import './App.css';

function App() {
  return (
    <AdminAuthProvider>
      <AppRouter />
    </AdminAuthProvider>
  );
}

export default App;
