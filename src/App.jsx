import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Pencil, X, Check, Package, Bug, ClipboardCheck, Rocket, Folder, Smartphone, Apple } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const DOC_REF = doc(db, "apptracker", "shared");

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyData = () => ({
  projects: [],
  versions: [],
  bugs: [],
  tests: [],
  updates: [],
});

const PLATFORMS = [
  { id: "android", label: "Android", color: "var(--success)", bg: "var(--success-bg)" },
  { id: "ios", label: "iOS", color: "var(--info)", bg: "var(--info-bg)" },
  { id: "keduanya", label: "Keduanya", color: "var(--accent-text)", bg: "var(--accent-bg)" },
];

const SEVERITIES = [
  { id: "rendah", label: "Rendah", color: "var(--info)", bg: "var(--info-bg)" },
  { id: "sedang", label: "Sedang", color: "var(--warning)", bg: "var(--warning-bg)" },
  { id: "tinggi", label: "Tinggi", color: "var(--accent-text)", bg: "var(--accent-bg)" },
  { id: "kritis", label: "Kritis", color: "var(--danger)", bg: "var(--danger-bg)" },
];

const BUG_STATUSES = [
  { id: "terbuka", label: "Terbuka" },
  { id: "diproses", label: "Diproses" },
  { id: "selesai", label: "Selesai" },
];

const TEST_STATUSES = [
  { id: "belum", label: "Belum diuji", color: "var(--text-faint)", bg: "var(--panel-hover)" },
  { id: "lulus", label: "Lulus", color: "var(--success)", bg: "var(--success-bg)" },
  { id: "gagal", label: "Gagal", color: "var(--danger)", bg: "var(--danger-bg)" },
];

const UPDATE_PRIORITIES = [
  { id: "rendah", label: "Rendah", color: "var(--info)", bg: "var(--info-bg)" },
  { id: "sedang", label: "Sedang", color: "var(--warning)", bg: "var(--warning-bg)" },
  { id: "tinggi", label: "Tinggi", color: "var(--danger)", bg: "var(--danger-bg)" },
];

const UPDATE_STATUSES = [
  { id: "rencana", label: "Direncanakan" },
  { id: "diproses", label: "Diproses" },
  { id: "selesai", label: "Selesai" },
];

function findMeta(list, id) {
  return list.find((x) => x.id === id) || list[0];
}

function platformMeta(id) {
  return findMeta(PLATFORMS, id || "keduanya");
}

function PlatformIcon({ id, size = 11 }) {
  if (id === "android") return <Smartphone size={size} />;
  if (id === "ios") return <Apple size={size} />;
  return null;
}

