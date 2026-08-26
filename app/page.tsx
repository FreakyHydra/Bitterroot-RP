"use client";

import { useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, Compass, Map, MapPin, Moon, PawPrint, Play, Shield, Sparkles, Trees, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Place = { id: string; name: string; kind: string; mood: string; description: string; landmarks: string[]; presence: string };

const places: Place[] = [
  { id: "woods", name: "Whispering Woods", kind: "Ancient forest", mood: "Hushed · watchful · alive", description: "An old forest of dense boughs and half-remembered paths. Shadow Creek threads through its heart, while rare clearings offer beauty, refuge, or the dangerous illusion of safety.", landmarks: ["Shadow Creek", "Moonflower Meadow", "Hidden Haven Cave"], presence: "Travelers, foragers, wardens, and those who do not wish to be found." },
  { id: "hills", name: "Howling Hills", kind: "Eastern highlands", mood: "Wind-cut · territorial · remote", description: "Rugged country where distant calls carry for miles. The Brackenjaw community keeps its own laws here, protecting narrow valleys with warning stones and relentless patrols.", landmarks: ["Brackenjaw Range", "Ranger Station", "Warning Stones"], presence: "Brackenjaw families, patrol rangers, shepherds, and escorted outsiders." },
  { id: "bluffs", name: "Bitterroot Bluffs", kind: "Weathered cliffs", mood: "Exposed · ancient · unforgiving", description: "Stone sentinels scarred by weather and conflict. Old trails cling to the cliff faces, overlooking the woods and the grim institution built in their shadow.", landmarks: ["Cliff Road", "Old Battle Steps", "Orphanage Approach"], presence: "Climbers, couriers, scavengers, and the occasional watch patrol." },
  { id: "orphanage", name: "Bitterroot Orphanage", kind: "Former institution", mood: "Severe · haunted · unfinished", description: "A fenced stone complex near the bluffs, once ruled by neglect and harsh discipline. The old regime is gone, but its structures—and consequences—remain.", landmarks: ["Warden’s Watchtower", "North Dormitory", "Overgrown Yard"], presence: "Caretakers, survivors, guards, and those returning for answers." },
  { id: "peak", name: "Bitterroot Peak", kind: "Mountain summit", mood: "Sacred · perilous · far-seeing", description: "The region’s highest point, marked by ancient battles and older legends. From its upper slopes, every road through Bitterroot appears small enough to hold in one paw.", landmarks: ["Pilgrim’s Shelf", "Scar Pass", "The High Cairn"], presence: "Pilgrims, hunters, exiles, and creatures adapted to the cold heights." },
];

const stories = [
  { title: "Beyond the Warning Stones", area: "Howling Hills · Brackenjaw Range", description: "You crossed a boundary locals do not forgive. Veteran Ranger Ragna Holt finds you before the weather—or something worse—does.", tags: ["First contact", "Survival", "Earned trust"] },
  { title: "The Borrowed Warden Badge", area: "Ranger Station · Dawn", description: "Pip Holt has taken an old brass badge and volunteered for a patrol no one assigned. Finding her is only the first problem.", tags: ["Family history", "Consequences", "Local mystery"] },
];

const nav = [
  { value: "world", label: "World", icon: Compass }, { value: "places", label: "Places", icon: Map },
  { value: "people", label: "People", icon: Users }, { value: "stories", label: "Stories", icon: BookOpen },
  { value: "lore", label: "Lore", icon: Sparkles },
];

export default function Home() {
  const [tab, setTab] = useState("world");
  const [selectedPlace, setSelectedPlace] = useState("hills");
  const currentPlace = places.find((place) => place.id === selectedPlace) ?? places[0];
  const visitPlace = (id: string) => { setSelectedPlace(id); setTab("places"); };

  return (
    <main className="site-shell">
      <div className="ambient-glow" aria-hidden="true" />
      <header className="topbar">
        <button className="wordmark" onClick={() => setTab("world")} aria-label="Bitterroot home">
          <span className="crest"><PawPrint /></span><span><strong>Bitterroot</strong><small>An interactive saga</small></span>
        </button>
        <div className="world-status"><span /> World awake <em>·</em> Late autumn, 312</div>
        <button className="continue-button" onClick={() => setTab("stories")}><Play /> Continue story</button>
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
            <div className="story-copy"><p>Chapter I</p><h2>Beyond the Warning Stones</h2><span>Howling Hills · Brackenjaw territory</span></div>
            <p className="story-summary">A patrol found your tracks at the edge of an isolated range. Ranger Holt has questions.</p>
            <button onClick={() => setTab("stories")} aria-label="Continue Beyond the Warning Stones"><ArrowRight /></button>
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
            <article className="cast-card cast-secondary"><div className="cast-meta"><PawPrint /><span>Ranger hopeful · Age 12</span></div><h2>Pip Holt</h2><p>Scrappy, observant, and determined to take on duties she is not ready for. The crooked brass badge is borrowed. She insists it is temporary.</p><div className="trait-row"><span>Brave</span><span>Stubborn</span><span>Eager</span></div></article>
          </section>
          <div className="context-note"><Users /><div><strong>Living Cast</strong><span>Likely here: Ragna, station rangers · Possible: Pip · Distant residents stay out of context unless the story calls for them.</span></div></div>
        </TabsContent>

        <TabsContent value="stories" className="tab-panel inner-panel">
          <header className="page-heading"><p className="eyebrow">Curated beginnings · Persistent consequences</p><h1>Stories take root.</h1><p>Begin at a deliberate moment or return to a path already changed by your choices.</p></header>
          <section className="stories-layout">
            {stories.map((story, index) => <article className="story-card" key={story.title}><div className="story-number">0{index + 1}</div><div><p className="eyebrow">{story.area}</p><h2>{story.title}</h2><p>{story.description}</p><div className="trait-row">{story.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><button className="primary-action">{index === 0 ? "Continue" : "Begin"} <ArrowRight /></button></article>)}
            <aside className="save-panel"><Moon /><p>Current thread</p><h3>Tracks beneath fresh sleet</h3><span>Ragna’s trust: guarded<br />Pip’s opinion: fascinated<br />Last played: Ranger Station</span><button className="text-action">View remembered choices</button></aside>
          </section>
        </TabsContent>

        <TabsContent value="lore" className="tab-panel inner-panel">
          <header className="page-heading split-heading"><div><p className="eyebrow">What the world knows</p><h1>A land shaped by tooth, paw, and promise.</h1></div><p>Lore is revealed through travel, relationships, and consequence. What appears here is what your story can reasonably know.</p></header>
          <section className="lore-grid">
            <article className="lore-lead"><Trees /><span>I</span><h2>No human world</h2><p>Bitterroot belongs entirely to speaking feral peoples. They walk in mixed body forms—four-footed, semi-upright, and upright—without becoming human beneath the fur.</p></article>
            <article><span>II</span><h2>Before industry</h2><p>Roads are cut by paw and hand. Communities rely on timber, stone, leather, fire, muscle, water, and hard-won craft. Distance still matters.</p></article>
            <article><span>III</span><h2>Freedom has weight</h2><p>There are no clean alignments. Tradition can shelter or constrain; survival can demand mercy or cruelty. The world remembers which you choose.</p></article>
            <article><span>IV</span><h2>Relationships persist</h2><p>Trust belongs to a particular character and a particular persona. History does not leak between identities, and closeness never erases temperament.</p></article>
          </section>
        </TabsContent>
      </Tabs>
      <footer><span>Bitterroot Saga</span><p>One authored world · Many remembered paths</p><span>Prototype · Dev</span></footer>
    </main>
  );
}
