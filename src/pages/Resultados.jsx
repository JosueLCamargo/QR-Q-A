// src/pages/Resultados.jsx

import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

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
        Resultados en vivo
      </h1>
    </div>
  </>
);

export default function Resultados() {
  const [respuestas, setRespuestas] = useState([]);

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

  useEffect(() => {
    const q = query(collection(db, "respuestas"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRespuestas(data);
    });

    return () => unsub();
  }, []);

  const totalEncuestas = Math.max(
    Math.ceil(respuestas.length / Object.keys(preguntas).length),
    0
  );

  const respuestasPorPregunta = (preguntaId) =>
    respuestas.filter((r) => Number(r.preguntaId) === Number(preguntaId));

  const totalPregunta1 = respuestasPorPregunta(1).length;

  const contarOpcion = (opcion) =>
    respuestasPorPregunta(1).filter((r) => r.respuesta === opcion || r.opcion === opcion).length;

  return (
    <main className="relative min-h-screen p-4 sm:p-6 md:p-8 bg-black/20">
      <AppHeader />

      <div className="max-w-6xl mx-auto -mt-2 sm:-mt-4 space-y-6">
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-white/70">Respuestas guardadas</p>
              <p className="text-4xl font-extrabold text-white">{respuestas.length}</p>
            </div>

            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-white/70">Encuestas aprox.</p>
              <p className="text-4xl font-extrabold text-white">{totalEncuestas}</p>
            </div>

            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-white/70">Actualización</p>
              <p className="text-4xl font-extrabold text-green-300">LIVE</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-6">
            {preguntas[1].texto}
          </h2>

          <div className="space-y-5">
            {preguntas[1].opciones.map((opcion) => {
              const votos = contarOpcion(opcion);
              const porcentaje = totalPregunta1
                ? Math.round((votos / totalPregunta1) * 100)
                : 0;

              return (
                <div key={opcion}>
                  <div className="flex justify-between text-white font-bold mb-2">
                    <span>{opcion}</span>
                    <span>
                      {votos} votos · {porcentaje}%
                    </span>
                  </div>

                  <div className="w-full h-9 bg-black/40 rounded-xl overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {[2, 3].map((id) => {
          const lista = respuestasPorPregunta(id);

          return (
            <Card key={id}>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-6">
                {preguntas[id].texto}
              </h2>

              {lista.length === 0 ? (
                <p className="text-white/70 text-center">
                  Aún no hay respuestas.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lista.map((r) => (
                    <div
                      key={r.id}
                      className="bg-black/35 border border-white/10 rounded-xl p-4"
                    >
                      <p className="text-white text-lg break-words">
                        {r.respuesta}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}