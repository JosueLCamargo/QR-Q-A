// src/pages/FeedView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, getRole, clearRole } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

/* ---------- UI helpers ---------- */
const Card = ({ children, className = "" }) => (
  <div
    className={`mx-auto
                w-[85vw] max-w-[1200px]
                rounded-[22px] shadow-2xl
                px-6 sm:px-8 md:px-10
                py-3 sm:py-4 md:py-5
                bg-gradient-to-br from-red-800 via-red-700 to-red-600
                border border-red-400/50 text-white ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, className = "", ...props }) => (
  <button
    className={`px-5 py-2 rounded-xl shadow-lg font-semibold
                bg-white/15 hover:bg-white/25 border border-white/25
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
const estadoOf = (p = {}) => (p.estado ?? p.estatus ?? "pendiente");
const tsMillis = (ts) =>
  ts?.toMillis?.() ? ts.toMillis() : ts ? +new Date(ts) : 0;

export default function FeedView() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [ocultarLeidas, setOcultarLeidas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const qRef = query(collection(db, "preguntas"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(arr);
        setCargando(false);
        setErr(null);
      },
      (e) => {
        console.error("[Feed] onSnapshot error:", e);
        setErr(e);
        setCargando(false);
      }
    );
    return () => unsub();
  }, []);

  // Aprobadas arriba, leídas abajo (ambas por fecha desc)
  const aprobadasSorted = useMemo(
    () =>
      items
        .filter((x) => estadoOf(x) === "aprobada")
        .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt)),
    [items]
  );
  const leidasSorted = useMemo(
    () =>
      items
        .filter((x) => estadoOf(x) === "leida")
        .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt)),
    [items]
  );

  const visibles = useMemo(() => {
    if (ocultarLeidas) return aprobadasSorted;
    return [...aprobadasSorted, ...leidasSorted];
  }, [aprobadasSorted, leidasSorted, ocultarLeidas]);

  const marcarLeida = async (id) => {
    try {
      await updateDoc(doc(db, "preguntas", id), {
        estado: "leida",
        readAt: serverTimestamp(),
        readBy: getRole?.() || "viewer",
      });
    } catch (e) {
      console.error(e);
      alert("No se pudo marcar como leída.");
    }
  };

  const handleChangeUser = () => {
    try {
      clearRole?.();
      localStorage.removeItem("usuarioNombre");
      localStorage.removeItem("nombreUsuario");
      localStorage.removeItem("userName");
      localStorage.removeItem("codigo");
      sessionStorage.clear();
    } catch {}
    nav("/auth", { replace: true });
    setTimeout(() => {
      if (window.location.pathname !== "/auth") {
        window.location.assign("/auth");
      }
    }, 60);
  };

  return (
    <div className="min-h-screen w-full py-10 sm:py-12 md:py-14 px-4
                    bg-[radial-gradient(ellipse_at_top,rgba(255,0,0,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.05),transparent_60%)]">
      <CornerLogos />

      <div className="max-w-[1400px] mx-auto">
        {/* Título */}
        <h1 className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow mb-6 md:mb-8">
          Q&A Team RED
        </h1>

        {/* Barra de acciones */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 md:mb-8">
          <div className="flex gap-2">
            <Button
              className={`${ocultarLeidas ? "bg-white/30" : ""}`}
              onClick={() => setOcultarLeidas((v) => !v)}
            >
              {ocultarLeidas ? "Mostrar leídas" : "Ocultar leídas"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleChangeUser}>Cambiar usuario</Button>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-5 md:space-y-6">
          {cargando && (
            <Card className="bg-white/10 border-white/20 text-white">
              Cargando preguntas…
            </Card>
          )}

          {!cargando && err && (
            <Card className="bg-white/10 border-white/20 text-white">
              Error al cargar: {err.message}
            </Card>
          )}

          {!cargando && !err && visibles.length === 0 && (
            <Card className="bg-white/10 border-white/20 text-white">
              {items.length === 0
                ? "Aún no hay preguntas."
                : ocultarLeidas
                ? "No hay preguntas aprobadas por mostrar."
                : "No hay preguntas aprobadas o leídas por mostrar."}
            </Card>
          )}

          {visibles.map((p) => (
            <Card key={p.id}>
              {/* Encabezado compacto */}
              <div className="flex items-start justify-between">
                <div className="text-xl sm:text-2xl font-extrabold leading-none tracking-wide">
                  {getDisplayName(p)}
                </div>

                {/* Badge */}
                {estadoOf(p) === "leida" ? (
                  <span className="ml-3 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-sm font-semibold">
                    Leído
                  </span>
                ) : (
                  <span className="ml-3 px-3 py-1 rounded-full bg-amber-500/90 text-white text-sm font-semibold">
                    Aprobada
                  </span>
                )}
              </div>

              {/* Separador sutil */}
              <div className="mt-2 border-t border-white/25" />

              {/* Texto compacto */}
              <div className="mt-2 text-lg sm:text-xl leading-tight text-white/95">
                {p.texto || "(sin texto)"}
              </div>

              {/* Acción compacta */}
              <div className="mt-4 flex justify-end">
                {estadoOf(p) === "aprobada" && (
                  <Button
                    className="bg-white text-red-800 hover:bg-white/90 px-5 py-2 text-sm sm:text-base"
                    onClick={() => marcarLeida(p.id)}
                  >
                    Marcar leída
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
