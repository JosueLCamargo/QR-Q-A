import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithCodigo, setRole, getRole, clearRole, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
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

/* ---------- Logos fijos en esquinas ---------- */
const CornerLogos = () => (
  <>
    <img
      src="/logo2.png"
      alt="logo esquina izquierda"
      className="fixed top-3 left-3 z-20
                 h-7 w-auto sm:h-10 md:h-12 lg:h-14
                 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]
                 select-none pointer-events-none"
    />
    <img
      src="/logo.png"
      alt="logo esquina derecha"
      className="fixed top-3 right-3 z-20
                 h-7 w-auto sm:h-10 md:h-12 lg:h-14
                 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.6)]
                 select-none pointer-events-none"
    />
  </>
);

/* ===========================
   LOGIN (default export)
=========================== */
export default function Auth() {
  const nav = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = getRole();
    if (r === "admin") nav("/admin");
    if (r === "viewer") nav("/feed");
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await loginWithCodigo(codigo);
      if (!user) return alert("Código inválido");
      setRole(user.rol); // "admin" | "viewer"
      nav(user.rol === "admin" ? "/admin" : "/feed");
    } catch (err) {
      console.error(err);
      alert("Error conectando con Firestore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-6 md:p-8 bg-black/20">
      <CornerLogos />

      <div className="flex justify-center pt-10 sm:pt-12 md:pt-14 mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white
                       drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
          Acceso
        </h1>
      </div>

      <div className="max-w-sm sm:max-w-md md:max-w-lg mx-auto -mt-2 sm:-mt-4">
        <Card>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-5 sm:mb-6
                         drop-shadow-[0_3px_10px_rgba(0,0,0,0.7)]">
            Entrar con código
          </h2>

          <form onSubmit={submit} className="space-y-4 sm:space-y-5">
            <input
              className="w-full rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-lg
                         bg-black/40 text-white placeholder-white/60
                         border border-white/30 outline-none
                         focus:ring focus:ring-red-300/40"
              placeholder="Código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  clearRole();
                  setCodigo("");
                }}
                className="text-xs sm:text-sm text-white/80 hover:text-white underline/20"
              >
                Limpiar sesión
              </button>
              <button
                type="button"
                onClick={() => nav("/submit")}
                className="text-xs sm:text-sm text-white/90 hover:text-white underline/20 ml-auto"
              >
                Ir a Enviar
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

/* ===========================
   FEED (named export) con “Leído”
=========================== */
export function FeedView() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);

  // Gate: solo viewer/admin
  useEffect(() => {
    const r = getRole();
    if (r !== "viewer" && r !== "admin") nav("/auth");
  }, [nav]);

  // Solo aprobadas; ordena en cliente
  useEffect(() => {
    const qRef = query(collection(db, "preguntas"), where("estado", "==", "aprobada"));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const arr = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
          );
        setItems(arr);
        setErr(null);
      },
      (error) => {
        console.error("[Feed] error onSnapshot:", error);
        setErr(error);
      }
    );
    return () => unsub();
  }, []);

  const handleChangeUser = () => {
    try { clearRole(); localStorage.removeItem("rol"); } catch {}
    nav("/auth", { replace: true });
  };

  const handleMarkRead = async (id) => {
    try {
      await updateDoc(doc(db, "preguntas", id), {
        estado: "leida",
        readAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      alert("No se pudo marcar como leído");
    }
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-6 md:p-8 bg-black/20">
      <CornerLogos />

      <div className="flex justify-center pt-10 sm:pt-12 md:pt-14 mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white
                       drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
          Q&A Team RED
        </h1>
      </div>

      {/* ⬇️ más ancho y con scroll interno */}
      <div className="w-[92vw] max-w-4xl mx-auto -mt-2 sm:-mt-4">
        <Card>
          {err && (
            <div className="text-amber-300 text-sm mb-3">
              Error: {err.code} — {err.message}
            </div>
          )}

          <div className="space-y-4 md:space-y-5 md:max-h-[65vh] overflow-y-auto pr-1">
            {items.map((p) => (
              <div
                key={p.id}
                className="border border-white/30 rounded-2xl p-5 sm:p-6 bg-white/85 backdrop-blur
                           flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-base sm:text-lg text-gray-700 mb-1">
                    {p.nombre || "Anónimo"}
                  </div>
                  <div className="text-lg sm:text-xl text-gray-900 leading-relaxed break-words">
                    {p.texto}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleMarkRead(p.id)}
                  className="shrink-0 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500
                             text-white text-sm font-semibold shadow"
                >
                  Leído
                </button>
              </div>
            ))}

            {items.length === 0 && !err && (
              <div className="text-center text-white/80 py-10">
                Aún no hay preguntas aprobadas
              </div>
            )}
          </div>

          <div className="flex justify-center md:justify-end mt-6">
            <Button
              type="button"
              className="bg-white/0 text-white border border-white/50"
              onClick={handleChangeUser}
            >
              Cambiar usuario
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
