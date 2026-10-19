"use client";

import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Mochi } from "@/components/mochi/Mochi";
import { onMochi } from "@/lib/mochi/bus";
import { actionMs, bedtimeStep, initialMochi, moodForHour, nextMochi, type MochiEvent, type MochiMachine } from "@/lib/mochi/machine";

type Stage = {
  machine: MochiMachine;
  dispatch: (event: MochiEvent) => void;
  waving: boolean;
  talking: boolean;
  tilt: boolean;
  setWaving: (value: boolean) => void;
};

const MochiContext = createContext<Stage | null>(null);

export function useMochiStage() {
  return useContext(MochiContext);
}

export function MochiProvider({ children, lang }: { children: React.ReactNode; lang: "fr" | "en" }) {
  const [machine, dispatch] = useReducer(nextMochi, initialMochi(12));
  const [waving, setWaving] = useState(false);
  const [talking, setTalking] = useState(false);
  const [tilt, setTilt] = useState(false);
  const machineRef = useRef(machine);
  const stretched = useRef(false);
  const yawned = useRef(false);

  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);

  useEffect(() => onMochi((cue) => {
    if (cue.type === "talk") {
      setTalking(cue.on);
      return;
    }
    if (cue.type === "wrong") {
      setTilt(true);
      window.setTimeout(() => setTilt(false), 900);
    }
    dispatch(cue);
  }), []);

  useEffect(() => {
    const onHide = () => {
      dispatch({ type: "visibility", hidden: document.hidden });
      document.documentElement.dataset.mochiHidden = document.hidden ? "1" : "";
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => dispatch({ type: "reduced", value: media.matches });
    const start = window.setTimeout(apply, 0);
    media.addEventListener("change", apply);
    return () => {
      window.clearTimeout(start);
      media.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    const read = () => dispatch({ type: "busy", value: document.documentElement.dataset.mochiBusy === "1" });
    const start = window.setTimeout(read, 0);
    const watcher = new MutationObserver(read);
    watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mochi-busy"] });
    return () => {
      window.clearTimeout(start);
      watcher.disconnect();
    };
  }, []);

  useEffect(() => {
    if (machine.hidden || machine.reduced || machine.busy) return;
    if (machine.action !== "idle") {
      const ms = actionMs(machine.action);
      if (!ms) return;
      const id = window.setTimeout(() => dispatch({ type: "actionDone", roll: Math.random() }), ms);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => dispatch({ type: "idleTick", roll: Math.random() }), 6500);
    return () => window.clearTimeout(id);
  }, [machine.action, machine.hidden, machine.reduced, machine.busy]);

  useEffect(() => {
    const apply = () => {
      const hour = new Date().getHours();
      dispatch({ type: "hour", hour });
      const current = machineRef.current;
      const step = bedtimeStep(moodForHour(hour), current.action, stretched.current, yawned.current);
      if (step === "stretch" && !current.hidden && !current.reduced && !current.busy) {
        stretched.current = true;
        dispatch({ type: "idleTick", roll: 0.6 });
      }
    };
    const start = window.setTimeout(apply, 0);
    const id = window.setInterval(apply, 30000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const step = bedtimeStep(machine.mood, machine.action, stretched.current, yawned.current);
    if (step !== "yawn" || machine.hidden || machine.reduced || machine.busy) return;
    const id = window.setTimeout(() => {
      yawned.current = true;
      dispatch({ type: "idleTick", roll: 0.7 });
    }, 0);
    return () => window.clearTimeout(id);
  }, [machine.mood, machine.action, machine.hidden, machine.reduced, machine.busy]);

  return (
    <MochiContext.Provider value={{ machine, dispatch, waving, talking, tilt, setWaving }}>
      <MochiMark lang={lang} />
      {children}
    </MochiContext.Provider>
  );
}

function MochiMark({ lang }: { lang: "fr" | "en" }) {
  const path = usePathname();
  const stage = useMochiStage();
  const [look, setLook] = useState({ x: 0, y: 0 });
  if (!stage || path === "/kid/home") return null;
  return (
    <button
      type="button"
      className="fixed right-3 bottom-24 z-30 w-24 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
      aria-label={lang === "en" ? "Mochi the cat" : "Mochi le chat"}
      onClick={() => stage.dispatch({ type: "pet" })}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setLook({
          x: Math.max(-4, Math.min(4, (event.clientX - rect.left - rect.width / 2) / 12)),
          y: Math.max(-3, Math.min(3, (event.clientY - rect.top - rect.height / 2) / 16)),
        });
      }}
    >
      <Mochi
        action={stage.machine.action}
        mood={stage.machine.mood}
        look={look}
        paused={stage.machine.hidden}
        reduced={stage.machine.reduced}
        waving={stage.waving}
        talking={stage.talking}
        tilt={stage.tilt}
        label={lang === "en" ? "Mochi the cat" : "Mochi le chat"}
      />
    </button>
  );
}
