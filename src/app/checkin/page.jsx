"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Util simples para juntar classes
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const API_BASE = "http://localhost:8080";

// Modal simples para confirmação (Tailwind puro)
function ModalConfirm({ isOpen, onConfirm, onCancel, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="max-w-xs rounded-md bg-[#4A4A4A] p-6 text-white shadow-lg">
        <p className="mb-4 text-center">{message}</p>
        <div className="flex justify-around">
          <button
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={onConfirm}
          >
            Sim
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            onClick={onCancel}
          >
            Não
          </button>
        </div>
      </div>
    </div>
  );
}

// Ícones inline (evita dependência externa)
function PencilIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.313l-4.5 1.125 1.125-4.5L16.862 3.487z" />
    </svg>
  );
}
function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.916 21.75H8.084a2.25 2.25 0 0 1-2.245-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.955-2.134-2.134-2.134h-3.232A2.134 2.134 0 0 0 8.7 3.917v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

// Cartão de sucesso simples
function SuccessCard({ codigo }) {
  return (
    <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
      <p className="text-sm">Código de check-in gerado:</p>
      <p className="mt-1 text-xl font-semibold text-emerald-300">{codigo}</p>
    </div>
  );
}

export default function CheckIn({ className, searchParams, ...props }) {
  const router = useRouter();

  const [codigoGerado, setCodigoGerado] = useState(null);
  const [turma, setTurma] = useState("");
  const [turmas, setTurmas] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const containerRef = useRef(null);

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const loadTurmas = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/codigo/turmas`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao buscar turmas");
      const turmasApi = await response.json();
      const turmasValidas = turmasApi.filter(
        (t) => t.id !== 0 && String(t.nome).toLowerCase() !== "string"
      );
      setTurmas(turmasValidas.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
    }
  }, []);

  // Fecha lista ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsListOpen(false);
        setEditIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        router.push("/");
      } else {
        console.error("Erro ao fazer logout");
      }
    } catch (err) {
      console.error("Erro durante logout:", err);
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();

    const newErrors = {};
    if (!turma.trim()) newErrors.turma = "Por favor, selecione ou crie uma turma.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/codigo/liberar-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nomeTurma: turma }),
      });
      if (!response.ok) throw new Error("Erro ao gerar código de check-in");
      const data = await response.json();
      setCodigoGerado(data.codigo);
      setTurma("");
      setErrors({});
    } catch (error) {
      console.error("Erro ao gerar código de check-in:", error);
      setErrors((prev) => ({ ...prev, geral: "Falha ao liberar check-in. Tente novamente." }));
    } finally {
      setIsLoading(false);
    }
  }

  const turmasFiltradas = turmas.filter((t) => t.nome.toLowerCase().includes(turma.toLowerCase()));

  const iniciarEdicao = (index) => {
    setEditIndex(index);
    setEditValue(turmasFiltradas[index].nome);
    setIsListOpen(true);
  };

  const confirmarEdicao = async () => {
    if (editValue.trim() === "") {
      setErrors((prev) => ({ ...prev, turma: "Nome da turma não pode ser vazio." }));
      return;
    }
    try {
      const turmaAntiga = turmasFiltradas[editIndex];
      const response = await fetch(`${API_BASE}/api/turmas/${turmaAntiga.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: editValue,
      });
      if (!response.ok) throw new Error("Erro ao editar turma");
      const novaLista = turmas.map((t) => (t.id === turmaAntiga.id ? { ...t, nome: editValue.trim() } : t));
      setTurmas(novaLista.sort((a, b) => a.nome.localeCompare(b.nome)));
      setEditIndex(null);
      setEditValue("");
      setErrors({});
      setIsListOpen(false);
    } catch (error) {
      console.error("Erro ao editar turma:", error);
      setErrors((prev) => ({ ...prev, geral: "Erro ao editar turma. Tente novamente." }));
    }
  };

  const cancelarEdicao = () => {
    setEditIndex(null);
    setEditValue("");
    setErrors({});
  };

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const abrirModalExcluir = (index) => {
    setDeleteIndex(index);
    setIsListOpen(true);
    setConfirmDeleteOpen(true);
  };

  const confirmarExclusao = async () => {
    try {
      const turmaParaApagar = turmasFiltradas[deleteIndex];
      const response = await fetch(`${API_BASE}/api/turmas/${turmaParaApagar.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao apagar turma");
      const novaLista = turmas.filter((t) => t.id !== turmaParaApagar.id);
      setTurmas(novaLista);
      setDeleteIndex(null);
      setErrors({});
      if (turma === turmaParaApagar.nome) setTurma("");
      setIsListOpen(false);
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Erro ao apagar turma:", error);
      setErrors((prev) => ({ ...prev, geral: "Erro ao apagar turma. Tente novamente." }));
      setDeleteIndex(null);
      setConfirmDeleteOpen(false);
    }
  };

  const cancelarExclusao = () => {
    setDeleteIndex(null);
    setConfirmDeleteOpen(false);
  };

  useEffect(() => {
    loadTurmas();
  }, [loadTurmas]);

  return (
    <div
      className={cn("relative flex flex-col gap-6 bg-slate-400 min-h-screen align-center justify-center", className)}
      {...props} // aqui já não vai `searchParams`
      ref={containerRef}
    >
      {/* Botão voltar */}
      <button
        aria-label="Voltar para dashboard"
        onClick={() => router.push("/dashboard")}
        className="absolute left-4 top-1 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
        title="Voltar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Botão logout */}
      <button
        onClick={handleLogout}
        className="absolute right-2 top-1 inline-flex items-center justify-center rounded-md bg-[#394779] px-3 py-2 text-sm font-medium text-white hover:bg-[#3d4381] focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        Encerrar Sessão
      </button>

      {/* Card */}
      <div className="rounded-x p-4">
        <img src="/vibe-check-logo.png" alt="Logo" className="mx-auto mb-4 h-48 w-48" />

        <div className="mb-2 px-4">
          <h2 className="text-xl font-semibold text-black">Check-In</h2>
        </div>

        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="relative flex items-end gap-2">
              <div className="flex w-full flex-col gap-2">
                <label htmlFor="turma" className="text-sm text-black/90">Turma</label>
                <input
                  id="turma"
                  type="text"
                  className="mt-1 w-full rounded bg-slate-600 px-3 py-2 text-white outline-none placeholder:text-white/80 focus:ring-2 focus:ring-indigo-400"
                  placeholder="Digite uma turma"
                  value={turma}
                  onChange={(e) => {
                    setTurma(e.target.value);
                    clearError("turma");
                    setCodigoGerado(null);
                    setIsListOpen(false);
                  }}
                  disabled={editIndex !== null}
                />
                {errors.turma && <p className="mt-1 text-sm text-red-400">{errors.turma}</p>}
              </div>

              {/* Botão ver lista */}
              <button
                type="button"
                className="mb-[2px] inline-flex h-10 items-center justify-center rounded-md bg-[#394779] px-4 text-sm font-medium text-white hover:bg-[#3d4381] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onClick={() => setIsListOpen((v) => !v)}
                title="Ver Lista"
              >
                Ver Lista
              </button>
            </div>

            {/* Lista de turmas */}
            {isListOpen && (
              <div className="z-40 max-h-48 overflow-y-auto rounded-md bg-slate-700 p-2">
                {turmasFiltradas.length === 0 && <p className="text-white">Nenhuma turma encontrada.</p>}

                {turmasFiltradas.map((t, i) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded p-1",
                      turma === t.nome ? "bg-[#3d4381]" : "hover:bg-[#2a2f57]"
                    )}
                    onClick={() => {
                      if (editIndex === null) {
                        setTurma(t.nome);
                        setIsListOpen(false);
                      }
                    }}
                  >
                    {editIndex === i ? (
                      <>
                        <input
                          type="text"
                          className="flex-grow rounded bg-white px-2 py-1 text-black"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          className="ml-2 inline-flex items-center justify-center rounded-md border border-white/30 px-2 py-1 text-xs text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmarEdicao();
                          }}
                        >
                          Salvar
                        </button>
                        <button
                          className="ml-1 inline-flex items-center justify-center rounded-md px-2 py-1 text-xs text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelarEdicao();
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-grow truncate text-white">{t.nome}</span>
                        <div className="ml-2 flex gap-1">
                          <button
                            className="inline-flex items-center justify-center rounded-md border border-white/30 px-2 py-1 text-xs text-white hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              iniciarEdicao(i);
                            }}
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="inline-flex items-center justify-center rounded-md bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalExcluir(i);
                            }}
                            title="Remover"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {errors.geral && <p className="mt-2 text-sm text-red-400">{errors.geral}</p>}

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading || editIndex !== null}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2",
                  isLoading || editIndex !== null
                    ? "cursor-not-allowed bg-[#394779]/60 text-white"
                    : "cursor-pointer bg-[#394779] text-white hover:bg-[#3d4381]"
                )}
              >
                {isLoading ? "Liberando..." : "Liberar Check-In"}
              </button>

              {codigoGerado && <SuccessCard codigo={codigoGerado} />}
            </div>
          </form>
        </div>
      </div>

      {/* Modal confirmação exclusão */}
      <ModalConfirm
        isOpen={confirmDeleteOpen}
        onConfirm={confirmarExclusao}
        onCancel={cancelarExclusao}
        message={`Tem certeza que quer apagar a turma "${deleteIndex !== null ? turmasFiltradas[deleteIndex]?.nome : ""}"?`}
      />
    </div>
  );
}
