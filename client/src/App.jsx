import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';

// Additional routes (login, register, request flow, student/provider/admin
// dashboards) get added here as we build each feature out.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
