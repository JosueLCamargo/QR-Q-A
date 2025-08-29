import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, getRole } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

/* ---------- UI helpers (mismo look) ---------- */
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

export default function Users() {
  const nav = useNavigate();

  // === Gate robusto: mostramos estados claros en vez de redirigir a ciegas
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const r = getRole(); // debe regresar "admin" | "viewer" | null
      setIsAdmin(r === "admin");
    } catch {
      setIsAdmin(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // === Estado de datos
  const [users, setUsers] = useState([]);
  const [busca, setBusca] = useState("");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [rol, setRol] = useState("viewer");
  const [activo, setActivo] = useState(true);
  const [adding, setAdding] = useState(false);

  // Snapshot en vivo (sólo si admin y ya chequeado)
  useEffect(() => {
    if (!authChecked || !isAdmin) return;
    let unsub = () => {};
    try {
      const base = collection(db, "usuarios");
      const q = query(base, orderBy("createdAt", "desc"));
      unsub = onSnapshot(q, (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setUsers(arr);
      });
    } catch (e) {
      console.error("Error suscripción usuarios:", e);
    }
    return () => unsub();
  }, [authChecked, isAdmin]);

  const addUser = async (e) => {
    e.preventDefault();
    const nombreClean = (nombre || "").trim();
    const codigoClean = (codigo || "").trim();
    if (!nombreClean || !codigoClean) {
      alert("Nombre y código son obligatorios");
      return;
    }
    try {
      setAdding(true);
      // código único
      const q = query(collection(db, "usuarios"), where("codigo", "==", codigoClean));
      const dup = await getDocs(q);
      if (!dup.empty) {
        alert("Ese código ya existe. Usa otro.");
        setAdding(false);
        return;
      }
      await addDoc(collection(db, "usuarios"), {
        nombre: nombreClean,
        codigo: codigoClean,
        rol,               // "admin" | "viewer"
        activo,            // true/false
        createdAt: serverTimestamp(),
        lastLoginAt: null,
      });
      setNombre("");
      setCodigo("");
      setRol("viewer");
      setActivo(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo crear el usuario");
    } finally {
      setAdding(false);
    }
  };

  const toggleActivo = async (u) => {
    try {
      await updateDoc(doc(db, "usuarios", u.id), { activo: !u.activo });
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el estado");
    }
  };

  const removeUser = async (u) => {
    if (!confirm(`¿Eliminar a "${u.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, "usuarios", u.id));
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar");
    }
  };

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.nombre || "").toLowerCase().includes(q) ||
        (u.codigo || "").toLowerCase().includes(q) ||
        (u.rol || "").toLowerCase().includes(q)
    );
  }, [users, busca]);

  const fmtDate = (ts) => (ts?.toDate ? ts.toDate().toLocaleString() : "—");

  // === Render según estado de auth ===
  if (!authChecked) {
    return (
      <div className="relative min-h-screen p-6 bg-black/20 text-white grid place-items-center">
        <CornerLogos />
        <div className="text-white/90">Cargando…</div>
      </div>
    );
  }

  if (!isAdmin) {
    // No bloqueamos con redirect silencioso: mostramos aviso con botón
    return (
      <div className="relative min-h-screen p-6 bg-black/20">
        <CornerLogos />
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <h2 className="text-2xl font-extrabold text-white mb-4">No autorizado</h2>
            <p className="text-white/90">Necesitas iniciar sesión como <strong>admin</strong> para acceder a esta página.</p>
            <div className="mt-6">
              <Button onClick={() => nav("/auth")}>Ir a iniciar sesión</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // === UI principal (admin) ===
  return (
    <div className="relative min-h-screen p-4 sm:p-6 md:p-8 bg-black/20">
      <CornerLogos />

      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center pt-10 sm:pt-12 md:pt-14 mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white
                         drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
            Gestión de usuarios
          </h1>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-2 justify-end -mt-2 sm:-mt-4 mb-6">
          <Button className="bg-white/0 text-white border border-white/50" onClick={() => nav("/admin")}>
            Volver al panel
          </Button>
          <Button className="bg-white/0 text-white border border-white/50" onClick={() => nav("/submit")}>
            Ir a Enviar
          </Button>
        </div>

        {/* Formulario alta de usuario */}
        <Card className="mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4
                         drop-shadow-[0_3px_10px_rgba(0,0,0,0.7)]">
            Agregar usuario
          </h2>
          <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              className="md:col-span-2 rounded-xl px-3 py-2.5 bg-black/40 text-white placeholder-white/60
                         border border-white/30 outline-none focus:ring focus:ring-red-300/40"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <input
              className="md:col-span-1 rounded-xl px-3 py-2.5 bg-black/40 text-white placeholder-white/60
                         border border-white/30 outline-none focus:ring focus:ring-red-300/40"
              placeholder="Código (único)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <select
              className="md:col-span-1 rounded-xl px-3 py-2.5 bg-black/40 text-white
                         border border-white/30 outline-none focus:ring focus:ring-red-300/40"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
            >
              <option value="viewer">viewer</option>
              <option value="admin">admin</option>
            </select>
            <label className="md:col-span-1 flex items-center justify-between gap-3 text-white/90 text-sm rounded-xl px-3 py-2.5 bg-black/40 border border-white/30">
              Activo
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="h-5 w-5 accent-red-600"
              />
            </label>

            <div className="md:col-span-5 flex justify-end">
              <Button type="submit" disabled={adding}>
                {adding ? "Agregando..." : "Agregar usuario"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Lista de usuarios */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-white">Usuarios</h3>
            <input
              className="w-full md:w-72 rounded-xl px-3 py-2 bg-black/40 text-white placeholder-white/60
                         border border-white/30 outline-none focus:ring focus:ring-red-300/40"
              placeholder="Buscar por nombre, código o rol…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4
                           flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-white text-base font-semibold truncate">{u.nombre}</div>
                  <div className="text-white/80 text-sm">
                    Código: <span className="font-mono">{u.codigo}</span> · Rol: <strong>{u.rol}</strong> · Activo:{" "}
                    <strong>{u.activo ? "sí" : "no"}</strong>
                  </div>
                  <div className="text-white/70 text-xs">
                    Creado: {fmtDate(u.createdAt)} {u.lastLoginAt ? `· Último acceso: ${fmtDate(u.lastLoginAt)}` : ""}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    className={`${u.activo ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
                    onClick={() => toggleActivo(u)}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </Button>
                  <Button
                    className="bg-rose-600 hover:bg-rose-500"
                    onClick={() => removeUser(u)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center text-white/85 py-10">No hay usuarios</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
