import React, { useEffect, useState } from "react";
import LoginForm from "@/pages/login/LoginForm";
import RegisterForm from "@/pages/login/RegisterForm";

const AuthSlider = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleToggle = () => setIsRegister((prev) => !prev);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cargar el CSS del slider desde /public/styles/AuthSlider.css
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/styles/AuthSlider.css";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // --- Mobile: apilado con botón para alternar ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#bcc2c9] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {isRegister ? <RegisterForm /> : <LoginForm />}
        </div>
        <button
          onClick={handleToggle}
          className="mt-4 text-white border-white border px-4 py-2 rounded hover:bg-white hover:text-[#bcc2c9] transition"
        >
          {isRegister ? "Iniciar Sesión" : "Registrarse"}
        </button>
      </div>
    );
  }

  // --- Desktop: slider con scroll interno por panel ---
  return (
    <div className="min-h-screen bg-[#bcc2c9] flex items-center justify-center p-4">
      <div className={`slider-container ${isRegister ? "right-panel-active" : ""}`}>
        {/* Login */}
        <div className="form-container sign-in-container">
          <div className="panel-inner">
            <LoginForm />
          </div>
        </div>

        {/* Registro */}
        <div className="form-container sign-up-container">
          <div className="panel-inner">
            <RegisterForm />
          </div>
        </div>

        {/* Overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>¡Bienvenido de nuevo!</h1>
              <p>Para mantenerse conectado, por favor inicie sesión con su información personal</p>
              <button className="ghost" onClick={handleToggle}>
                Iniciar Sesión
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>¡Hola!</h1>
              <p>Ingrese sus datos personales y comience su viaje con nosotros</p>
              <button className="ghost" onClick={handleToggle}>
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSlider;
