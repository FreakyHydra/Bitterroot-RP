"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Compass, KeyRound, LoaderCircle, Map, MapPin, Moon, PawPrint, Play, Save, Send, Settings, Shield, Sparkles, Trees, UserRound, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Place = { id: string; name: string; kind: string; mood: string; description: string; landmarks: string[]; presence: string };
type Persona = { id: string; name: string; description: string };
type Message = { id: string; sender: "player" | "character"; speaker: string; text: string; createdAt: string };
type Story = { id: string; title: string; area: string; placeId: string; primaryCharacterId: string; speaker: string; description: string; opening: string; tags: string[] };
type LoreEntry = { id: string; title: string; category: string; summary: string; content: string };
type Session = { id: string; personaId: string; scenarioId: string; title: string; placeId: string; primaryCharacterId: string; messages: Message[]; updatedAt: string };
type ProviderConfig = { provider: "novelai" | "ollama"; model: string; token: string };

const PERSONA_KEY = "bitterroot.persona.v1";
const SESSION_KEY = "bitterroot.session.v1";
const PROVIDER_KEY = "bitterroot.provider.v1";
const TOKEN_KEY = "bitterroot.provider-token.v1";

const places: Place[] = [
  { id: "woods", name: "Whispering Woods", kind: "Ancient forest", mood: "Hushed · watchful · alive", description: "An old forest of dense boughs and half-remembered paths. Shadow Creek threads through its heart, while rare clearings offer beauty, refuge, or the dangerous illusion of safety.", landmarks: ["Shadow Creek", "Moonflower Meadow", "Hidden Haven Cave"], presence: "Travelers, foragers, wardens, and those who do not wish to be found." },
  { id: "hills", name: "Howling Hills", kind: "Eastern highlands", mood: "Wind-cut · territorial · remote", description: "Rugged country where distant calls carry for miles. The Brackenjaw community keeps its own laws here, protecting narrow valleys with warning stones and relentless patrols.", landmarks: ["Brackenjaw Range", "Ranger Station", "Warning Stones"], presence: "Brackenjaw families, patrol rangers, shepherds, and escorted outsiders." },
  { id: "bluffs", name: "Bitterroot Bluffs", kind: "Weathered cliffs", mood: "Exposed · ancient · unforgiving", description: "Stone sentinels scarred by weather and conflict. Old trails cling to the cliff faces, overlooking the woods and the grim institution built in their shadow.", landmarks: ["Cliff Road", "Old Battle Steps", "Orphanage Approach"], presence: "Climbers, couriers, scavengers, and the occasional watch patrol." },
  { id: "orphanage", name: "Bitterroot Orphanage", kind: "Former institution", mood: "Severe · haunted · unfinished", description: "A fenced stone complex near the bluffs, once ruled by neglect and harsh discipline. The old regime is gone, but its structures—and consequences—remain.", landmarks: ["Warden’s Watchtower", "North Dormitory", "Overgrown Yard"], presence: "Caretakers, survivors, guards, and those returning for answers." },
  { id: "peak", name: "Bitterroot Peak", kind: "Mountain summit", mood: "Sacred · perilous · far-seeing", description: "The region’s highest point, marked by ancient battles and older legends. From its upper slopes, every road through Bitterroot appears small enough to hold in one paw.", landmarks: ["Pilgrim’s Shelf", "Scar Pass", "The High Cairn"], presence: "Pilgrims, hunters, exiles, and creatures adapted to the cold heights." },
];

const stories: Story[] = [
  { id: "crossed-markers", title: "Beyond the Warning Stones", area: "Howling Hills · Brackenjaw Range", placeId: "east-marker-trail", primaryCharacterId: "ragna-holt", speaker: "Ragna Holt", description: "You crossed a boundary locals do not forgive. Veteran Ranger Ragna Holt finds you before the weather—or something worse—does.", opening: "Cold wind worries the split pines while Ragna steps onto the trail behind you, already holding the strap of her patrol axe. She does not shout. She points back toward the last claw-marked stone. “You passed three warnings. Give me one useful reason.”", tags: ["First contact", "Survival", "Earned trust"] },
  { id: "borrowed-badge", title: "The Borrowed Warden Badge", area: "Ranger Station · Dawn", placeId: "brackenjaw-ranger-station", primaryCharacterId: "pip-holt", speaker: "Pip Holt", description: "Pip Holt has taken an old brass badge and volunteered for a patrol no one assigned. Finding her is only the first problem.", opening: "Pip stands on a crate beside the patrol map, a scratched brass badge pinned crookedly to her shirt. She folds her arms exactly like Ragna. “You’re late. I was about to start without you.” From the next room comes the unmistakable sound of Ragna setting down a mug very carefully.", tags: ["Family history", "Consequences", "Local mystery"] },
];

