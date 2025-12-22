import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Movie from './pages/Movie.jsx';
import Login from './pages/Login.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movie" element={<Movie />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default AppRoutes;
