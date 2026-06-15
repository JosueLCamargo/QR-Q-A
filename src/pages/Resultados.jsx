// src/pages/Resultados.jsx

import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-2xl p-6 sm:p-8
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

const palabrasIgnorar = [
  "que", "para", "con", "los", "las", "una", "uno", "del", "por", "más",
  "muy", "fue", "fueron", "como", "todo", "todos", "todas", "esta", "este",
  "está", "han", "hay", "sus", "nos", "sin", "pero", "también", "sobre",
  "entre", "al", "el", "la", "de", "y", "a", "en", "lo", "se", "me", "mi",
  "un", "es", "su", "o", "u", "ya"
];

function normalizarTexto(texto = "") {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\sñ]/g, " ");
}

function obtenerTopPalabras(lista) {
  const conteo = {};

  lista.forEach((r) => {
    const palabras = normalizarTexto(r.respuesta || "")
      .split(/\s+/)
      .filter((p) => p.length > 3 && !palabrasIgnorar.includes(p));

    palabras.forEach((p) => {
      conteo[p] = (conteo[p] || 0) + 1;
    });
  });

  return Object.entries(conteo)
    .map(([palabra, total]) => ({ palabra, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 18);
}

export default function Resultados() {
  const [respuestas, setRespuestas] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "respuestas"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setRespuestas(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, []);

  const respuestasPorPregunta = (id) =>
    respuestas.filter((r) => Number(r.preguntaId) === Number(id));

  const totalPregunta1 = respuestasPorPregunta(1).length;

  const contarOpcion = (opcion) =>
    respuestasPorPregunta(1).filter(
      (r) => r.respuesta === opcion || r.opcion === opcion
    ).length;

  const si = contarOpcion("Sí");
  const no = contarOpcion("No");
  const satisfaccion = totalPregunta1
    ? Math.round((si / totalPregunta1) * 100)
    : 0;

  const totalParticipantes = totalPregunta1;

  const palabrasP2 = useMemo(
    () => obtenerTopPalabras(respuestasPorPregunta(2)),
    [respuestas]
  );

  const palabrasP3 = useMemo(
    () => obtenerTopPalabras(respuestasPorPregunta(3)),
    [respuestas]
  );

  const renderNube = (palabras) => (
    <div className="flex flex-wrap justify-center gap-3">
      {palabras.length === 0 ? (
        <p className="text-white/70 text-center">Aún no hay palabras suficientes.</p>
      ) : (
        palabras.map((p, i) => {
          const size =
            i < 3
              ? "text-4xl sm:text-5xl"
              : i < 8
              ? "text-2xl sm:text-3xl"
              : "text-lg sm:text-xl";

          return (
            <span
              key={p.palabra}
              className={`${size} font-extrabold text-white bg-black/25 px-4 py-2 rounded-xl drop-shadow`}
            >
              {p.palabra}
              <small className="ml-2 text-green-300 text-base">{p.total}</small>
            </span>
          );
        })
      )}
    </div>
  );

  const renderAbiertas = (id, palabras) => {
    const lista = respuestasPorPregunta(id).slice(0, 12);

    return (
      <Card>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-6">
          {preguntas[id].texto}
        </h2>

        <div className="mb-8">{renderNube(palabras)}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lista.map((r) => (
            <div
              key={r.id}
              className="bg-black/35 border border-white/10 rounded-xl p-4"
            >
              <p className="text-white text-base sm:text-lg break-words">
                {r.respuesta}
              </p>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <main className="relative min-h-screen p-4 sm:p-6 md:p-8 bg-black/20">
      <AppHeader />

      <div className="max-w-6xl mx-auto -mt-2 sm:-mt-4 space-y-6">
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-white/70">Participantes</p>
              <p className="text-4xl font-extrabold text-white">
                {totalParticipantes}
              </p>
            </div>

            <div className="bg-black/30 rounded-xl p-4">
              <p className="text-white/70">Satisfacción</p>
              <p className="text-4xl font-extrabold text-green-300">
                {satisfaccion}%
              </p>
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
                      className="h-full bg-red-600 transition-all duration-700"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {renderAbiertas(2, palabrasP2)}
        {renderAbiertas(3, palabrasP3)}
      </div>
    </main>
  );
}