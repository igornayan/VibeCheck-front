'use client'

import { useState } from "react";

// Função auxiliar para definir cookies sem usar biblioteca externa
const setCookie = (name, value, expires) => {
  const date = new Date();
  date.setTime(date.getTime() + (expires * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
};

// Função auxiliar para obter o valor de um cookie
const getCookie = (name) => {
  const cookieName = `${name}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(cookieName) === 0) {
      return c.substring(cookieName.length, c.length);
    }
  }
  return "";
};

// Função auxiliar para remover um cookie
const removeCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Ícone Info do Lucide React substituído por SVG
const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);


// Componente principal EmojiForm
export default function EmojiForm({ className, ...props }) {
  // Estado para armazenar qual emoji está selecionado (id do emoji)
  const [selected, setSelected] = useState(null);
  const [isInfoPopoverOpen, setIsInfoPopoverOpen] = useState(false);

  // Array contendo os emojis disponíveis
  const emojis = [
    { id: "1", label: "Muito Feliz", src: "/1.svg" },
    { id: "2", label: "Feliz", src: "/2.svg" },
    { id: "3", label: "Desmotivado", src: "/3.svg" },
    { id: "4", label: "Indiferente", "src": "/4.svg" },
    { id: "5", label: "Surpreso", "src": "/5.svg" },
    { id: "6", label: "Triste", "src": "/6.svg" },
    { id: "7", label: "Irritado", "src": "/7.svg" },
    { id: "8", label: "Ansioso", "src": "/8.svg" },
    { id: "9", label: "Apaixonado", "src": "/9.svg" },
  ];

  // Função para enviar o emoji selecionado para o backend
  async function handleSubmit(event) {
    event.preventDefault(); // Evita recarregar a página no submit

    if (!selected) return; // Se nenhum emoji selecionado, não faz nada

    // Pega o código da avaliação do cookie armazenado no navegador
    const codigo = getCookie("codigo_avaliacao");

    // Se o cookie não existir, alerta o usuário para voltar e inserir código
    if (!codigo) {
      alert("Código de avaliação não encontrado. Por favor, volte e insira novamente.");
      return;
    }

    try {
      // Envia requisição POST para registrar a emoção
      const response = await fetch(
        `http://localhost:8080/api/registro/registrar?codigo=${codigo}&emocao=${parseInt(selected)}`,
        {
          method: "POST",
          credentials: "include", // Envia cookies junto com a requisição
        }
      );

      // Se o servidor retornar erro, lança exceção para tratar no catch
      if (!response.ok) {
        throw new Error("Erro ao registrar emoção");
      }

      // Remove o cookie de código após registro bem-sucedido
      removeCookie("codigo_avaliacao");

      // Redireciona o usuário para página de confirmação
      window.location.href = "/confirmacao";
    } catch (error) {
      // Loga erro no console e avisa usuário com alert
      console.error("Erro ao enviar emoção:", error);
      alert("Erro ao registrar emoção. Tente novamente.");
    }
  }

  return (
    // Container principal com classes de estilo e props adicionais
    <div className={`relative flex flex-col gap-6 ${className}`} {...props}>
      {/* Barra superior contendo botão voltar e botão logout */}
      <div className="flex flex-row justify-between items-center w-full">
        {/* Botão para voltar à tela inicial/login */}
        <button
          className="text-white cursor-pointer hover:bg-transparent mt-1 ml-4 p-2 rounded-full"
          aria-label="Voltar para login"
          onClick={() => window.location.href = "/"}
        >
          {/* Ícone SVG da seta para voltar */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Botão para encerrar sessão, leva para raiz ("/") */}
        <button
          onClick={() => (window.location.href = "/")}
          className="absolute top-1 right-2 cursor-pointer bg-[#394779] text-white hover:bg-[#3d4381] px-4 py-2 rounded-md"
        >
          Encerrar Sessão
        </button>
      </div>

      {/* Card principal contendo logo, título, explicação e emojis */}
      <div className="border-none">
        {/* Logo centralizado */}
        <img
          src="/vibe-check-logo.png"
          alt="Logo"
          className="mx-auto mb-4 h-48 w-48"
        />
        <div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              {/* Texto explicativo para o usuário */}
              <span className="text-white">
                Qual emoji representa suas emoções agora?
              </span>

              {/* Popover que mostra explicação ao clicar no ícone de informação */}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Informações sobre emojis"
                  onClick={() => setIsInfoPopoverOpen(!isInfoPopoverOpen)}
                >
                  <InfoIcon className="w-5 h-5 text-[#fff] cursor-pointer" />
                </button>
                {isInfoPopoverOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white text-black border border-[#394779] p-4 rounded-md shadow-lg w-72 z-50">
                    <p className="text-sm">
                      Esse emoji nos ajuda a entender suas emoções antes/depois da prática.
                      <br />
                      <strong>Escolha com sinceridade.</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Formulário com seleção de emoji e botão enviar */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Grade 3x3 para exibir todos os emojis */}
            <div className="grid grid-cols-3 gap-4">
              {emojis.map((emoji) => (
                <button
                  key={emoji.id}
                  type="button" // Botões não submetem o formulário ao clicar
                  onClick={() => setSelected(emoji.id)} // Seleciona o emoji clicado
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border
                    ${selected === emoji.id ? "bg-[#394779] border-[#394779]" : "bg-[#4A4A4A] border-[#394779]"}
                    hover:brightness-110 transition cursor-pointer`}
                >
                  {/* Imagem do emoji */}
                  <img src={emoji.src} alt={emoji.label} className="w-12 h-12" />
                  {/* Label/texto do emoji */}
                  <span className="font-bold text-xs text-[#fff] text-center break-words whitespace-normal max-w-[90px]">
                    {emoji.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Botão enviar desabilitado se nenhum emoji selecionado */}
            <div className="flex flex-col gap-3 mt-6">
              <button
                type="submit"
                className="w-full cursor-pointer px-4 py-2 rounded-md bg-[#394779] text-white hover:bg-[#5c6bc0] disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={!selected} // Desabilita se selected for null
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}