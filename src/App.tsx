import SignInPage from "./pages/LoginForm";
import SignUpPage from "./pages/SignUpPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { Container } from "react-bootstrap";
import SettingsPage from "./pages/SettingsPage";
import MainLayout from "./compnents/common/MainLayout";

function App() {
  return (
    <Container>
      <title>Passkey Sample</title>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Container>
  );
}

export default App;
