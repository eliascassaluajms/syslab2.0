import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/appRoutes';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;