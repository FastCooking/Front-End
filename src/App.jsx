import TelaLogin from './pages/Login';

import {BrowserRouter, Routes, Route} from 'react-router-dom';

import TelaGarcom from './pages/TelaGarcom';
import TelaCozinha from './pages/TelaCozinha';
import TelaAdministrador from './pages/TelaAdministrador';
import LandingPage from './pages/LandingPage';

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<TelaLogin />} />
        <Route path="/garcom" element={<TelaGarcom />} />
        <Route path="/cozinha" element={<TelaCozinha />} />
        <Route path="/administrativo" element={<TelaAdministrador />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;