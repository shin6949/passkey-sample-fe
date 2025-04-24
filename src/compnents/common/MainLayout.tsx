import { memo } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const MainLayout = memo(() => {
  return (
    <div className="App">
      <div className="mb-5">
        <Header />
      </div>
      <div style={{ minHeight: "50vh" }}>
        <Outlet />
      </div>
      <div className="mt-5">
        <Footer />
      </div>
    </div>
  );
});

export default MainLayout;
