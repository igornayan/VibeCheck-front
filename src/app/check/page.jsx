'use client'

import { useState } from "react"

// Função auxiliar para definir cookies sem usar biblioteca externa
const setCookie = (name, value, expires) => {
    const date = new Date();
    date.setTime(date.getTime() + (expires * 60 * 60 * 1000)); // expires em minutos
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
};

// Componente principal: tela de check-in do aluno
export default function AlunoCheckIn({ className }) {
    const [codigo, setCodigo] = useState("");
    const [errors, setErrors] = useState({});

    // Função auxiliar para limpar erro de um campo específico
    const clearError = (field) => {
        if (errors[field]) {
            setErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Função para encerrar a sessão (logout)
    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:8080/logout", {
                method: "POST",
                credentials: "include", // inclui cookies na requisição
            });

            if (response.ok) {
                window.location.href = "/"; // redireciona para a página inicial (login)
            } else {
                console.error("Erro ao fazer logout");
            }
        } catch (err) {
            console.error("Erro durante logout:", err);
        }
    };

    // Função chamada quando o formulário é submetido
    const handleSubmit = async (event) => {
        event.preventDefault(); // evita recarregamento da página

        const newErrors = {};

        // Validação: campo obrigatório
        if (!codigo.trim()) {
            newErrors.codigo = "Por favor, informe um código válido.";
        }

        setErrors(newErrors); // define os erros encontrados

        // Se houver erros, cancela a execução
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        // Requisição para verificar se o código é válido
        try {
            const response = await fetch(`http://localhost:8080/api/registro/verificar-codigo?codigo=${codigo}`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Erro ao verificar o código");
            }

            const valido = await response.json(); // espera um boolean

            if (valido) {
                // Armazena o código em cookie por cerca de 30 minutos (0.5 horas)
                setCookie("codigo_avaliacao", codigo, 0.5);
                window.location.href = "/emoji"; // redireciona para a tela de avaliação com emojis
            } else {
                setErrors({ codigo: "Código inválido ou expirado." });
            }

        } catch (error) {
            console.error("Erro ao verificar código:", error);
            setErrors({ codigo: "Erro ao verificar o código. Tente novamente." });
        }
    };

    // JSX da interface do componente
    return (
        <div className={`relative flex flex-col gap-6 ${className}`}>

            {/* Botão de voltar (ícone de seta) */}
            <button
                className="text-white cursor-pointer hover:bg-transparent absolute top-1 left-4 z-10 p-2 rounded-full"
                aria-label="Voltar para login"
                onClick={() => window.location.href = "/"}
            >
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

            {/* Botão de logout no canto superior direito */}
            <button
                onClick={handleLogout}
                className="absolute top-1 right-2 cursor-pointer bg-[#394779] text-white hover:bg-[#3d4381] px-4 py-2 rounded-md"
            >
                Encerrar Sessão
            </button>

            <div className="flex flex-col justify-center items-center h-screen mt-[-50px]">
                {/* Logo */}
                <img
                    src="/vibe-check-logo.png"
                    alt="Logo"
                    className="mb-4 h-48 w-48"
                />

                <div className="bg-slate-700 rounded-lg w-11/12">
                    <div className="p-6">
                        <h1 className="text-white text-2xl font-bold">Vamos Iniciar</h1>
                        <p className="text-white text-sm">
                            Coloque o código que o professor compartilhou
                        </p>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-6">
                                <div className="grid gap-2">
                                    {/* Label do campo */}
                                    <label className="text-white" htmlFor="codigo">
                                        Código
                                    </label>

                                    {/* Campo de entrada do código */}
                                    <input
                                        id="codigo"
                                        type="text"
                                        placeholder="Código"
                                        value={codigo}
                                        onChange={(e) => {
                                            setCodigo(e.target.value)
                                            clearError("codigo") // limpa o erro ao digitar
                                        }}
                                        className={`rounded-lg bg-[#4A4A4A] placeholder:text-[#A0A0A0] text-white border border-[#394779] focus:border-[#5c6bc0] outline-none p-3 ${errors.codigo ? "border-red-500" : ""}`}
                                        required
                                    />

                                    {/* Exibição de erro abaixo do input */}
                                    {errors.codigo && (
                                        <p className="text-sm text-red-500 mt-1">{errors.codigo}</p>
                                    )}
                                </div>
                            </div>

                            {/* Botão de envio do formulário */}
                            <button
                                type="submit"
                                className="w-full bg-[#394779] text-white hover:bg-[#3d4381] cursor-pointer px-4 py-2 rounded-md"
                            >
                                Enviar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}