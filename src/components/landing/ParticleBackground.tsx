"use client";

/**
 * Interactive particle background for the hero — indigo/cyan dots that link up
 * and react to the cursor. Built on the open-source tsparticles engine (v4);
 * all config and styling is our own.
 */

import { useMemo } from "react";
import Particles, { ParticlesProvider, useParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

function Field() {
  const { loaded } = useParticlesProvider();

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: "transparent" },
      fpsLimit: 60,
      detectRetina: true,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
          resize: { enable: true },
        },
        modes: {
          grab: { distance: 150, links: { opacity: 0.5 } },
        },
      },
      particles: {
        color: { value: ["#6366f1", "#22d3ee", "#a855f7"] },
        links: { color: "#8b93f8", distance: 140, enable: true, opacity: 0.25, width: 1 },
        move: {
          enable: true,
          speed: 0.8,
          direction: "none",
          outModes: { default: "bounce" },
          random: false,
          straight: false,
        },
        number: { density: { enable: true }, value: 55 },
        opacity: { value: 0.4 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      },
    }),
    []
  );

  if (!loaded) return null;
  return <Particles id="hero-particles" options={options} className="absolute inset-0 -z-10 pointer-events-none" />;
}

export default function ParticleBackground() {
  const init = async (engine: Engine) => {
    await loadSlim(engine);
  };
  return (
    <ParticlesProvider init={init}>
      <Field />
    </ParticlesProvider>
  );
}
