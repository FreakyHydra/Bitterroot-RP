"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { HeartHandshake, RotateCcw, ShieldCheck, Sparkles, Zap } from "lucide-react";

type TextColors = {
  dialogue: string;
  action: string;
  narration: string;
};

type RelationshipVisual = {
  label: string;
  trust: number;
  tension: number;
  respect: number;
};

const TEXT_STYLE_KEY = "bitterroot.text-style.v1";
const RS_VISUAL_KEY = "bitterroot.rs-visual.v1";

export const SANDBOX_TEXT_COLORS: TextColors = {
  dialogue: "#e8e4d9",
  action: "#8ab4c8",
  narration: "#9a9f7a",
};

const DEFAULT_RELATIONSHIP: RelationshipVisual = {
  label: "Stranger",
  trust: 0,
  tension: 0,
  respect: 0,
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function colorizeMessage(element: HTMLParagraphElement, colors: TextColors) {
  const raw = element.dataset.rpRawText ?? element.textContent ?? "";
  element.dataset.rpRawText = raw;
  element.textContent = "";

  const tokenPattern = /(\*[^*\n]+\*|“[^”\n]+”|"[^"\n]+")/g;
  let cursor = 0;

  for (const match of raw.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      const narration = document.createElement("span");
      narration.className = "rp-narration";
      narration.style.color = colors.narration;
      narration.textContent = raw.slice(cursor, index);
      element.appendChild(narration);
    }

    const token = match[0];
    const span = document.createElement("span");
    if (token.startsWith("*")) {
      span.className = "rp-action";
      span.style.color = colors.action;
      span.textContent = token.slice(1, -1);
    } else {
      span.className = "rp-dialogue";
      span.style.color = colors.dialogue;
      span.textContent = token;
    }
    element.appendChild(span);
    cursor = index + token.length;
  }

  if (cursor < raw.length) {
    const narration = document.createElement("span");
    narration.className = "rp-narration";
    narration.style.color = colors.narration;
    narration.textContent = raw.slice(cursor);
    element.appendChild(narration);
  }
}

function TextColorSettings({ colors, setColors }: { colors: TextColors; setColors: (colors: TextColors) => void }) {
  const fields: Array<[keyof TextColors, string, string]> = [
    ["dialogue", "Dialogue", "Spoken lines"],
    ["action", "Action", "Actions and emotes"],
    ["narration", "Narration", "Scene and narrator prose"],
  ];

  return (
    <section className="rp-settings-section" aria-label="Roleplay text colors">
      <div className="rp-settings-heading">
        <div>
          <span>Roleplay display</span>
          <strong>Text colors</strong>
        </div>
        <Sparkles aria-hidden="true" />
      </div>
      <p>Uses the same dialogue, action, and narration defaults as Sandbox.</p>
      <div className="rp-color-grid">
        {fields.map(([key, label, hint]) => (
          <label key={key}>
            <span><strong>{label}</strong><small>{hint}</small></span>
            <span className="rp-color-control">
              <input type="color" value={colors[key]} onChange={(event) => setColors({ ...colors, [key]: event.target.value })} aria-label={`${label} color`} />
              <code>{colors[key].toUpperCase()}</code>
            </span>
          </label>
        ))}
      </div>
      <button type="button" className="rp-reset-colors" onClick={() => setColors(SANDBOX_TEXT_COLORS)}><RotateCcw /> Reset to Sandbox defaults</button>
    </section>
  );
}

function RelationshipCard({ relationship }: { relationship: RelationshipVisual }) {
  const metrics = [
    { label: "Trust", value: clamp(relationship.trust), icon: HeartHandshake },
    { label: "Tension", value: clamp(relationship.tension), icon: Zap },
    { label: "Respect", value: clamp(relationship.respect), icon: ShieldCheck },
  ];

  return (
    <section className="rs-card" aria-label="Relationship status">
      <div className="rs-card-heading">
        <div><span>Relationship system</span><strong>{relationship.label}</strong></div>
        <span className="rs-badge">RS</span>
      </div>
      <div className="rs-metrics">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div className="rs-metric" key={label}>
            <div className="rs-metric-label"><span><Icon /> {label}</span><strong>{Math.round(value)}</strong></div>
            <div className="rs-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}><span style={{ width: `${value}%` }} /></div>
          </div>
        ))}
      </div>
      <small>Values update here as the relationship system evolves.</small>
    </section>
  );
}

export function RoleplayVisuals() {
  const [colors, setColorsState] = useState<TextColors>(SANDBOX_TEXT_COLORS);
  const [relationship, setRelationship] = useState<RelationshipVisual>(DEFAULT_RELATIONSHIP);
  const [sceneRail, setSceneRail] = useState<HTMLElement | null>(null);
  const [settingsForm, setSettingsForm] = useState<HTMLElement | null>(null);

  const colorSignature = useMemo(() => `${colors.dialogue}:${colors.action}:${colors.narration}`, [colors]);

  function setColors(next: TextColors) {
    setColorsState(next);
    localStorage.setItem(TEXT_STYLE_KEY, JSON.stringify(next));
  }

  useEffect(() => {
    setColorsState(readStored(TEXT_STYLE_KEY, SANDBOX_TEXT_COLORS));
    setRelationship(readStored(RS_VISUAL_KEY, DEFAULT_RELATIONSHIP));
  }, []);

  useEffect(() => {
    const syncTargets = () => {
      setSceneRail(document.querySelector<HTMLElement>(".scene-rail"));
      const dialog = document.querySelector<HTMLElement>(".bitter-dialog");
      const form = dialog?.querySelector<HTMLElement>(".dialog-form") ?? null;
      setSettingsForm(form);
    };

    syncTargets();
    const observer = new MutationObserver(syncTargets);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const applyColors = () => {
      document.querySelectorAll<HTMLParagraphElement>(".message p").forEach((element) => colorizeMessage(element, colors));
    };

    applyColors();
    const observer = new MutationObserver(applyColors);
    const list = document.querySelector(".message-list");
    if (list) observer.observe(list, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [colorSignature, colors]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === RS_VISUAL_KEY) setRelationship(readStored(RS_VISUAL_KEY, DEFAULT_RELATIONSHIP));
      if (event.key === TEXT_STYLE_KEY) setColorsState(readStored(TEXT_STYLE_KEY, SANDBOX_TEXT_COLORS));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <>
      {sceneRail ? createPortal(<RelationshipCard relationship={relationship} />, sceneRail) : null}
      {settingsForm ? createPortal(<TextColorSettings colors={colors} setColors={setColors} />, settingsForm) : null}
    </>
  );
}
