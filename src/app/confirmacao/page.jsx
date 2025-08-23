'use client'

import { useState } from "react";

// Ícone CheckCircle2 de Lucide React substituído por SVG
const CheckCircle2 = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

export default function ConfirmacaoForm() {
  // A navegação foi alterada para usar window.location.href, que é mais compatível
  // com a estrutura de página do Next.js sem a necessidade de um roteador externo.
  const navigate = (path) => { window.location.href = path; };
  
  // Função para lidar com o submit
  function handleSubmit(event) {
    event.preventDefault();
    navigate("/check"); // Redireciona para a página de check-in
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full justify-center items-center p-4">
      {/* Container que substitui o Card e o alinhamento */}
      <div className="text-center border-none relative w-full max-w-sm">

        {/* Botão de logout no canto superior direito */}
        <button
          onClick={() => (window.location.href = "/")}
          className="absolute right-2 top-0 md:top-4 cursor-pointer bg-[#394779] text-white hover:bg-[#3d4381] px-4 py-2 rounded-md"
        >
          Encerrar Sessão
        </button>
        
        {/* Logo do app */}
        <div className="w-fit mx-auto">
          <img
            src="/vibe-check-logo.png"
            alt="Logo Vibe Check"
            className="mx-auto mt-8 h-40 w-40"
          />
        </div>

        {/* Mensagem de confirmação que substitui CardHeader */}
        <div>
          <h2 className="text-xl font-semibold text-white">
            Vibe Check finalizada com sucesso!
          </h2>
        </div>

        {/* Ícone de sucesso que substitui CardContent */}
        <div>
          <div className="flex flex-col gap-6 mb-5">
            <CheckCircle2
              className="mx-auto h-32 w-32 stroke-[1.5] text-green-600 animate-pulse"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <button
                type="submit"
                className="w-full cursor-pointer bg-[#394779] text-white border-none hover:bg-[#3d4381] flex items-center justify-center gap-2 px-4 py-2 rounded-md"
              >
                Iniciar outra prática
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}