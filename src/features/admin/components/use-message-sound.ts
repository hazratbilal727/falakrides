"use client";
import {useCallback, useEffect, useRef, useState} from "react";

const preferenceKey = "falak-admin-message-sound";
export function useMessageSound() {
  const [enabled, setEnabled] = useState(() => {
    try {return typeof window === "undefined" || localStorage.getItem(preferenceKey) !== "off";}
    catch {return true;}
  });
  const enabledRef = useRef(enabled);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    // Browsers require a user interaction before notification audio can play.
    function unlock() {
      try {
        if (!audio.current) audio.current = new AudioContext();
        if (audio.current.state === "suspended") void audio.current.resume().catch(() => {});
      } catch { /* Messaging remains available when audio is unsupported. */ }
    }
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      const context = audio.current; audio.current = null;
      if (context && context.state !== "closed") void context.close().catch(() => {});
    };
  }, []);
  const notify = useCallback(() => {
    const context = audio.current;
    if (!enabledRef.current || !context || context.state !== "running") return;
    try {
      for (const [offset, frequency] of [[0, 660], [.14, 880]]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + offset;
        oscillator.type = "sine"; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.12, start + .015);
        gain.gain.exponentialRampToValueAtTime(.001, start + .24);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(start); oscillator.stop(start + .25);
        oscillator.onended = () => {oscillator.disconnect(); gain.disconnect();};
      }
    } catch { /* A blocked audio device must not interrupt the inbox. */ }
  }, []);
  function toggle() {
    const next = !enabledRef.current;
    enabledRef.current = next; setEnabled(next);
    try {localStorage.setItem(preferenceKey, next ? "on" : "off");} catch { /* Storage can be disabled. */ }
  }
  return {enabled, toggle, notify};
}