function Pill({ label, color, bg, onClick, active, icon }) {
  return (
    <button
      onClick={onClick}
      className="pill"
      style={{
        color: color,
        background: bg,
        borderColor: active ? color : "transparent",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function TextField({ label, value, onChange, placeholder, textarea, mono }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <Comp
        className={"field-input" + (mono ? " mono" : "")}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={textarea ? 3 : undefined}
      />
    </label>
  );
}

function PlatformPicker({ value, onChange }) {
  return (
    <div className="field">
      <span className="field-label">Platform</span>
      <div className="pill-row">
        {PLATFORMS.map((p) => (
          <Pill
            key={p.id}
            label={p.label}
            color={p.color}
            bg={p.bg}
            active={value === p.id}
            icon={<PlatformIcon id={p.id} />}
            onClick={() => onChange(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PlatformFilter({ value, onChange }) {
  const options = [{ id: "semua", label: "Semua" }, ...PLATFORMS];
  return (
    <div className="platform-filter">
      {options.map((p) => (
        <button
          key={p.id}
          className={"filter-chip" + (value === p.id ? " filter-chip-active" : "")}
          onClick={() => onChange(p.id)}
        >
          {p.id !== "semua" && <PlatformIcon id={p.id} size={12} />}
          {p.label}
        </button>
      ))}
    </div>
  );
}

export default function AppTracker() {
  const [data, setData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState("versions");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", versionAndroid: "", versionIos: "", description: "" });
  const [forms, setForms] = useState({});
  const [filters, setFilters] = useState({ versions: "semua", bugs: "semua", tests: "semua", updates: "semua" });
  const saveTimer = useRef(null);
  const remoteUpdate = useRef(false);
  const hasSetInitialProject = useRef(false);
  const [connError, setConnError] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      DOC_REF,
      (snap) => {
        remoteUpdate.current = true;
        const parsed = snap.exists() ? snap.data() : emptyData();
        const normalized = { ...emptyData(), ...parsed };
        setData(normalized);
        if (!hasSetInitialProject.current && normalized.projects.length) {
          hasSetInitialProject.current = true;
          setActiveProjectId(normalized.projects[0].id);
        }
        setLoaded(true);
        setConnError(false);
      },
      (err) => {
        console.error(err);
        setConnError(true);
        setData((d) => d || emptyData());
        setLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loaded || !data) return;
    if (remoteUpdate.current) {
      remoteUpdate.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDoc(DOC_REF, data).catch((e) => {
        console.error(e);
        setConnError(true);
      });
    }, 400);
  }, [data, loaded]);

  if (!loaded || !data) {
    return (
      <div className="loading-screen">
        <style>{baseCss}</style>
        <div className="loading-text">Memuat data...</div>
      </div>
    );
  }

  const projects = data.projects;
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  function addProject() {
    if (!newProject.name.trim()) return;
    const proj = {
      id: uid(),
      name: newProject.name.trim(),
      versionAndroid: newProject.versionAndroid.trim() || "0.1.0",
      versionIos: newProject.versionIos.trim() || "0.1.0",
      description: newProject.description.trim(),
      createdAt: Date.now(),
    };
    setData((d) => ({ ...d, projects: [...d.projects, proj] }));
    setActiveProjectId(proj.id);
    setNewProject({ name: "", versionAndroid: "", versionIos: "", description: "" });
    setShowProjectForm(false);
    setActiveTab("versions");
  }

  function deleteProject(id) {
    setData((d) => ({
      projects: d.projects.filter((p) => p.id !== id),
      versions: d.versions.filter((v) => v.projectId !== id),
      bugs: d.bugs.filter((b) => b.projectId !== id),
      tests: d.tests.filter((t) => t.projectId !== id),
      updates: d.updates.filter((u) => u.projectId !== id),
    }));
    if (activeProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      setActiveProjectId(remaining.length ? remaining[0].id : null);
    }
  }

  function updateProjectVersion(id, platform, version) {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) => {
        if (p.id !== id) return p;
        if (platform === "android") return { ...p, versionAndroid: version };
        if (platform === "ios") return { ...p, versionIos: version };
        return { ...p, versionAndroid: version, versionIos: version };
      }),
    }));
  }

  function addEntity(key, projectId, payload) {
    const item = { id: uid(), projectId, createdAt: Date.now(), ...payload };
    setData((d) => ({ ...d, [key]: [item, ...d[key]] }));
  }
  function removeEntity(key, id) {
    setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
  }
  function patchEntity(key, id, patch) {
    setData((d) => ({ ...d, [key]: d[key].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }

  function setForm(key, val) {
    setForms((f) => ({ ...f, [key]: val }));
  }

  function setFilter(key, val) {
    setFilters((f) => ({ ...f, [key]: val }));
  }

  function byPlatform(list, filterKey) {
    const f = filters[filterKey];
    if (f === "semua") return list;
    return list.filter((x) => (x.platform || "keduanya") === f);
  }

  const allVersions = activeProject ? data.versions.filter((v) => v.projectId === activeProject.id).sort((a, b) => b.date?.localeCompare(a.date) || b.createdAt - a.createdAt) : [];
  const allBugs = activeProject ? data.bugs.filter((b) => b.projectId === activeProject.id).sort((a, b) => b.createdAt - a.createdAt) : [];
  const allTests = activeProject ? data.tests.filter((t) => t.projectId === activeProject.id).sort((a, b) => b.createdAt - a.createdAt) : [];
  const allUpdates = activeProject ? data.updates.filter((u) => u.projectId === activeProject.id).sort((a, b) => b.createdAt - a.createdAt) : [];

  const projectVersions = byPlatform(allVersions, "versions");
  const projectBugs = byPlatform(allBugs, "bugs");
  const projectTests = byPlatform(allTests, "tests");
  const projectUpdates = byPlatform(allUpdates, "updates");

  const openBugCount = allBugs.filter((b) => b.status !== "selesai").length;
  const failTestCount = allTests.filter((t) => t.status === "gagal").length;

  const tabs = [
    { id: "versions", label: "Versi", icon: Package, count: allVersions.length },
    { id: "bugs", label: "Bug", icon: Bug, count: openBugCount },
    { id: "tests", label: "Testing", icon: ClipboardCheck, count: failTestCount, countBad: true },
    { id: "updates", label: "Update berikutnya", icon: Rocket, count: allUpdates.filter((u) => u.status !== "selesai").length },
  ];

  return (
    <div className="app-shell">
      <style>{baseCss}</style>

      {connError && (
        <div className="conn-banner">
          Tidak bisa terhubung ke database. Cek koneksi internet, atau konfigurasi Firebase di <code>src/firebase.js</code> dan aturan Firestore-nya.
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <span className="brand-mark">◈</span>
            <span className="brand-name">Pantauan Rilis</span>
          </div>
        </div>

        <div className="sidebar-section-label">Proyek</div>
        <div className="project-list">
          {projects.map((p) => (
            <button
              key={p.id}
              className={"project-item" + (p.id === activeProjectId ? " active" : "")}
              onClick={() => setActiveProjectId(p.id)}
            >
              <Folder size={14} className="project-item-icon" />
              <span className="project-item-name">{p.name}</span>
              <span className="version-tag-group">
                <span className="version-tag xs"><Smartphone size={10} />{p.versionAndroid}</span>
                <span className="version-tag xs"><Apple size={10} />{p.versionIos}</span>
              </span>
            </button>
          ))}
          {projects.length === 0 && !showProjectForm && (
            <div className="empty-hint">Belum ada proyek. Tambahkan proyek pertama.</div>
          )}
        </div>

        {showProjectForm ? (
          <div className="new-project-form">
            <TextField label="Nama proyek" value={newProject.name} onChange={(v) => setNewProject((s) => ({ ...s, name: v }))} placeholder="Aplikasi JKT48 Subscription" />
            <div className="add-card-row">
              <TextField label="Versi Android" value={newProject.versionAndroid} onChange={(v) => setNewProject((s) => ({ ...s, versionAndroid: v }))} placeholder="1.0.0" mono />
              <TextField label="Versi iOS" value={newProject.versionIos} onChange={(v) => setNewProject((s) => ({ ...s, versionIos: v }))} placeholder="1.0.0" mono />
            </div>
            <TextField label="Deskripsi" value={newProject.description} onChange={(v) => setNewProject((s) => ({ ...s, description: v }))} placeholder="Singkat, opsional" textarea />
            <div className="form-actions">
              <button className="btn btn-primary" onClick={addProject}><Check size={14} /> Simpan</button>
              <button className="btn" onClick={() => { setShowProjectForm(false); setNewProject({ name: "", versionAndroid: "", versionIos: "", description: "" }); }}><X size={14} /> Batal</button>
            </div>
          </div>
        ) : (
          <button className="add-project-btn" onClick={() => setShowProjectForm(true)}>
            <Plus size={14} /> Tambah proyek
          </button>
        )}
      </aside>

      <main className="main">
        {!activeProject ? (
          <div className="no-project">
            <div className="no-project-mark">◈</div>
            <p>Pilih atau tambahkan proyek untuk mulai memantau versi, bug, testing, dan update.</p>
          </div>
        ) : (
          <>
            <header className="project-header">
              <div className="project-header-left">
                <h1 className="project-title">{activeProject.name}</h1>
                {activeProject.description && <p className="project-desc">{activeProject.description}</p>}
              </div>
              <div className="project-header-right">
                <div className="current-version-block">
                  <span className="current-version-label"><Smartphone size={11} /> Android</span>
                  <input
                    className="current-version-value"
                    value={activeProject.versionAndroid}
                    onChange={(e) => updateProjectVersion(activeProject.id, "android", e.target.value)}
                  />
                </div>
                <div className="current-version-block">
                  <span className="current-version-label"><Apple size={11} /> iOS</span>
                  <input
                    className="current-version-value"
                    value={activeProject.versionIos}
                    onChange={(e) => updateProjectVersion(activeProject.id, "ios", e.target.value)}
                  />
                </div>
                <button className="icon-btn danger" title="Hapus proyek" onClick={() => deleteProject(activeProject.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </header>

            <nav className="tab-row">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={"tab" + (activeTab === t.id ? " tab-active" : "")}
                  onClick={() => setActiveTab(t.id)}
                >
                  <t.icon size={15} />
                  {t.label}
                  {t.count > 0 && (
                    <span className={"tab-count" + (t.countBad ? " tab-count-bad" : "")}>{t.count}</span>
                  )}
                </button>
              ))}
            </nav>

            <div className="tab-content">
              {activeTab === "versions" && (
                <VersionsPanel
                  items={projectVersions}
                  filter={filters.versions}
                  onFilter={(v) => setFilter("versions", v)}
                  form={forms.version || { version: "", date: "", notes: "", platform: "keduanya" }}
                  setForm={(v) => setForm("version", v)}
                  onAdd={() => {
                    const f = forms.version || {};
                    if (!f.version?.trim()) return;
                    const platform = f.platform || "keduanya";
                    addEntity("versions", activeProject.id, {
                      version: f.version.trim(),
                      date: f.date || new Date().toISOString().slice(0, 10),
                      notes: f.notes?.trim() || "",
                      platform,
                    });
                    updateProjectVersion(activeProject.id, platform, f.version.trim());
                    setForm("version", { version: "", date: "", notes: "", platform: "keduanya" });
                  }}
                  onDelete={(id) => removeEntity("versions", id)}
                />
              )}

              {activeTab === "bugs" && (
                <BugsPanel
                  items={projectBugs}
                  filter={filters.bugs}
                  onFilter={(v) => setFilter("bugs", v)}
                  form={forms.bug || { title: "", description: "", severity: "sedang", platform: "keduanya" }}
                  setForm={(v) => setForm("bug", v)}
                  onAdd={() => {
                    const f = forms.bug || {};
                    if (!f.title?.trim()) return;
                    addEntity("bugs", activeProject.id, {
                      title: f.title.trim(),
                      description: f.description?.trim() || "",
                      severity: f.severity || "sedang",
                      platform: f.platform || "keduanya",
                      status: "terbuka",
                    });
                    setForm("bug", { title: "", description: "", severity: "sedang", platform: "keduanya" });
                  }}
                  onDelete={(id) => removeEntity("bugs", id)}
                  onStatusChange={(id, status) => patchEntity("bugs", id, { status })}
                />
              )}

              {activeTab === "tests" && (
                <TestsPanel
                  items={projectTests}
                  filter={filters.tests}
                  onFilter={(v) => setFilter("tests", v)}
                  form={forms.test || { feature: "", notes: "", platform: "keduanya" }}
                  setForm={(v) => setForm("test", v)}
                  onAdd={() => {
                    const f = forms.test || {};
                    if (!f.feature?.trim()) return;
                    addEntity("tests", activeProject.id, {
                      feature: f.feature.trim(),
                      notes: f.notes?.trim() || "",
                      platform: f.platform || "keduanya",
                      status: "belum",
                    });
                    setForm("test", { feature: "", notes: "", platform: "keduanya" });
                  }}
                  onDelete={(id) => removeEntity("tests", id)}
                  onStatusChange={(id, status) => patchEntity("tests", id, { status })}
                />
              )}

              {activeTab === "updates" && (
                <UpdatesPanel
                  items={projectUpdates}
                  filter={filters.updates}
                  onFilter={(v) => setFilter("updates", v)}
                  form={forms.update || { title: "", description: "", priority: "sedang", platform: "keduanya" }}
                  setForm={(v) => setForm("update", v)}
                  onAdd={() => {
                    const f = forms.update || {};
                    if (!f.title?.trim()) return;
                    addEntity("updates", activeProject.id, {
                      title: f.title.trim(),
                      description: f.description?.trim() || "",
                      priority: f.priority || "sedang",
                      platform: f.platform || "keduanya",
                      status: "rencana",
                    });
                    setForm("update", { title: "", description: "", priority: "sedang", platform: "keduanya" });
                  }}
                  onDelete={(id) => removeEntity("updates", id)}
                  onStatusChange={(id, status) => patchEntity("updates", id, { status })}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function VersionsPanel({ items, filter, onFilter, form, setForm, onAdd, onDelete }) {
  return (
    <div className="panel-body">
      <div className="add-card">
        <div className="add-card-row">
          <TextField label="Nomor versi" value={form.version} onChange={(v) => setForm({ ...form, version: v })} placeholder="1.2.0" mono />
          <TextField label="Tanggal" value={form.date} onChange={(v) => setForm({ ...form, date: v })} placeholder="2026-09-14" mono />
        </div>
        <PlatformPicker value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} />
        <TextField label="Catatan rilis" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Apa yang berubah di versi ini" textarea />
        <button className="btn btn-primary btn-add" onClick={onAdd}><Plus size={14} /> Catat versi</button>
      </div>

      <PlatformFilter value={filter} onChange={onFilter} />

      <div className="timeline">
        {items.map((v, i) => {
          const pm = platformMeta(v.platform);
          return (
            <div className="timeline-item" key={v.id}>
              <div className="timeline-dot" />
              <div className="timeline-line" style={{ display: i === items.length - 1 ? "none" : "block" }} />
              <div className="timeline-card">
                <div className="timeline-card-top">
                  <span className="version-tag lg">{v.version}</span>
                  <span className="pill" style={{ color: pm.color, background: pm.bg }}><PlatformIcon id={v.platform} /> {pm.label}</span>
                  <span className="date-tag">{v.date}</span>
                  <button className="icon-btn danger small" onClick={() => onDelete(v.id)}><Trash2 size={13} /></button>
                </div>
                {v.notes && <p className="timeline-notes">{v.notes}</p>}
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="empty-state">Belum ada riwayat versi tercatat.</div>}
      </div>
    </div>
  );
}

function BugsPanel({ items, filter, onFilter, form, setForm, onAdd, onDelete, onStatusChange }) {
  return (
    <div className="panel-body">
      <div className="add-card">
        <TextField label="Judul bug" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Tombol simpan tidak berfungsi di halaman lowongan" />
        <TextField label="Deskripsi" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Langkah reproduksi, perilaku yang diharapkan, dsb" textarea />
        <div className="add-card-row">
          <div className="field">
            <span className="field-label">Tingkat keparahan</span>
            <div className="pill-row">
              {SEVERITIES.map((s) => (
                <Pill key={s.id} label={s.label} color={s.color} bg={s.bg} active={form.severity === s.id} onClick={() => setForm({ ...form, severity: s.id })} />
              ))}
            </div>
          </div>
        </div>
        <PlatformPicker value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} />
        <button className="btn btn-primary btn-add" onClick={onAdd}><Plus size={14} /> Catat bug</button>
      </div>

      <PlatformFilter value={filter} onChange={onFilter} />

      <div className="list">
        {items.map((b) => {
          const sev = findMeta(SEVERITIES, b.severity);
          const pm = platformMeta(b.platform);
          return (
            <div className="list-card" key={b.id} style={{ borderLeftColor: sev.color }}>
              <div className="list-card-top">
                <span className="pill" style={{ color: sev.color, background: sev.bg }}>{sev.label}</span>
                <span className="pill" style={{ color: pm.color, background: pm.bg }}><PlatformIcon id={b.platform} /> {pm.label}</span>
                <select className="status-select" value={b.status} onChange={(e) => onStatusChange(b.id, e.target.value)}>
                  {BUG_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button className="icon-btn danger small" onClick={() => onDelete(b.id)}><Trash2 size={13} /></button>
              </div>
              <h3 className="list-card-title">{b.title}</h3>
              {b.description && <p className="list-card-desc">{b.description}</p>}
            </div>
          );
        })}
        {items.length === 0 && <div className="empty-state">Belum ada bug tercatat. Bagus!</div>}
      </div>
    </div>
  );
}

function TestsPanel({ items, filter, onFilter, form, setForm, onAdd, onDelete, onStatusChange }) {
  return (
    <div className="panel-body">
      <div className="add-card">
        <TextField label="Nama fitur yang diuji" value={form.feature} onChange={(v) => setForm({ ...form, feature: v })} placeholder="Login dengan Google" />
        <TextField label="Catatan" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Skenario pengujian, opsional" textarea />
        <PlatformPicker value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} />
        <button className="btn btn-primary btn-add" onClick={onAdd}><Plus size={14} /> Tambah item testing</button>
      </div>

      <PlatformFilter value={filter} onChange={onFilter} />

      <div className="list">
        {items.map((t) => {
          const pm = platformMeta(t.platform);
          return (
            <div className="list-card checklist-card" key={t.id}>
              <div className="checklist-main">
                <div className="list-card-top" style={{ marginBottom: 4 }}>
                  <span className="pill" style={{ color: pm.color, background: pm.bg }}><PlatformIcon id={t.platform} /> {pm.label}</span>
                </div>
                <h3 className="list-card-title">{t.feature}</h3>
                {t.notes && <p className="list-card-desc">{t.notes}</p>}
              </div>
              <div className="checklist-actions">
                <div className="pill-row">
                  {TEST_STATUSES.map((s) => (
                    <Pill key={s.id} label={s.label} color={s.color} bg={s.bg} active={t.status === s.id} onClick={() => onStatusChange(t.id, s.id)} />
                  ))}
                </div>
                <button className="icon-btn danger small" onClick={() => onDelete(t.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="empty-state">Belum ada fitur yang diuji.</div>}
      </div>
    </div>
  );
}

function UpdatesPanel({ items, filter, onFilter, form, setForm, onAdd, onDelete, onStatusChange }) {
  return (
    <div className="panel-body">
      <div className="add-card">
        <TextField label="Judul update" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Integrasi pembayaran otomatis" />
        <TextField label="Deskripsi" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Detail rencana, opsional" textarea />
        <div className="field">
          <span className="field-label">Prioritas</span>
          <div className="pill-row">
            {UPDATE_PRIORITIES.map((p) => (
              <Pill key={p.id} label={p.label} color={p.color} bg={p.bg} active={form.priority === p.id} onClick={() => setForm({ ...form, priority: p.id })} />
            ))}
          </div>
        </div>
        <PlatformPicker value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} />
        <button className="btn btn-primary btn-add" onClick={onAdd}><Plus size={14} /> Tambah rencana</button>
      </div>

      <PlatformFilter value={filter} onChange={onFilter} />

      <div className="list">
        {items.map((u) => {
          const pr = findMeta(UPDATE_PRIORITIES, u.priority);
          const pm = platformMeta(u.platform);
          return (
            <div className="list-card" key={u.id} style={{ borderLeftColor: pr.color }}>
              <div className="list-card-top">
                <span className="pill" style={{ color: pr.color, background: pr.bg }}>{pr.label}</span>
                <span className="pill" style={{ color: pm.color, background: pm.bg }}><PlatformIcon id={u.platform} /> {pm.label}</span>
                <select className="status-select" value={u.status} onChange={(e) => onStatusChange(u.id, e.target.value)}>
                  {UPDATE_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button className="icon-btn danger small" onClick={() => onDelete(u.id)}><Trash2 size={13} /></button>
              </div>
              <h3 className="list-card-title">{u.title}</h3>
              {u.description && <p className="list-card-desc">{u.description}</p>}
            </div>
          );
        })}
        {items.length === 0 && <div className="empty-state">Belum ada rencana update berikutnya.</div>}
      </div>
    </div>
  );
}

const baseCss = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --bg: #12181a;
  --bg-elevated: #171f22;
  --panel: #1c2529;
  --panel-hover: #232d31;
  --border: #2b3438;
  --border-strong: #3a4448;
  --text: #e9edee;
  --text-dim: #93a3a6;
  --text-faint: #5f6c6f;
  --accent: #c98a3e;
  --accent-text: #e0a862;
  --accent-bg: rgba(201,138,62,0.14);
  --danger: #cc6257;
  --danger-bg: rgba(204,98,87,0.13);
  --success: #66ab84;
  --success-bg: rgba(102,171,132,0.13);
  --warning: #d4a94f;
  --warning-bg: rgba(212,169,79,0.13);
  --info: #7ba0c4;
  --info-bg: rgba(123,160,196,0.13);
}

* { box-sizing: border-box; }

html, body, #root { height: 100%; margin: 0; }

.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.conn-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--danger-bg);
  color: var(--danger);
  border-bottom: 1px solid var(--danger);
  font-size: 12.5px;
  padding: 8px 16px;
  text-align: center;
}
.conn-banner code {
  font-family: 'IBM Plex Mono', monospace;
  background: rgba(0,0,0,0.2);
  padding: 1px 5px;
  border-radius: 4px;
}

.loading-screen {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #12181a;
  color: #93a3a6;
  font-family: 'Inter', sans-serif;
  border-radius: 10px;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--bg-elevated);
  border-right: 1px solid var(--border);
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sidebar-top { padding: 2px 2px 4px; }
.brand { display: flex; align-items: center; gap: 8px; }
.brand-mark { color: var(--accent); font-size: 16px; }
.brand-name { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; letter-spacing: -0.01em; }

.sidebar-section-label {
  font-size: 11px;
  color: var(--text-faint);
  padding: 0 4px;
  font-weight: 500;
}

.project-list { display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto; min-height: 40px; }

.project-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 13px;
  width: 100%;
}
.project-item:hover { background: var(--panel-hover); color: var(--text); }
.project-item.active { background: var(--panel); border-color: var(--border-strong); color: var(--text); }
.project-item-icon { flex-shrink: 0; opacity: 0.7; }
.project-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.version-tag-group { display: flex; flex-direction: column; gap: 2px; align-items: flex-end; }

.empty-hint { font-size: 12px; color: var(--text-faint); padding: 8px 4px; line-height: 1.5; }

.add-project-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px; border-radius: 7px; border: 1px dashed var(--border-strong);
  background: transparent; color: var(--text-dim); font-size: 13px; cursor: pointer;
  font-family: inherit;
}
.add-project-btn:hover { color: var(--accent-text); border-color: var(--accent); }

.new-project-form {
  display: flex; flex-direction: column; gap: 10px;
  background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 12px;
  min-width: 0;
}
.new-project-form .add-card-row { flex-direction: column; gap: 10px; }

.field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.field-label { font-size: 11.5px; color: var(--text-faint); font-weight: 500; display: flex; align-items: center; gap: 4px; }
.field-input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--text);
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  width: 100%;
  min-width: 0;
}
.field-input:focus { outline: none; border-color: var(--accent); }
.field-input.mono { font-family: 'IBM Plex Mono', monospace; }
.field-input::placeholder { color: var(--text-faint); }

.form-actions { display: flex; gap: 8px; }

.btn {
  display: flex; align-items: center; gap: 6px; justify-content: center;
  padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-strong);
  background: transparent; color: var(--text-dim); font-size: 12.5px; cursor: pointer;
  font-family: inherit; font-weight: 500;
}
.btn:hover { background: var(--panel-hover); color: var(--text); }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #1a1206; }
.btn-primary:hover { background: var(--accent-text); }
.btn-add { align-self: flex-start; margin-top: 2px; }

.main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg); }

.no-project {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; color: var(--text-faint); text-align: center; padding: 40px;
}
.no-project-mark { font-size: 28px; color: var(--border-strong); }
.no-project p { max-width: 320px; font-size: 13.5px; line-height: 1.6; margin: 0; }

.project-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 22px 26px 18px; border-bottom: 1px solid var(--border);
  gap: 16px; flex-wrap: wrap;
}
.project-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 21px; font-weight: 600;
  margin: 0 0 4px; letter-spacing: -0.01em;
}
.project-desc { font-size: 13px; color: var(--text-dim); margin: 0; max-width: 480px; line-height: 1.5; }

.project-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.current-version-block {
  display: flex; flex-direction: column; align-items: flex-end; gap: 3px;
  background: var(--panel); border: 1px solid var(--border); border-radius: 8px;
  padding: 7px 12px;
}
.current-version-label { font-size: 10.5px; color: var(--text-faint); display: flex; align-items: center; gap: 4px; }
.current-version-value {
  font-family: 'IBM Plex Mono', monospace; font-size: 15px; font-weight: 500;
  color: var(--accent-text); background: transparent; border: none; text-align: right;
  width: 80px; padding: 0;
}
.current-version-value:focus { outline: none; }

.icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 7px; border: 1px solid var(--border);
  background: transparent; color: var(--text-faint); cursor: pointer;
}
.icon-btn:hover { background: var(--danger-bg); color: var(--danger); border-color: var(--danger); }
.icon-btn.small { width: 26px; height: 26px; }

.tab-row { display: flex; gap: 4px; padding: 12px 26px 0; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.tab {
  display: flex; align-items: center; gap: 7px; padding: 9px 14px;
  background: transparent; border: none; border-bottom: 2px solid transparent;
  color: var(--text-faint); font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit;
}
.tab:hover { color: var(--text-dim); }
.tab-active { color: var(--text); border-bottom-color: var(--accent); }
.tab-count {
  font-size: 11px; background: var(--panel-hover); color: var(--text-dim);
  padding: 1px 6px; border-radius: 20px; font-family: 'IBM Plex Mono', monospace;
}
.tab-count-bad { background: var(--danger-bg); color: var(--danger); }

.tab-content { flex: 1; overflow-y: auto; padding: 20px 26px 32px; }
.panel-body { display: flex; flex-direction: column; gap: 18px; max-width: 720px; }

.add-card {
  background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  padding: 16px; display: flex; flex-direction: column; gap: 12px;
}
.add-card-row { display: flex; gap: 12px; }
.add-card-row .field { flex: 1; }

.pill-row { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  font-size: 11.5px; font-weight: 500; padding: 5px 11px; border-radius: 20px;
  border: 1px solid transparent; cursor: pointer; font-family: inherit;
  display: inline-flex; align-items: center; gap: 4px;
}

.platform-filter { display: flex; gap: 6px; }
.filter-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; padding: 5px 12px; border-radius: 20px;
  border: 1px solid var(--border); background: transparent; color: var(--text-faint);
  cursor: pointer; font-family: inherit;
}
.filter-chip:hover { color: var(--text-dim); }
.filter-chip-active { background: var(--panel-hover); color: var(--text); border-color: var(--border-strong); }

.timeline { display: flex; flex-direction: column; }
.timeline-item { display: flex; gap: 14px; position: relative; }
.timeline-dot {
  width: 9px; height: 9px; border-radius: 50%; background: var(--accent);
  margin-top: 7px; flex-shrink: 0; position: relative; z-index: 1;
}
.timeline-line {
  position: absolute; left: 4px; top: 16px; bottom: -14px; width: 1px; background: var(--border);
}
.timeline-card { flex: 1; padding-bottom: 18px; }
.timeline-card-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.version-tag {
  font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; font-weight: 500;
  color: var(--accent-text); background: var(--accent-bg); padding: 2px 8px; border-radius: 5px;
  display: inline-flex; align-items: center; gap: 4px;
}
.version-tag.lg { font-size: 13.5px; padding: 3px 10px; }
.version-tag.xs { font-size: 10px; padding: 1px 6px; }
.date-tag { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--text-faint); }
.timeline-notes { font-size: 13px; color: var(--text-dim); margin: 7px 0 0; line-height: 1.6; }

.list { display: flex; flex-direction: column; gap: 10px; }
.list-card {
  background: var(--panel); border: 1px solid var(--border); border-left: 3px solid var(--border);
  border-radius: 8px; padding: 13px 14px;
}
.list-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.list-card-title { font-size: 14px; font-weight: 500; margin: 0; color: var(--text); }
.list-card-desc { font-size: 12.5px; color: var(--text-dim); margin: 5px 0 0; line-height: 1.55; }

.status-select {
  margin-left: auto; background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-dim); font-size: 11.5px; padding: 4px 8px; font-family: inherit;
}

.checklist-card { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; border-left: 3px solid var(--border); }
.checklist-main { flex: 1; }
.checklist-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.empty-state {
  color: var(--text-faint); font-size: 13px; padding: 20px; text-align: center;
  border: 1px dashed var(--border); border-radius: 8px;
}
`;
