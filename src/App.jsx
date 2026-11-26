import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PageLoader } from "./components/ui/Spinner";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const TelaLogin = lazy(() => import("./pages/Login"));
const TelaAutoatendimento = lazy(() => import("./pages/TelaAutoatendimento"));
const TelaInsumo = lazy(() => import("./pages/TelaInsumo"));
const TelaGarcom = lazy(() => import("./pages/TelaGarcom"));
const TelaCozinha = lazy(() => import("./pages/TelaCozinha"));
const TelaAdministrador = lazy(() => import("./pages/TelaAdministrador"));
const TelaGerente = lazy(() => import("./pages/TelaGerente"));
const OrderTracking = lazy(() => import("./pages/OrderTracking/OrderTracking"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<TelaLogin />} />
          <Route path="/cardapio" element={<TelaAutoatendimento />} />
          <Route path="/autoatendimento" element={<TelaAutoatendimento />} />
          <Route
            path="/autoatendimento/mesa/:idMesa"
            element={<TelaAutoatendimento />}
          />
          <Route path="/insumo" element={<TelaInsumo />} />
          <Route path="/garcom" element={<TelaGarcom />} />
          <Route path="/cozinha" element={<TelaCozinha />} />
          <Route path="/administrativo" element={<TelaAdministrador />} />
          <Route path="/gerente" element={<TelaGerente />} />
          <Route path="/tracking/:orderId" element={<OrderTracking />} />
          <Route path="/tracking" element={<OrderTracking />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
