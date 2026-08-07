import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './router/AppRouter';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
