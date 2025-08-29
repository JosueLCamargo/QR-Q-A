import React, { useEffect, useState } from "react";
import { db, getRole } from "../firebase";
import {
  writeBatch,
  collection,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl shadow-xl p-6 bg-white/95 border border-white/60 backdrop-blur ${className}`}>{children}</div>
);
const Button = ({ children, className = "", ...props }) => (
  <button className={`px-4 py-2 rounded-xl shadow hover:opacity-95 transition active:scale-[0.99] ${className}`} {...props}>{children}</button>
);
const Input = (props) => <input {...props} className={`w-full border rounded-xl px-3 py-2 outline-none focus:ring focus:ring-red-200 ${props.className||""}`} />;

export default function AddUser() {
  const nav = useNavigate();
  const [form, setForm] = useState({ nombre: "", codigo: "", rol: "viewer" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Solo admin puede entrar
  useEffect(() => {
    if (getRole() !== "admin") nav("/auth");
  }, [nav]);

  const crearUsuarioUnico = async ({ nombre, codigo, rol }) => {
    const batch = writeBatch(db);

    const codigoId = codigo.trim();
    const codigoRef = doc(db, "codigos", codigoId);     // ID = código (garantiza unicidad)
    const userRef   = doc(collection(db, "usuarios"));   // ID automático

    batch.set(codigoRef, {
      userRef: userRef.path,
      creadoEn: new Date(),
    });

    batch.set(userRef, {
      nombre: (nombre || "").trim(),
      codigo: codigoId,
      rol,
      activo: true,
      creadoEn: new Date(),
    });

    await batch.commit();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const { nombre, codigo, rol } = form;

    if (!codigo.trim()) {
      setMsg({ type: "error", text: "El código es obligatorio." });
      return;
    }
    if (!["admin", "viewer"].includes(rol)) {
      setMsg({ type: "error", text: "Rol inválido." });
      return;
    }

    try {
      setSaving(true);
      await crearUsuarioUnico({ nombre, codigo, rol });
      setMsg({ type: "ok", text: "Usuario creado correctamente." });
      setForm({ nombre: "", codigo: "", rol: "viewer" });
    } catch (err) {
      console.error(err);
      // Si el código ya existe, el batch falla por las reglas/colisión
      setMsg({ type: "error", text: "No se pudo crear. ¿Ese código ya existe?" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 to-red-700 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white">Agregar usuario</h1>
          <div className="flex gap-2">
            <Button className="bg-white text-red-700 border" onClick={() => nav("/admin")}>Volver al panel</Button>
          </div>
        </div>

        <Card className="max-w-xl">
          <h2 className="text-lg font-bold text-red-700 mb-3">Nuevo usuario</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-700">Nombre (opcional)</label>
              <Input
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">Código (único)</label>
              <Input
                placeholder="EJ: BRENDA-2025"
                value={form.codigo}
                onChange={(e) => setForm(f => ({ ...f, codigo: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Este será el dato con el que iniciará sesión.</p>
            </div>

            <div>
              <label className="text-sm text-gray-700">Rol</label>
              <select
                className="w-full border rounded-xl px-3 py-2"
                value={form.rol}
                onChange={(e) => setForm(f => ({ ...f, rol: e.target.value }))}
              >
                <option value="viewer">viewer</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <Button type="submit" className="bg-red-600 text-white" disabled={saving}>
              {saving ? "Guardando..." : "Guardar usuario"}
            </Button>

            {msg && (
              <div className={`text-sm mt-2 ${msg.type === "ok" ? "text-green-600" : "text-rose-600"}`}>
                {msg.text}
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
