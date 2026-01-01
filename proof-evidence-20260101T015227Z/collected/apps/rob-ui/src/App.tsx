import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RobPage from './pages/RobPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/rob" replace />} />
        <Route path="/rob" element={<RobPage />} />
      </Routes>
    </BrowserRouter>
  );
}
