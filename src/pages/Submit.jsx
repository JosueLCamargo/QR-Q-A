import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/* ---------- UI ---------- */
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

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-lg
                bg-black/40 text-white placeholder-white/60
                border border-white/30 outline-none
                focus:ring focus:ring-red-300/40 ${props.className || ""}`}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    rows={props.rows || 4}
    className={`w-full rounded-xl px-4 py-2.5 sm:py-3 text-base sm:text-lg
                bg-black/40 text-white placeholder-white/60
                border border-white/30 outline-none
                focus:ring focus:ring-red-300/40 ${props.className || ""}`}
  />
);

/* ---------- Header (logos en esquinas + Q&A) ---------- */
const AppHeader = () => (
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
    <div className="flex justify-center pt-10 sm:pt-12 md:pt-14 mb-4 sm:mb-6 md:mb-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white
                     drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
        Q&A
      </h1>
    </div>
  </>
);

export default function Submit() {
  // debug mínimo para confirmar montaje
  // (mira la consola del navegador; debería imprimirse una vez)
  console.log("Submit mounted");

  const [nombre, setNombre] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [anonimo, setAnonimo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!pregunta.trim()) return alert("Escribe una pregunta");
    try {
      setEnviando(true);
      await addDoc(collection(db, "preguntas"), {
        nombre: anonimo ? "Anónimo" : (nombre || "Anónimo").trim(),
        texto: pregunta.trim(),
        estado: "pendiente",
        createdAt: serverTimestamp(),
        approvedAt: null,
        approvedBy: null,
      });
      setOk(true);
      setNombre("");
      setPregunta("");
      setAnonimo(false);
    } catch (err) {
      console.error("Error al enviar:", err);
      alert("No se pudo enviar. Revisa la consola");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="relative min-h-screen p-4 sm:p-6 md:p-8 bg-black/20">
      <AppHeader />

      <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto -mt-2 sm:-mt-4">
        <Card>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-5 sm:mb-6
                         drop-shadow-[0_3px_10px_rgba(0,0,0,0.7)]">
            Enviar pregunta
          </h2>

          <form onSubmit={handleSend} className="space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <input
                id="check-anon"
                type="checkbox"
                checked={anonimo}
                onChange={(e) => setAnonimo(e.target.checked)}
                className="h-4 w-4 accent-red-600"
              />
              <label htmlFor="check-anon" className="text-sm sm:text-base text-white/90 select-none">
                Enviar como anónimo
              </label>
            </div>

            <div>
              <label className="text-sm sm:text-base text-white/90 block mb-1">
                Nombre {anonimo && <span className="text-white/60">(desactivado por anónimo)</span>}
              </label>
              <Input
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={anonimo}
              />
            </div>

            <div>
              <label className="text-sm sm:text-base text-white/90 block mb-1">Pregunta</label>
              <Textarea
                placeholder="¿Cuál es tu duda?"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                rows={5}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar"}
              </Button>
              {ok && <span className="text-green-300 text-sm sm:text-base">¡Gracias! Un especialista te respondera.</span>}
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