const loreEntries: LoreEntry[] = [
  {
    id: "beastfolk",
    title: "The Beastfolk",
    category: "Origins",
    summary: "The peoples of Bitterroot and the feral lineages they came from.",
    content: "Humans never existed in Bitterroot.\n\nThe peoples of Bitterroot evolved from ancient feral animal lineages. Over countless generations, some developed greater intelligence, language, culture, tools, and civilization. These became the Beastfolk.\n\nTheir bodies evolved in different directions. Some are upright, some semi-upright, and some remain largely quadrupedal.\n\nWolves, foxes, bears, felines, birds, reptiles, ungulates, rodents, and many other lineages produced their own Beastfolk peoples.\n\nEvery settlement, kingdom, religion, war, invention, and piece of history in Bitterroot belongs to them.\n\nThis world has always belonged to the Beastfolk.",
  },
  {
    id: "predator-prey",
    title: "Predator and Prey",
    category: "Circle of Life",
    summary: "Civilization changed the rules around the food chain, but never erased it.",
    content: "Predator and prey relationships in Bitterroot remain much as they always were.\n\nBecoming Beastfolk did not erase instinct, diet, fear, or the old place each lineage held in the food chain. Predatory Beastfolk may still hunt prey Beastfolk in some regions, and prey lineages still grow up knowing which scents, tracks, calls, and territories mean danger.\n\nCivilization grew around that reality. Different communities created different laws, customs, taboos, and traditions for it. Some forbid hunting other Beastfolk. Some tolerate it only under particular circumstances. Others accept it as part of life.\n\nPredator and prey are not new social categories. They are ancient relationships that civilization inherited.",
  },
  {
    id: "circle-of-life",
    title: "The Circle of Life",
    category: "World Concepts",
    summary: "Life feeds life, and every culture has its own way of living with that truth.",
    content: "Everything eats. Everything is eaten. Everything dies, and everything eventually feeds something else.\n\nPredators hunt because their bodies demand it. Prey survive because theirs demand the same. Death feeds scavengers, soil, forests, rivers, insects, and the next generation.\n\nBeastfolk civilization did not end that cycle. It gave the cycle laws, customs, rituals, taboos, and meaning. Some cultures treat the hunt with reverence. Some see it as ordinary survival. Others draw hard lines around who may be hunted and when.\n\nThe Circle of Life is not one universal religion. It is simply a truth the peoples of Bitterroot cannot entirely escape: life survives by consuming life, and every creature eventually returns something to the world.",
  },
  {
    id: "before-industry",
    title: "Before Industry",
    category: "Everyday Life",
    summary: "A pre-industrial world built from timber, stone, fire, muscle, water, and craft.",
    content: "Bitterroot is a pre-industrial world. Roads, homes, tools, weapons, farms, mills, carts, boats, and fortifications are built through handcraft and hard labor.\n\nCommunities rely on timber, stone, leather, metalwork, fire, muscle, wind, and water. Distance matters. Weather matters. A broken bridge or a bad harvest can change the fate of a settlement.",
  },
  {
    id: "runic-magic",
    title: "Runic Magic",
    category: "Mysteries",
    summary: "Old markings, carved symbols, and power that sits quietly inside the world.",
    content: "Magic in Bitterroot leans toward the runic rather than the spectacular.\n\nSymbols may be carved into stone, tools, weapons, doors, graves, charms, or boundary markers. Some markings are practical and understood. Others are old, half-forgotten, or treated with caution.\n\nHow deep runic magic reaches into the world is not fully understood, even by those who use it. Bitterroot has room for alchemy, herbal potions, old rites, and supernatural things without turning everyday life into constant spellcasting.",
  },
];

const nav = [
  { value: "world", label: "World", icon: Compass }, { value: "places", label: "Places", icon: Map },
  { value: "people", label: "People", icon: Users }, { value: "stories", label: "Stories", icon: BookOpen },
  { value: "lore", label: "Lore", icon: Sparkles },
];

