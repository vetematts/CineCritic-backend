import './App.css';
import AppRoutes from './AppRoutes.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main>
          <AppRoutes />
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
