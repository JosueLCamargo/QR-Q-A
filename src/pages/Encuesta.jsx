// src/pages/Encuesta.jsx

import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10
                bg-white/20 border border-white/20 backdrop-blur-lg ${className}`}
  >
    {children}
  </div>
);

const AppHeader = () => (
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
    <div className="flex justify-center pt-10 sm:pt-12 md:pt-14 mb-4 sm:mb-6 md:mb-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
        Encuesta
      </h1>
    </div>
  </>
);

export default function Encuesta() {
  const [respuestas, setRespuestas] = useState({
    1: "",
    2: "",
    3: "",
  });

  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  const preguntas = {
    1: {
      tipo: "opcion",
      texto: "¿Te gustó el evento?",
      opciones: ["Sí", "No"],
    },
    2: {
      tipo: "abierta",
      texto: "¿Qué fue lo que más te gustó?",
    },
    3: {
      tipo: "abierta",
      texto: "¿Qué cambiarías o mejorarías?",
    },
  };

  const cambiarRespuesta = (id, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [id]: valor,
    }));
  };

  const enviarTodo = async (e) => {
    e.preventDefault();

    if (!respuestas[1]) {
      alert("Responde la pregunta 1");
      return;
    }

    if (!respuestas[2].trim()) {
      alert("Responde la pregunta 2");
      return;
    }

    if (!respuestas[3].trim()) {
      alert("Responde la pregunta 3");
      return;
    }

    if (localStorage.getItem("encuesta_enviada")) {
      alert("Ya enviaste la encuesta");
      return;
    }

    try {
      setEnviando(true);

      await Promise.all(
        Object.keys(preguntas).map((id) =>
          addDoc(collection(db, "respuestas"), {
            preguntaId: Number(id),
            tipo: preguntas[id].tipo,
            pregunta: preguntas[id].texto,
            respuesta: respuestas[id].trim(),
            opcion: preguntas[id].tipo === "opcion" ? respuestas[id] : "",
            createdAt: serverTimestamp(),
          })
        )
      );

      localStorage.setItem("encuesta_enviada", "1");
      setOk(true);
    } catch (error) {
      console.error("Error al guardar encuesta:", error);
      alert("Error al guardar encuesta");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="relative min-h-screen p-4 sm:p-6 md:p-8 bg-black/20">
      <AppHeader />

      <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto -mt-2 sm:-mt-4">
        <Card>
          {ok ? (
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-green-300 mb-4">
                ¡Listo!
              </h2>
              <p className="text-white text-lg">
                Tus respuestas fueron enviadas correctamente.
              </p>
            </div>
          ) : (
            <form onSubmit={enviarTodo} className="space-y-7">
              {Object.entries(preguntas).map(([id, pregunta]) => (
                <div key={id} className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white text-center drop-shadow-[0_3px_10px_rgba(0,0,0,0.7)]">
                    {pregunta.texto}
                  </h2>

                  {pregunta.tipo === "opcion" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {pregunta.opciones.map((opcion) => (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => cambiarRespuesta(id, opcion)}
                          className={`w-full rounded-xl py-3 px-4 text-white font-bold text-lg shadow-lg transition active:scale-[0.99]
                            ${
                              respuestas[id] === opcion
                                ? "bg-green-600"
                                : "bg-red-600 hover:bg-red-500"
                            }`}
                        >
                          {opcion}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={respuestas[id]}
                      onChange={(e) => cambiarRespuesta(id, e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      rows={4}
                      className="w-full rounded-xl px-4 py-3 text-base sm:text-lg bg-black/40 text-white placeholder-white/60 border border-white/30 outline-none focus:ring focus:ring-red-300/40"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-xl py-4 px-5 bg-red-600 hover:bg-red-500 text-white font-bold text-xl shadow-lg transition active:scale-[0.99] disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}