export default function Home() {
  const [tab, setTab] = useState("world");
  const [selectedPlace, setSelectedPlace] = useState("hills");
  const [screen, setScreen] = useState<"world" | "play">("world");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedLore, setSelectedLore] = useState<LoreEntry | null>(null);
  const [pendingStory, setPendingStory] = useState<number | null>(null);
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>({ provider: "novelai", model: "xialong-v1", token: "" });
  const currentPlace = places.find((place) => place.id === selectedPlace) ?? places[0];
  const visitPlace = (id: string) => { setSelectedPlace(id); setTab("places"); };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPersona(readStored<Persona>(localStorage, PERSONA_KEY));
      setSession(readStored<Session>(localStorage, SESSION_KEY));
      const savedProvider = readStored<Omit<ProviderConfig, "token">>(localStorage, PROVIDER_KEY);
      setProviderConfig({
        provider: savedProvider?.provider ?? "novelai",
        model: savedProvider?.model ?? "xialong-v1",
        token: sessionStorage.getItem(TOKEN_KEY) ?? "",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function saveSession(next: Session) {
    setSession(next);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }

  function beginStory(index: number, activePersona = persona) {
    if (!activePersona) {
      setPendingStory(index);
      setPersonaOpen(true);
      return;
    }
    const story = stories[index];
    if (session?.scenarioId === story.id && session.personaId === activePersona.id) {
      setScreen("play");
      return;
    }
    const now = new Date().toISOString();
    const next: Session = {
      id: crypto.randomUUID(), personaId: activePersona.id, scenarioId: story.id,
      title: story.title, placeId: story.placeId, primaryCharacterId: story.primaryCharacterId,
      updatedAt: now,
      messages: [{ id: crypto.randomUUID(), sender: "character", speaker: story.speaker, text: story.opening, createdAt: now }],
    };
    saveSession(next);
    setScreen("play");
  }

  function continueStory() {
    if (session && persona) setScreen("play");
    else if (session) setPersonaOpen(true);
    else beginStory(0);
  }

  function submitPersona(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const next: Persona = {
      id: persona?.id ?? `persona-${crypto.randomUUID()}`,
      name,
      description: String(form.get("description") ?? "").trim().slice(0, 1200),
    };
    setPersona(next);
    localStorage.setItem(PERSONA_KEY, JSON.stringify(next));
    setPersonaOpen(false);
    if (pendingStory !== null) {
      const storyIndex = pendingStory;
      setPendingStory(null);
      beginStory(storyIndex, next);
    } else if (session) beginStory(Math.max(0, stories.findIndex((story) => story.id === session.scenarioId)), next);
  }

  function saveProviderSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(PROVIDER_KEY, JSON.stringify({ provider: providerConfig.provider, model: providerConfig.model }));
    if (providerConfig.token) sessionStorage.setItem(TOKEN_KEY, providerConfig.token);
    else sessionStorage.removeItem(TOKEN_KEY);
    setSettingsOpen(false);
  }

  if (screen === "play" && session && persona) {
    return <PlayerScreen session={session} persona={persona} providerConfig={providerConfig} onSessionChange={saveSession} onExit={() => setScreen("world")} onSettings={() => setSettingsOpen(true)} settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} saveProviderSettings={saveProviderSettings} setProviderConfig={setProviderConfig} />;
  }

  return (
    <main className="site-shell">
      <div className="ambient-glow" aria-hidden="true" />
      <header className="topbar">
        <button className="wordmark" onClick={() => setTab("world")} aria-label="Bitterroot home">
          <span className="crest"><PawPrint /></span><span><strong>Bitterroot</strong><small>An interactive saga</small></span>
        </button>
        <div className="world-status"><span /> World awake <em>·</em> Late autumn, 312</div>
        <div className="top-actions">
          <button className="header-icon" onClick={() => setPersonaOpen(true)} aria-label="Edit persona"><UserRound /></button>
          <button className="header-icon" onClick={() => setSettingsOpen(true)} aria-label="Provider settings"><Settings /></button>
          <button className="continue-button" onClick={continueStory}><Play /> {session ? "Continue story" : "Begin story"}</button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="world-tabs">
        <TabsList variant="line" className="main-nav" aria-label="Bitterroot navigation">
          {nav.map(({ value, label, icon: Icon }) => <TabsTrigger key={value} value={value} className="nav-trigger"><Icon /><span>{label}</span></TabsTrigger>)}
        </TabsList>

        <TabsContent value="world" className="tab-panel">
          <section className="hero">
            <div className="hero-image" aria-hidden="true" /><div className="hero-scrim" aria-hidden="true" />
            <div className="hero-copy">
              <p className="eyebrow">The western wilds are listening</p><h1>Enter<br /><i>Bitterroot</i></h1>
              <p className="hero-description">A fixed, living world of old loyalties, hard choices, and stories that remember what you have done.</p>
              <div className="hero-actions">
                <button className="primary-action" onClick={() => visitPlace("hills")}>Enter the Howling Hills <ArrowRight /></button>
                <button className="text-action" onClick={() => setTab("places")}>Open the region map</button>
              </div>
            </div>
            <div className="hero-coordinate"><MapPin /> 44° N · Beyond the warning stones</div>
          </section>

          <section className="story-strip">
            <div className="story-kicker"><Moon /><span>Your ongoing story</span></div>
            <div className="story-copy"><p>{session ? "Saved journey" : "Chapter I"}</p><h2>{session?.title ?? "Beyond the Warning Stones"}</h2><span>{session ? `${session.messages.length} remembered turns` : "Howling Hills · Brackenjaw territory"}</span></div>
            <p className="story-summary">{session ? "Your last choices are preserved on this device. Return whenever you are ready." : "A patrol found your tracks at the edge of an isolated range. Ranger Holt has questions."}</p>
            <button onClick={continueStory} aria-label="Continue current Bitterroot story"><ArrowRight /></button>
          </section>

          <section className="content-section gateway-section">
            <header className="section-heading"><div><p className="eyebrow">Choose a direction</p><h2>Ways into the region</h2></div><p>Bitterroot is sparse, but never empty. Every place carries its own history—and notices your arrival.</p></header>
            <div className="gateway-grid">
              {places.map((place, index) => (
                <button key={place.id} className={`gateway-card gateway-${index + 1}`} onClick={() => visitPlace(place.id)}>
                  <span className="gateway-number">0{index + 1}</span><span className="gateway-content"><small>{place.kind}</small><strong>{place.name}</strong><em>{place.mood}</em></span><ChevronRight />
                </button>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="places" className="tab-panel inner-panel">
          <header className="page-heading"><p className="eyebrow">The lay of the land</p><h1>Places carry memory.</h1><p>Move through regions, communities, and landmarks. Who you encounter depends on where the road takes you.</p></header>
          <section className="place-explorer">
            <aside className="place-index"><span className="index-label">Region index</span>{places.map((place) => <button key={place.id} className={selectedPlace === place.id ? "active" : ""} onClick={() => setSelectedPlace(place.id)}><span>{place.name}</span><small>{place.kind}</small></button>)}</aside>
            <article className="place-feature">
              <div className={`place-art place-art-${currentPlace.id}`}><span>{currentPlace.kind}</span></div>
              <div className="place-detail"><p className="eyebrow">{currentPlace.mood}</p><h2>{currentPlace.name}</h2><p>{currentPlace.description}</p>
                <div className="detail-columns"><div><small>Known landmarks</small>{currentPlace.landmarks.map((item) => <span key={item}><MapPin />{item}</span>)}</div><div><small>Who may be here</small><p>{currentPlace.presence}</p></div></div>
                <button className="primary-action" onClick={() => setTab(currentPlace.id === "hills" ? "people" : "stories")}>Explore this place <ArrowRight /></button>
              </div>
            </article>
          </section>
        </TabsContent>

        <TabsContent value="people" className="tab-panel inner-panel">
          <header className="page-heading split-heading"><div><p className="eyebrow">Howling Hills · Brackenjaw Range</p><h1>Known at the ranger station.</h1></div><p>People appear through place and story context. Trust is personal, persistent, and earned separately by every persona.</p></header>
          <section className="cast-stage">
            <div className="cast-art" role="img" aria-label="Ragna and Pip Holt outside the Brackenjaw ranger station" />
            <article className="cast-card cast-primary"><div className="cast-meta"><Shield /><span>Veteran ranger · On patrol</span></div><h2>Ragna Holt</h2><p className="cast-line">“If I have to warn you twice, the hills will finish the lesson.”</p><p>Hard, terse, and exceptionally capable. Ragna protects through action, and greater trust earns loyalty—not a different temperament.</p><div className="trait-row"><span>Authoritative</span><span>Watchful</span><span>Territorial</span></div><button className="text-action" onClick={() => setTab("stories")}>Stories with Ragna <ArrowRight /></button></article>
            <article className="cast-card cast-secondary"><div className="cast-meta"><PawPrint /><span>Ranger hopeful · Age 12</span></div><h2>Pip Holt</h2><p>Scrappy, observant, and determined to take on duties she is not ready for. The crooked brass badge is borrowed. She insists it is temporary.</p><div className="trait-row"><span>Brave</span><span>Stubborn</span><span>Eager</span></div><button className="text-action" onClick={() => beginStory(1)}>Talk to Pip <ArrowRight /></button></article>
          </section>
          <div className="context-note"><Users /><div><strong>Living Cast</strong><span>Likely here: Ragna, station rangers · Possible: Pip · Distant residents stay out of context unless the story calls for them.</span></div></div>
        </TabsContent>

        <TabsContent value="stories" className="tab-panel inner-panel">
          <header className="page-heading"><p className="eyebrow">Curated beginnings · Persistent consequences</p><h1>Stories take root.</h1><p>Begin at a deliberate moment or return to a path already changed by your choices.</p></header>
          <section className="stories-layout">
            {stories.map((story, index) => <article className="story-card" key={story.title}><div className="story-number">0{index + 1}</div><div><p className="eyebrow">{story.area}</p><h2>{story.title}</h2><p>{story.description}</p><div className="trait-row">{story.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><button className="primary-action" onClick={() => beginStory(index)}>{session?.scenarioId === story.id ? "Continue" : "Begin"} <ArrowRight /></button></article>)}
            <aside className="save-panel"><Moon /><p>{session ? "Current thread" : "No journey begun"}</p><h3>{session?.title ?? "The road is waiting"}</h3><span>{persona ? `Persona: ${persona.name}` : "Create a persona to enter Bitterroot."}<br />{session ? `${session.messages.length} remembered turns` : "Stories autosave after every turn."}<br />Provider: {providerConfig.provider === "novelai" ? "NovelAI" : "Local Ollama"}</span><button className="text-action" onClick={continueStory}>{session ? "Return to story" : "Begin the first story"}</button></aside>
          </section>
        </TabsContent>

        <TabsContent value="lore" className="tab-panel inner-panel">
          <header className="page-heading split-heading"><div><p className="eyebrow">What the world knows</p><h1>The Bitterroot Codex.</h1></div><p>Open an entry to read it without leaving the world browser. More writings can be added as places, cultures, and histories grow.</p></header>
          <section className="place-index" aria-label="Bitterroot lore index">
            <span className="index-label">Known writings and world knowledge</span>
            {loreEntries.map((entry) => <button key={entry.id} onClick={() => setSelectedLore(entry)}><span>{entry.title}</span><small>{entry.category} · {entry.summary}</small></button>)}
          </section>
        </TabsContent>
      </Tabs>
      <footer><span>Bitterroot Saga</span><p>One authored world · Many remembered paths</p><span>Playable build · Dev</span></footer>

      <PersonaDialog open={personaOpen} setOpen={setPersonaOpen} persona={persona} onSubmit={submitPersona} />
      <ProviderDialog open={settingsOpen} setOpen={setSettingsOpen} config={providerConfig} setConfig={setProviderConfig} onSubmit={saveProviderSettings} />
      <LoreDialog entry={selectedLore} onOpenChange={(open) => { if (!open) setSelectedLore(null); }} />
    </main>
  );
}

function LoreDialog({ entry, onOpenChange }: { entry: LoreEntry | null; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={Boolean(entry)} onOpenChange={onOpenChange}><DialogContent className="bitter-dialog"><DialogHeader><div className="dialog-icon"><BookOpen /></div><DialogTitle>{entry?.title ?? "Lore"}</DialogTitle><DialogDescription>{entry?.category ?? "Bitterroot Codex"}</DialogDescription></DialogHeader><div style={{ whiteSpace: "pre-line", color: "#c8c8ba", font: "15px/1.85 Georgia, serif", maxHeight: "65vh", overflowY: "auto", paddingRight: "8px" }}>{entry?.content}</div></DialogContent></Dialog>;
}

function PlayerScreen({ session, persona, providerConfig, onSessionChange, onExit, onSettings, settingsOpen, setSettingsOpen, saveProviderSettings, setProviderConfig }: {
  session: Session;
  persona: Persona;
  providerConfig: ProviderConfig;
  onSessionChange: (session: Session) => void;
  onExit: () => void;
  onSettings: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  saveProviderSettings: (event: FormEvent<HTMLFormElement>) => void;
  setProviderConfig: (config: ProviderConfig) => void;
}) {
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const story = stories.find((entry) => entry.id === session.scenarioId) ?? stories[0];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [session.messages, loading]);

  async function requestReply(baseSession: Session) {
    if (providerConfig.provider === "novelai" && !providerConfig.token) {
      setError("Add your NovelAI access token before sending a turn.");
      onSettings();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(providerConfig.token ? { Authorization: `Bearer ${providerConfig.token}` } : {}),
        },
        body: JSON.stringify({
          provider: providerConfig.provider,
          model: providerConfig.model,
          maxTokens: 700,
          temperature: 0.86,
          context: {
            persona,
            placeId: baseSession.placeId,
            scenarioId: baseSession.scenarioId,
            primaryCharacterId: baseSession.primaryCharacterId,
            relationship: { label: "stranger", score: 0 },
            messages: baseSession.messages.slice(1).map((message) => ({
              sender: message.sender === "player" ? persona.name : message.speaker,
              text: message.text,
            })),
          },
        }),
      });
      const payload = await response.json() as { text?: string; error?: string };
      if (!response.ok || !payload.text) throw new Error(payload.error || "Bitterroot did not answer this turn.");
      const next: Session = {
        ...baseSession,
        updatedAt: new Date().toISOString(),
        messages: [...baseSession.messages, {
          id: crypto.randomUUID(), sender: "character", speaker: story.speaker,
          text: payload.text, createdAt: new Date().toISOString(),
        }],
      };
      onSessionChange(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bitterroot could not answer this turn.");
    } finally {
      setLoading(false);
    }
  }

  async function sendTurn() {
    const text = draft.trim();
    if (!text || loading) return;
    const next: Session = {
      ...session,
      updatedAt: new Date().toISOString(),
      messages: [...session.messages, {
        id: crypto.randomUUID(), sender: "player", speaker: persona.name,
        text: text.slice(0, 4000), createdAt: new Date().toISOString(),
      }],
    };
    setDraft("");
    onSessionChange(next);
    await requestReply(next);
  }

  function deleteMessage(messageId: string) {
    if (loading) return;
    const index = session.messages.findIndex((message) => message.id === messageId);
    if (index <= 0) return;
    const next: Session = {
      ...session,
      updatedAt: new Date().toISOString(),
      messages: session.messages.filter((message) => message.id !== messageId),
    };
    setError("");
    onSessionChange(next);
  }

  async function regenerateLatestReply() {
    if (loading) return;
    const latest = session.messages.at(-1);
    if (!latest || latest.sender !== "character" || session.messages.length <= 1) return;
    const base: Session = {
      ...session,
      updatedAt: new Date().toISOString(),
      messages: session.messages.slice(0, -1),
    };
    onSessionChange(base);
    await requestReply(base);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendTurn();
    }
  }

  return (
    <main className="play-shell">
      <header className="play-header">
        <button className="back-button" onClick={onExit}><ArrowLeft /> World</button>
        <div className="play-title"><span>{story.area}</span><strong>{session.title}</strong></div>
        <div className="play-tools"><span className="save-state"><Save /> Autosaved</span><button onClick={onSettings} aria-label="Provider settings"><Settings /></button></div>
      </header>
      <section className="play-layout">
        <aside className="scene-rail">
          <div className="scene-image" />
          <p className="eyebrow">Current place</p><h2>{story.placeId === "east-marker-trail" ? "Warning Stones" : "Ranger Station"}</h2>
          <p>{story.description}</p>
          <dl><div><dt>Persona</dt><dd>{persona.name}</dd></div><div><dt>Speaking with</dt><dd>{story.speaker}</dd></div><div><dt>Provider</dt><dd>{providerConfig.provider === "novelai" ? "NovelAI" : "Local Ollama"}</dd></div></dl>
          <div className="canon-chip"><Shield /><span>Character temperament and Bitterroot canon are enforced every turn.</span></div>
        </aside>
        <section className="conversation" aria-label="Roleplay conversation">
          <div className="message-list">
            <div className="chapter-marker"><span>Chapter I</span><strong>{session.title}</strong></div>
            {session.messages.map((message, index) => (
              <article key={message.id} className={`message message-${message.sender}`}>
                <header><span>{message.speaker}</span><time>{formatTime(message.createdAt)}</time></header>
                <p>{message.text}</p>
                {index > 0 && <div className="message-actions">
                  <button type="button" onClick={() => deleteMessage(message.id)} disabled={loading}>Delete</button>
                  {message.sender === "character" && index === session.messages.length - 1 && <button type="button" onClick={() => void regenerateLatestReply()} disabled={loading}>Regenerate</button>}
                </div>}
              </article>
            ))}
            {loading && <div className="thinking"><LoaderCircle /> Bitterroot is answering…</div>}
            {error && <div className="turn-error"><span>{error}</span><button onClick={() => void requestReply(session)}>Retry response</button></div>}
            <div ref={endRef} />
          </div>
          <div className="composer">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder={`What does ${persona.name} say or do?`} maxLength={4000} disabled={loading} aria-label="Your next roleplay turn" />
            <div className="composer-footer"><span>Enter to send · Shift+Enter for a new line</span><button onClick={() => void sendTurn()} disabled={!draft.trim() || loading}><Send /> Send turn</button></div>
          </div>
        </section>
      </section>
      <ProviderDialog open={settingsOpen} setOpen={setSettingsOpen} config={providerConfig} setConfig={setProviderConfig} onSubmit={saveProviderSettings} />
    </main>
  );
}

