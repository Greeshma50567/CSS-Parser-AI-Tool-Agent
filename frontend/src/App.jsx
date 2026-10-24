import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EntrancePage from './modules/hub/EntrancePage';
import HomePage from './modules/hub/HomePage';
import Milestone1Page from './modules/milestone1/Milestone1Page';
import Milestone2Page from './modules/milestone2/Milestone2Page';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Module 0: Entry Gateway with Celestial Sky & Animated Action Button */}
        <Route path="/" element={<EntrancePage />} />

        {/* Module Hub: Multi-Milestone Platform Dashboard */}
        <Route path="/milestones" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/milestones" replace />} />

        {/* Module 1: Deterministic CSS Parser & Groq Auditor */}
        <Route path="/milestone-1" element={<Milestone1Page />} />

        {/* Module 2: Grounded Function-Calling AI Agent */}
        <Route path="/milestone-2" element={<Milestone2Page />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
