import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TestPage from './pages/TestPage';
import ResultPage from './pages/ResultPage';
import SharePage from './pages/SharePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/share" element={<SharePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
