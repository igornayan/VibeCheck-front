"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// ---------------------------------------------
// Tailwind-only version (sem Radix/shadcn)
// ---------------------------------------------

const DEFAULT_EMOTION_COLORS = {
  "Muito Feliz": "#4ade80",
  Feliz: "#86efac",
  Desmotivado: "#a3a3a3",
  Indiferente: "#d4d4d4",
  Surpreso: "#fbbf24",
  Triste: "#60a5fa",
  Irritado: "#f87171",
  Ansioso: "#c084fc",
  Apaixonado: "#f472b6",
};

const EMOTION_LABELS = {
  1: "Muito Feliz",
  2: "Feliz",
  3: "Desmotivado",
  4: "Indiferente",
  5: "Surpreso",
  6: "Triste",
  7: "Irritado",
  8: "Ansioso",
  9: "Apaixonado",
};

function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / 86400000; // em dias
  return Math.ceil((diff + start.getDay() + 1) / 7);
}

// const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const API_BASE = "http://localhost:8080";

export default function DashboardForm() {
  const router = useRouter();

  // Estados principais
  const [timeRange, setTimeRange] = useState("all"); // "day" | "week" | "month" | "all"
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTurma, setSelectedTurma] = useState("all");
  const [selectedTipo, setSelectedTipo] = useState("all");
  const [turmas, setTurmas] = useState([]);

  // UI sem Radix
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState(null); // mensagens simples (sucesso/erro)

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
      setTurmas(turmasValidas);
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
    }
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/codigo/dashboard`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Erro ao buscar dados do dashboard");
      const rawData = await response.json();

      const selectedTurmaNome =
        selectedTurma === "all"
          ? null
          : (turmas.find((t) => String(t.id) === selectedTurma)?.nome ?? null);

      const filteredRaw = rawData.filter((item) => {
        if (selectedTurmaNome && item.turma !== selectedTurmaNome) return false;
        if (selectedTipo !== "all" && item.tipo !== selectedTipo) return false;
        return true;
      });

      const grouped = {};

      filteredRaw.forEach((item) => {
        // item.data: "dd/MM/yyyy HH:mm"
        const [dia, mes, anoHora] = String(item.data).split("/");
        const [ano, hora] = anoHora.split(" ");
        const date = new Date(`${ano}-${mes}-${dia}T${hora}`);

        let timeLabel;
        switch (timeRange) {
          case "week":
            timeLabel = `Semana ${getWeekNumber(date)}`;
            break;
          case "month":
            timeLabel = `${mes}/${ano}`;
            break;
          case "day":
            timeLabel = `${dia}/${mes}`;
            break;
          default:
            timeLabel = `Semana ${getWeekNumber(date)}`;
        }

        const emotionLabel = EMOTION_LABELS[item.emocao];
        if (!emotionLabel) return;

        if (!grouped[timeLabel]) grouped[timeLabel] = { week: timeLabel };
        grouped[timeLabel][emotionLabel] = Number(grouped[timeLabel][emotionLabel] || 0) + 1;
      });

      const transformedData = Object.values(grouped);

      const sortKey = (label) => {
        if (String(label).startsWith("Semana")) {
          const n = Number(String(label).replace("Semana", "").trim());
          return Number.isNaN(n) ? 0 : n;
        }
        if (/^\d{2}\/\d{4}$/.test(label)) {
          const [m, y] = label.split("/").map(Number);
          return y * 100 + m;
        }
        if (/^\d{2}\/\d{2}$/.test(label)) {
          const [d, m] = label.split("/").map(Number);
          return m * 100 + d;
        }
        return 0;
      };

      transformedData.sort((a, b) => sortKey(a.week) - sortKey(b.week));
      setData(transformedData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setNotice({ type: "error", text: "Erro ao carregar dados" });
    } finally {
      setLoading(false);
    }
  }, [selectedTurma, selectedTipo, timeRange, turmas]);

  useEffect(() => {
    loadTurmas();
  }, [loadTurmas]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = data || [];
  const availableEmotions = Array.from(
    new Set(filteredData.flatMap((item) => Object.keys(item).filter((k) => k !== "week")))
  );

  const getEmotionColor = (emotion) => DEFAULT_EMOTION_COLORS[emotion] || "#999999";

  const exportDataToTxt = () => {
    if (!data || data.length === 0) {
      setNotice({ type: "warn", text: "Não há dados para exportar." });
      return;
    }

    let text = "";
    data.forEach((item) => {
      text += `${item.week}:\n`;
      Object.entries(item).forEach(([key, value]) => {
        if (key !== "week") text += `  ${key}: ${value}\n`;
      });
      text += "\n";
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dados_grafico.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // UI helpers (Tailwind only)
  // -------------------------------------------------------------
  const Button = ({ className = "", children, ...props }) => (
    <button
      className={
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );

  const Card = ({ className = "", children }) => (
    <div className={"rounded-xl bg-transparent " + className}>{children}</div>
  );
  const CardHeader = ({ className = "", children }) => (
    <div className={"px-4 pb-4" + className}>{children}</div>
  );
  const CardTitle = ({ className = "", children }) => (
    <h3 className={"text-lg font-semibold " + className}>{children}</h3>
  );
  const CardContent = ({ className = "", children }) => (
    <div className={"p-2 pt-0 " + className}>{children}</div>
  );

  const Skeleton = ({ className = "" }) => (
    <div className={"animate-pulse rounded-md bg-gray-700/40 " + className} />
  );

  const Notice = ({ type = "info", text }) => {
    if (!text) return null;
    const colors =
      type === "error"
        ? "bg-red-500/10 text-red-300 border-red-500/40"
        : type === "warn"
        ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/40"
        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";
    return (
      <div className={`mb-3 rounded-md border px-3 py-2 text-sm ${colors}`}>{text}</div>
    );
  };

  // -------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Card className="shadow-none">
          <CardHeader className="pb-2 flex flex-row justify-between items-start">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-4" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Skeleton className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-black">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-400">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button
                className="text-black bg-[#394779] hover:bg-[#3d4381]"
                onClick={loadData}
              >
                Tentar novamente
              </Button>
              <Button
                className="text-black bg-[#394779] hover:bg-[#3d4381]"
                onClick={() => router.push("/")}
              >
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Main UI
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 bg-slate-400 min-h-screen">
      {/* Header */}
      <Card className="shadow-none">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <div className="flex items-center gap-4 py-4">
            {/* Back */}
            <Button
              className="text-black hover:bg-transparent"
              aria-label="Voltar para login"
              onClick={() => router.push("/")}
              title="Voltar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <CardTitle className="text-black">Relatórios</CardTitle>

            {/* Refresh */}
            <Button
              className="hover:bg-transparent"
              onClick={loadData}
              aria-label="Atualizar dados"
              title="Atualizar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-black ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            </Button>
          </div>

          {/* Simple Popover Menu */}
          <div className="relative py-4">
            <Button
              className="text-black hover:bg-transparent"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              title="Menu"
            >
              <span className="flex flex-col gap-[3px]">
                <span className="block w-6 h-0.5 bg-black rounded" />
                <span className="block w-6 h-0.5 bg-black rounded" />
                <span className="block w-6 h-0.5 bg-black rounded" />
              </span>
            </Button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-md border border-white/10 bg-gray-800/95 backdrop-blur p-2 shadow-lg z-50"
              >
                <Button
                  className="w-full justify-start bg-white/5 text-white hover:bg-white/10"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/checkin");
                  }}
                >
                  Ir para Check-in
                </Button>
                <Button
                  className="w-full mt-2 justify-start bg-white/5 text-white hover:bg-white/10"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/checkout");
                  }}
                >
                  Ir para Check-out
                </Button>
                <Button
                  className="w-full mt-2 justify-start bg-[#394779] text-white hover:bg-[#3d4381]"
                  onClick={handleLogout}
                >
                  Encerrar Sessão
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Avisos simples */}
        <CardContent>
          <Notice type={notice?.type} text={notice?.text} />

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap  items-center">
            {/* Time range */}
            <Button
              className={
                timeRange === "day"
                  ? "bg-[#394779] text-white hover:bg-[#3d4381]"
                  : "bg-[#F5F5F5] text-black hover:bg-[#eaeaea]"
              }
              onClick={() => setTimeRange("day")}
            >
              Dia
            </Button>
            <Button
              className={
                timeRange === "week"
                  ? "bg-[#394779] text-white hover:bg-[#3d4381]"
                  : "bg-[#F5F5F5] text-black hover:bg-[#eaeaea]"
              }
              onClick={() => setTimeRange("week")}
            >
              Semana
            </Button>
            <Button
              className={
                timeRange === "month"
                  ? "bg-[#394779] text-white hover:bg-[#3d4381]"
                  : "bg-[#F5F5F5] text-black hover:bg-[#eaeaea]"
              }
              onClick={() => setTimeRange("month")}
            >
              Mês
            </Button>
            <Button
              className={
                timeRange === "all"
                  ? "bg-[#394779] text-white hover:bg-[#3d4381]"
                  : "bg-[#F5F5F5] text-black hover:bg-[#eaeaea]"
              }
              onClick={() => setTimeRange("all")}
            >
              Todos
            </Button>

            {/* Turma (native select) */}
            <div className="relative">
              <select
                className="w-40 appearance-none rounded-md border border-gray-300 bg-[#F5F5F5] px-3 py-2 text-sm text-black shadow-sm focus:border-indigo-500 focus:outline-none"
                value={selectedTurma}
                onChange={(e) => setSelectedTurma(e.target.value)}
              >
                <option value="all">Todas as turmas</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={String(turma.id)}>
                    {turma.nome}
                  </option>
                ))}
                <option value="none">Nenhuma turma disponível</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
            </div>

            {/* Tipo (native select) */}
            <div className="relative">
              <select
                className="w-40 appearance-none rounded-md border border-gray-300 bg-[#F5F5F5] px-3 py-2 text-sm text-black shadow-sm focus:border-indigo-500 focus:outline-none"
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
              >
                <option value="all">Todos os tipos</option>
                <option value="CHECKIN">Check-in</option>
                <option value="CHECKOUT">Check-out</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className=" text-black">Visualização Gráfica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-slate-800 pt-4 rounded-2xl">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData} margin={{ top: 10, right: 30, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4b5563" />
                  <XAxis dataKey="week" tick={{ fill: "#ffffff" }} tickMargin={10} />
                  <YAxis tick={{ fill: "#ffffff" }} allowDecimals={false} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", borderColor: "#4b5563", borderRadius: "0.5rem" }}
                    itemStyle={{ color: "#ffffff" }}
                    labelStyle={{ color: "#9ca3af", fontWeight: "bold" }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ marginTop: 20, paddingTop: 10, color: "#ffffff" }} />
                  {availableEmotions.map((emotion) => (
                    <Line
                      key={emotion}
                      type="monotone"
                      dataKey={emotion}
                      stroke={getEmotionColor(emotion)}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name={emotion}
                      animationDuration={500}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <p className="text-gray-400 text-lg">Nenhum dado disponível</p>
                <Button className="text-black border border-white/20 bg-transparent hover:bg-white/10" onClick={loadData}>
                  Recarregar dados
                </Button>
              </div>
            )}
          </div>
          <div className="m-4 flex justify-center">
            <Button onClick={exportDataToTxt} className="bg-[#394779] text-white hover:bg-[#3d4381]">
              Exportar dados (.txt)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}