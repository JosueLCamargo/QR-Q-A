// src/pages/AdminView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, getRole, clearRole } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

/* ---------- UI helpers ---------- */
const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10
                bg-white/20 border border-white/20 backdrop-blur-lg ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-3.5 rounded-xl shadow-lg
                bg-red-600 hover:bg-red-500 text-white font-semibold
                transition active:scale-[0.99] ${className}`}
    {...props}
  >
    {children}
  </button>
);

/* ---------- Logos ---------- */
const CornerLogos = () => (
  <>
    <img
      src="/logo2.png"
      alt="logo izquierda"
      className="fixed top-3 left-3 z-20 h-7 w-auto sm:h-10 md:h-12 lg:h-14 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] select-none pointer-events-none"
    />
    <img
      src="/logo.png"
      alt="logo derecha"
      className="fixed top-3 right-3 z-20 h-7 w-auto sm:h-10 md:h-12 lg:h-14 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)] select-none pointer-events-none"
    />
  </>
);

/* ---------- Helpers ---------- */
const getDisplayName = (p = {}) => {
  const raw =
    p.nombre ??
    p.name ??
    p.usuario ??
    p.userName ??
    p.autor ??
    p.authorName ??
    "";
  const txt = String(raw || "").trim();
  return txt || "Anónimo";
};

export default function AdminView() {
  const nav = useNavigate();

  // Solo admin
  useEffect(() => {
    if (getRole() !== "admin") nav("/auth");
  }, [nav]);

  const [items, setItems] = useState([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [fsError, setFsError] = useState(null);

  useEffect(() => {
    try {
      console.log("[FS] projectId:", db.app?.options?.projectId);
    } catch {}
  }, []);

  // Suscripción
  useEffect(() => {
    const qRef = query(collection(db, "preguntas"));
    setLoading(true);

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const arr = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
          );
        arr.forEach((p) => console.log("[Item]", p.id, "->", getDisplayName(p)));
        setItems(arr);
        setFsError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[Admin] listen error:", err);
        setFsError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Recarga manual (fallback)
  const reloadOnce = async () => {
    try {
      setLoading(true);
      const qs = await getDocs(query(collection(db, "preguntas")));
      const arr = qs.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        );
      arr.forEach((p) =>
        console.log("[Item/Fallback]", p.id, "->", getDisplayName(p))
      );
      setItems(arr);
      setFsError(null);
    } catch (e) {
      console.error("[Admin] getDocs error:", e);
      setFsError(e);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado (sin 'leída' aquí)
  const changeEstado = async (id, estado) => {
    try {
      const data = { estado };
      if (estado === "aprobada") {
        data.approvedAt = serverTimestamp();
        data.approvedBy = "admin";
      }
      if (estado === "rechazada") {
        data.rejectedAt = serverTimestamp();
        data.approvedBy = "admin";
      }
      if (estado === "pendiente") {
        data.returnedToPendingAt = serverTimestamp();
      }
      await updateDoc(doc(db, "preguntas", id), data);
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar");
    }
  };

  // Filtro + búsqueda
  const filtered = useMemo(() => {
    let list = items;
    if (filtro !== "todos") list = list.filter((x) => x.estado === filtro);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter(
        (x) =>
          (x.texto || "").toLowerCase().includes(q) ||
          getDisplayName(x).toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filtro, busca]);

  // Conteos
  const counts = useMemo(() => {
    const c = { pendiente: 0, aprobada: 0, rechazada: 0, leida: 0 };
    items.forEach((it) => {
      if (c[it.estado] !== undefined) c[it.estado]++;
    });
    return c;
  }, [items]);

  return (
    <div className="relative min-h-screen p-4 sm:p-6 md:p-8 bg-black/20">
      <CornerLogos />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-center pt-10 sm:pt-12 md:pt-14 mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
            Panel de Administrador
          </h1>
        </div>

        {/* Estado / Acciones superiores */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 -mt-2 sm:-mt-4 mb-6">
          <div className="text-white/90">
            <div className="text-sm sm:text-base">
              Total: <strong>{items.length}</strong> ·
              <span className="ml-2">
                Pendientes: <strong>{counts.pendiente}</strong>
              </span>{" "}
              ·
              <span className="ml-2">
                Aprobadas: <strong>{counts.aprobada}</strong>
              </span>{" "}
              ·
              <span className="ml-2">
                Rechazadas: <strong>{counts.rechazada}</strong>
              </span>{" "}
              ·
              <span className="ml-2">
                Leídas: <strong>{counts.leida}</strong>
              </span>
              {loading && (
                <span className="ml-2 text-white/70">(cargando…)</span>
              )}
            </div>
            {fsError && (
              <div className="text-amber-300 text-sm mt-1">
                Error: {fsError.code} — {fsError.message}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-white/0 text-white border border-white/50"
              onClick={reloadOnce}
            >
              Recargar
            </Button>
            <Button
              className="bg-white/0 text-white border border-white/50"
              onClick={() => nav("/submit")}
            >
              Ir a Enviar
            </Button>
            <Button
              className="bg-white/0 text-white border border-white/50"
              onClick={() => {
                clearRole();
                nav("/auth");
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-white/90">Estado:</label>
              <select
                className="rounded-xl px-3 py-2 bg-black/40 text-white border border-white/30 outline-none focus:ring focus:ring-red-300/40"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              >
                <option value="pendiente">
                  Pendiente ({counts.pendiente})
                </option>
                <option value="aprobada">Aprobada ({counts.aprobada})</option>
                <option value="rechazada">
                  Rechazada ({counts.rechazada})
                </option>
                <option value="leida">Leída ({counts.leida})</option>
                <option value="todos">Todos ({items.length})</option>
              </select>
            </div>
            <input
              className="w-full md:w-72 rounded-xl px-3 py-2 bg-black/40 text-white placeholder-white/60 border border-white/30 outline-none focus:ring focus:ring-red-300/40"
              placeholder="Buscar por nombre o texto…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </Card>

        {/* Lista */}
        <div className="space-y-3">
          {filtered.map((p) => (
            <Card key={p.id} className="border border-white/20">
              <div className="flex flex-col gap-3">
                {/* FILA SUPERIOR: Nombre + Estado + Acciones */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {/* CHIP DE NOMBRE */}
                    <span className="px-2.5 py-1 rounded-md bg-black/50 border border-white/30 text-white text-xs font-bold tracking-wide">
                      {getDisplayName(p)}
                    </span>

                    {/* CHIP DE ESTADO */}
                    <span className="capitalize px-2 py-1 rounded-md bg-white/10 border border-white/20 text-white/80 text-xs">
                      {p.estado}
                    </span>
                  </div>

                  {/* Acciones: SOLO si NO está aprobada ni leída */}
                  {!["aprobada", "leida"].includes(p.estado) && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={() => changeEstado(p.id, "aprobada")}
                      >
                        Aprobar
                      </Button>
                      <Button
                        className="bg-rose-600 hover:bg-rose-500 text-white"
                        onClick={() => changeEstado(p.id, "rechazada")}
                      >
                        Rechazar
                      </Button>
                      <Button
                        className="bg-amber-600 hover:bg-amber-500 text-white"
                        onClick={() => changeEstado(p.id, "pendiente")}
                      >
                        Pendiente
                      </Button>
                    </div>
                  )}
                </div>

                {/* TEXTO */}
                <div className="text-lg text-white break-words">{p.texto}</div>
              </div>
            </Card>
          ))}

          {!loading && filtered.length === 0 && (
            <Card>
              <div className="text-center text-white/85 py-10">
                {fsError
                  ? "No se pudieron cargar los registros. Usa “Recargar” y revisa la consola."
                  : "No hay registros"}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