function PersonaDialog({ open, setOpen, persona, onSubmit }: { open: boolean; setOpen: (open: boolean) => void; persona: Persona | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="bitter-dialog"><DialogHeader><div className="dialog-icon"><UserRound /></div><DialogTitle>Who enters Bitterroot?</DialogTitle><DialogDescription>Your persona is kept separate from every other identity. Relationships and memories belong to this persona alone.</DialogDescription></DialogHeader><form className="dialog-form" onSubmit={onSubmit}><label>Name<input name="name" defaultValue={persona?.name ?? ""} maxLength={80} required placeholder="Your character’s name" /></label><label>Identity and appearance<textarea name="description" defaultValue={persona?.description ?? ""} maxLength={1200} placeholder="Species, body form, appearance, temperament, and anything the cast should know." /></label><p className="form-note">Bitterroot contains Beastfolk peoples only. No human personas.</p><button className="primary-action" type="submit">Save persona <ArrowRight /></button></form></DialogContent></Dialog>;
}

function ProviderDialog({ open, setOpen, config, setConfig, onSubmit }: { open: boolean; setOpen: (open: boolean) => void; config: ProviderConfig; setConfig: (config: ProviderConfig) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="bitter-dialog"><DialogHeader><div className="dialog-icon"><KeyRound /></div><DialogTitle>AI provider</DialogTitle><DialogDescription>Generation passes through Bitterroot’s server-side canon compiler. Your NovelAI token is held only for this browser tab and is never written into a story save.</DialogDescription></DialogHeader><form className="dialog-form" onSubmit={onSubmit}><label>Provider<Select value={config.provider} onValueChange={(value) => setConfig({ ...config, provider: value as ProviderConfig["provider"], model: value === "novelai" ? "xialong-v1" : "llama3.1:8b" })}><SelectTrigger className="bitter-select"><SelectValue /></SelectTrigger><SelectContent className="bitter-select-menu"><SelectItem value="novelai">NovelAI</SelectItem><SelectItem value="ollama">Local Ollama</SelectItem></SelectContent></Select></label>{config.provider === "novelai" ? <><label>Model<Select value={config.model} onValueChange={(model) => setConfig({ ...config, model })}><SelectTrigger className="bitter-select"><SelectValue /></SelectTrigger><SelectContent className="bitter-select-menu"><SelectItem value="xialong-v1">Xiaolong</SelectItem><SelectItem value="glm-4-6">GLM 4.6</SelectItem></SelectContent></Select></label><label>NovelAI access token<input type="password" value={config.token} onChange={(event) => setConfig({ ...config, token: event.target.value })} autoComplete="off" placeholder="Bearer token" /></label></> : <label>Ollama model<input value={config.model} onChange={(event) => setConfig({ ...config, model: event.target.value })} placeholder="llama3.1:8b" required /></label>}<button className="primary-action" type="submit">Save provider <ArrowRight /></button></form></DialogContent></Dialog>;
}

function readStored<T>(storage: Storage, key: string): T | null {
  try { const value = storage.getItem(key); return value ? JSON.parse(value) as T : null; }
  catch { return null; }
}

function formatTime(value: string) {
  try { return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
  catch { return ""; }
}