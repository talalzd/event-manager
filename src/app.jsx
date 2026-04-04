import { useState, useRef, useEffect, useCallback } from "react";

// Simple barcode generator (Code 128 subset)
const generateBarcodeSVG = (text, width = 200, height = 60) => {
  const CODE128 = {
    '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
    '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
    '8': '10001100100', '9': '11001001000', 'A': '11001000100', 'B': '11000100100',
    'C': '10110011100', 'D': '10011011100', 'E': '10011001110', 'F': '10111001100',
    'G': '10011101100', 'H': '10011100110', 'I': '11001110010', 'J': '11001011100',
    'K': '11001001110', 'L': '11011100100', 'M': '11001110100', 'N': '11101101110',
    'O': '11101001100', 'P': '11100101100', 'Q': '11100100110', 'R': '11101100100',
    'S': '11100110100', 'T': '11100110010', 'U': '11011011000', 'V': '11011000110',
    'W': '11000110110', 'X': '10100011000', 'Y': '10001011000', 'Z': '10001000110',
    '-': '10110001000', '.': '10001101000', ' ': '11000010010',
  };
  const start = '11010000100';
  const stop = '1100011101011';
  let binary = start;
  for (const ch of text.toUpperCase()) {
    binary += CODE128[ch] || CODE128['0'];
  }
  binary += stop;
  const barWidth = width / binary.length;
  let bars = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      bars += `<rect x="${i * barWidth}" y="0" width="${barWidth + 0.5}" height="${height}" fill="#1a1a2e"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + 18}" width="${width}" height="${height + 18}">
    <rect width="${width}" height="${height + 18}" fill="white" rx="2"/>
    ${bars}
    <text x="${width / 2}" y="${height + 14}" text-anchor="middle" font-family="monospace" font-size="10" fill="#1a1a2e">${text}</text>
  </svg>`;
};

const TABS = ["Events", "Participants", "Groups", "Attendance"];

const initialState = {
  events: [],
  participants: [],
  groups: [],
  attendance: {},
};

// Icons
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ScanIcon = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7h8M5 9h8M5 11h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V3a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4 4l.5 8a1 1 0 001 1h3a1 1 0 001-1L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const UserIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 12.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const GroupIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 13c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5M8 13c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;

const Badge = ({ children, color = "#6c63ff" }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: color + "18", color, letterSpacing: 0.3,
  }}>{children}</span>
);

export default function EventManager() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(initialState);
  const [modal, setModal] = useState(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bulkAdd, setBulkAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scanRef = useRef(null);

  // Auto-focus scan input
  useEffect(() => {
    if (scanMode && scanRef.current) scanRef.current.focus();
  }, [scanMode]);

  // Generate unique barcode ID
  const genBarcodeId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "EVT-";
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  };

  // EVENT CRUD
  const addEvent = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const ev = {
      id: Date.now(),
      name: fd.get("name"),
      date: fd.get("date"),
      location: fd.get("location"),
      description: fd.get("description"),
      createdAt: new Date().toISOString(),
    };
    setData(d => ({ ...d, events: [...d.events, ev] }));
    setModal(null);
  };

  const deleteEvent = (id) => {
    setData(d => ({
      ...d,
      events: d.events.filter(e => e.id !== id),
      attendance: { ...d.attendance, [id]: undefined },
    }));
    if (selectedEvent === id) setSelectedEvent(null);
  };

  // PARTICIPANT CRUD
  const addParticipant = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const p = {
      id: Date.now(),
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      barcodeId: genBarcodeId(),
      isLeader: false,
    };
    setData(d => ({ ...d, participants: [...d.participants, p] }));
    setModal(null);
  };

  const addBulkParticipants = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const lines = fd.get("bulk").split("\n").filter(l => l.trim());
    const newP = lines.map((line, i) => {
      const parts = line.split(",").map(s => s.trim());
      return {
        id: Date.now() + i,
        name: parts[0] || `Participant ${data.participants.length + i + 1}`,
        email: parts[1] || "",
        phone: parts[2] || "",
        barcodeId: genBarcodeId(),
        isLeader: false,
      };
    });
    setData(d => ({ ...d, participants: [...d.participants, ...newP] }));
    setModal(null);
    setBulkAdd(false);
  };

  const deleteParticipant = (id) => {
    setData(d => ({
      ...d,
      participants: d.participants.filter(p => p.id !== id),
      groups: d.groups.map(g => ({
        ...g,
        leaderId: g.leaderId === id ? null : g.leaderId,
        memberIds: g.memberIds.filter(m => m !== id),
      })),
    }));
  };

  const toggleLeader = (id) => {
    setData(d => ({
      ...d,
      participants: d.participants.map(p =>
        p.id === id ? { ...p, isLeader: !p.isLeader } : p
      ),
    }));
  };

  // GROUP MANAGEMENT
  const autoAssignGroups = () => {
    const leaders = data.participants.filter(p => p.isLeader);
    const members = data.participants.filter(p => !p.isLeader);
    if (leaders.length === 0) {
      alert("Please designate at least one leader first!");
      return;
    }
    const groups = leaders.map((l, i) => ({
      id: Date.now() + i,
      name: `Group ${i + 1}`,
      leaderId: l.id,
      memberIds: [],
    }));
    members.forEach((m, i) => {
      groups[i % groups.length].memberIds.push(m.id);
    });
    setData(d => ({ ...d, groups }));
  };

  const addGroup = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const g = {
      id: Date.now(),
      name: fd.get("name"),
      leaderId: fd.get("leaderId") ? Number(fd.get("leaderId")) : null,
      memberIds: [],
    };
    setData(d => ({ ...d, groups: [...d.groups, g] }));
    setModal(null);
  };

  const assignToGroup = (groupId, participantId) => {
    setData(d => ({
      ...d,
      groups: d.groups.map(g => {
        if (g.id === groupId) {
          if (g.memberIds.includes(participantId)) return g;
          return { ...g, memberIds: [...g.memberIds, participantId] };
        }
        return {
          ...g,
          memberIds: g.memberIds.filter(id => id !== participantId),
        };
      }),
    }));
  };

  const removeFromGroup = (groupId, participantId) => {
    setData(d => ({
      ...d,
      groups: d.groups.map(g =>
        g.id === groupId
          ? { ...g, memberIds: g.memberIds.filter(id => id !== participantId) }
          : g
      ),
    }));
  };

  // ATTENDANCE
  const markAttendance = (eventId, participantId) => {
    setData(d => ({
      ...d,
      attendance: {
        ...d.attendance,
        [eventId]: {
          ...(d.attendance[eventId] || {}),
          [participantId]: {
            present: !(d.attendance[eventId]?.[participantId]?.present),
            time: new Date().toLocaleTimeString(),
          },
        },
      },
    }));
  };

  const handleScan = (e) => {
    if (e.key === "Enter" && scanInput.trim() && selectedEvent) {
      const p = data.participants.find(p => p.barcodeId === scanInput.trim().toUpperCase());
      if (p) {
        markAttendance(selectedEvent, p.id);
        setScanResult({ success: true, name: p.name, barcodeId: p.barcodeId });
      } else {
        setScanResult({ success: false, barcodeId: scanInput.trim() });
      }
      setScanInput("");
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  const getById = (id) => data.participants.find(p => p.id === id);
  const attendanceCount = selectedEvent
    ? Object.values(data.attendance[selectedEvent] || {}).filter(a => a.present).length
    : 0;

  const filteredParticipants = data.participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Print barcodes
  const printBarcodes = () => {
    const w = window.open('', '_blank');
    const html = data.participants.map(p => `
      <div style="display:inline-block;margin:12px;text-align:center;page-break-inside:avoid">
        <div style="font-weight:600;margin-bottom:4px;font-size:13px">${p.name}</div>
        ${generateBarcodeSVG(p.barcodeId, 220, 55)}
      </div>
    `).join('');
    w.document.write(`<html><body style="font-family:sans-serif;padding:20px">${html}</body></html>`);
    w.document.close();
    w.print();
  };

  // STYLES
  const s = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0d0d1a 0%, #1a1a2e 40%, #16213e 100%)",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      color: "#e0e0f0",
      padding: 0,
    },
    header: {
      padding: "28px 24px 18px",
      background: "linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,210,255,0.06))",
      borderBottom: "1px solid rgba(108,99,255,0.15)",
    },
    title: {
      fontSize: 22, fontWeight: 800, letterSpacing: -0.5,
      background: "linear-gradient(135deg, #6c63ff, #00d2ff)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      margin: 0,
    },
    subtitle: { fontSize: 12, color: "#7a7a9e", marginTop: 4 },
    tabs: {
      display: "flex", gap: 0, padding: "0 16px",
      background: "rgba(10,10,22,0.6)",
      borderBottom: "1px solid rgba(108,99,255,0.1)",
      overflowX: "auto",
    },
    tab: (active) => ({
      padding: "12px 16px", fontSize: 13, fontWeight: active ? 700 : 500,
      color: active ? "#6c63ff" : "#7a7a9e",
      borderBottom: active ? "2px solid #6c63ff" : "2px solid transparent",
      cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
      background: "none", border: "none", fontFamily: "inherit",
    }),
    card: {
      background: "rgba(30,30,55,0.7)", borderRadius: 14,
      border: "1px solid rgba(108,99,255,0.12)",
      padding: 16, marginBottom: 12,
      backdropFilter: "blur(10px)",
      transition: "border-color 0.2s",
    },
    btn: (primary) => ({
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: primary ? "10px 20px" : "8px 14px",
      borderRadius: 10, border: "none", cursor: "pointer",
      fontWeight: 600, fontSize: 13, fontFamily: "inherit",
      background: primary
        ? "linear-gradient(135deg, #6c63ff, #5a52e0)"
        : "rgba(108,99,255,0.12)",
      color: primary ? "#fff" : "#b0b0d0",
      transition: "all 0.2s",
      boxShadow: primary ? "0 4px 15px rgba(108,99,255,0.3)" : "none",
    }),
    input: {
      width: "100%", padding: "10px 14px", borderRadius: 10,
      border: "1px solid rgba(108,99,255,0.2)",
      background: "rgba(15,15,35,0.8)", color: "#e0e0f0",
      fontSize: 14, fontFamily: "inherit", outline: "none",
      boxSizing: "border-box",
    },
    label: {
      fontSize: 12, fontWeight: 600, color: "#8888aa",
      marginBottom: 6, display: "block", textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    modal: {
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      padding: 16,
    },
    modalContent: {
      background: "linear-gradient(160deg, #1a1a2e, #16213e)",
      borderRadius: 18, padding: 24, width: "100%", maxWidth: 440,
      border: "1px solid rgba(108,99,255,0.2)",
      maxHeight: "85vh", overflowY: "auto",
    },
    scanBanner: (success) => ({
      padding: "12px 18px", borderRadius: 12, marginBottom: 12,
      display: "flex", alignItems: "center", gap: 10,
      background: success
        ? "rgba(0,210,120,0.15)"
        : "rgba(255,80,80,0.15)",
      border: `1px solid ${success ? "rgba(0,210,120,0.3)" : "rgba(255,80,80,0.3)"}`,
      color: success ? "#00d278" : "#ff5050",
      fontWeight: 600, fontSize: 13,
      animation: "slideDown 0.3s ease",
    }),
    stat: {
      textAlign: "center", padding: "14px 10px",
      background: "rgba(108,99,255,0.06)", borderRadius: 12,
      flex: 1,
    },
    statNum: {
      fontSize: 26, fontWeight: 800,
      background: "linear-gradient(135deg, #6c63ff, #00d2ff)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    },
    statLabel: { fontSize: 10, color: "#7a7a9e", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8 },
  };

  // RENDER SECTIONS
  const renderEvents = () => (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Events</h2>
        <button style={s.btn(true)} onClick={() => setModal("event")}><PlusIcon /> New Event</button>
      </div>
      {data.events.length === 0 ? (
        <div style={{ ...s.card, textAlign: "center", padding: 40, color: "#7a7a9e" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14 }}>No events yet. Create your first event!</div>
        </div>
      ) : data.events.map(ev => (
        <div key={ev.id} style={{
          ...s.card,
          borderColor: selectedEvent === ev.id ? "rgba(108,99,255,0.5)" : undefined,
          cursor: "pointer",
        }} onClick={() => setSelectedEvent(ev.id)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{ev.name}</div>
              <div style={{ fontSize: 12, color: "#7a7a9e", marginTop: 4 }}>
                {ev.date && new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                {ev.location && ` · ${ev.location}`}
              </div>
              {ev.description && <div style={{ fontSize: 13, color: "#9999b5", marginTop: 6 }}>{ev.description}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {selectedEvent === ev.id && <Badge color="#00d278">Selected</Badge>}
              <button style={{ ...s.btn(false), padding: "6px 10px", color: "#ff5050" }} onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}>
                <TrashIcon />
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={s.stat}>
              <div style={s.statNum}>{data.participants.length}</div>
              <div style={s.statLabel}>Participants</div>
            </div>
            <div style={s.stat}>
              <div style={s.statNum}>{data.groups.length}</div>
              <div style={s.statLabel}>Groups</div>
            </div>
            <div style={s.stat}>
              <div style={s.statNum}>
                {Object.values(data.attendance[ev.id] || {}).filter(a => a.present).length}
              </div>
              <div style={s.statLabel}>Attended</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderParticipants = () => (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          Participants <span style={{ color: "#6c63ff", fontSize: 14 }}>({data.participants.length})</span>
        </h2>
        <div style={{ display: "flex", gap: 6 }}>
          {data.participants.length > 0 && (
            <button style={s.btn(false)} onClick={printBarcodes}>🖨️ Barcodes</button>
          )}
          <button style={s.btn(true)} onClick={() => setModal("participant")}><PlusIcon /> Add</button>
        </div>
      </div>

      <input
        type="text" placeholder="Search by name, email, or barcode..."
        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        style={{ ...s.input, marginBottom: 12 }}
      />

      {data.participants.length === 0 ? (
        <div style={{ ...s.card, textAlign: "center", padding: 40, color: "#7a7a9e" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 14 }}>No participants yet. Add individually or in bulk!</div>
        </div>
      ) : (
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
          {filteredParticipants.map(p => (
            <div key={p.id} style={{ ...s.card, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                    {p.isLeader && <Badge color="#f0a500">⭐ Leader</Badge>}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a7a9e", marginTop: 3 }}>
                    {p.email && <span>{p.email} · </span>}
                    <span style={{ fontFamily: "monospace", color: "#6c63ff" }}>{p.barcodeId}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    style={{ ...s.btn(false), padding: "5px 10px", fontSize: 11, color: p.isLeader ? "#f0a500" : "#b0b0d0" }}
                    onClick={() => toggleLeader(p.id)}
                    title={p.isLeader ? "Remove leader role" : "Make leader"}
                  >⭐</button>
                  <button
                    style={{ ...s.btn(false), padding: "5px 10px", color: "#ff5050" }}
                    onClick={() => deleteParticipant(p.id)}
                  ><TrashIcon /></button>
                </div>
              </div>
              {/* Mini barcode preview */}
              <div style={{ marginTop: 8, opacity: 0.8 }}
                dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(p.barcodeId, 160, 35) }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGroups = () => {
    const unassigned = data.participants.filter(p =>
      !p.isLeader && !data.groups.some(g => g.memberIds.includes(p.id))
    );
    return (
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Groups</h2>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={s.btn(false)} onClick={autoAssignGroups}><GroupIcon /> Auto-Assign</button>
            <button style={s.btn(true)} onClick={() => setModal("group")}><PlusIcon /> New Group</button>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#7a7a9e", marginBottom: 12, background: "rgba(108,99,255,0.06)", padding: "10px 14px", borderRadius: 10 }}>
          💡 Tip: Mark participants as leaders in the Participants tab, then use <strong>Auto-Assign</strong> to distribute members evenly (5-10 per leader).
        </div>

        {data.groups.length === 0 ? (
          <div style={{ ...s.card, textAlign: "center", padding: 40, color: "#7a7a9e" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👨‍👩‍👧‍👦</div>
            <div style={{ fontSize: 14 }}>No groups yet. Create groups or auto-assign!</div>
          </div>
        ) : data.groups.map(g => {
          const leader = getById(g.leaderId);
          const members = g.memberIds.map(getById).filter(Boolean);
          return (
            <div key={g.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{g.name}</div>
                <Badge>{members.length + (leader ? 1 : 0)} members</Badge>
              </div>
              {leader && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                  background: "rgba(240,165,0,0.08)", borderRadius: 10, marginBottom: 8,
                  border: "1px solid rgba(240,165,0,0.15)",
                }}>
                  <span style={{ fontSize: 14 }}>⭐</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#f0a500" }}>{leader.name}</span>
                  <span style={{ fontSize: 11, color: "#7a7a9e", marginLeft: "auto" }}>Leader</span>
                </div>
              )}
              {members.map(m => (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 12px", borderRadius: 8,
                  background: "rgba(108,99,255,0.04)", marginBottom: 4,
                }}>
                  <span style={{ fontSize: 13 }}>{m.name}</span>
                  <button style={{ ...s.btn(false), padding: "3px 8px", fontSize: 11 }}
                    onClick={() => removeFromGroup(g.id, m.id)}>✕</button>
                </div>
              ))}
              {/* Add unassigned member to this group */}
              {unassigned.length > 0 && (
                <select
                  style={{ ...s.input, marginTop: 8, fontSize: 12, padding: "6px 10px" }}
                  value="" onChange={(e) => { if (e.target.value) assignToGroup(g.id, Number(e.target.value)); }}
                >
                  <option value="">+ Add member...</option>
                  {unassigned.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderAttendance = () => {
    if (!selectedEvent) {
      return (
        <div style={{ padding: 16 }}>
          <div style={{ ...s.card, textAlign: "center", padding: 40, color: "#7a7a9e" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14 }}>Select an event from the Events tab first</div>
          </div>
        </div>
      );
    }
    const ev = data.events.find(e => e.id === selectedEvent);
    const eventAttendance = data.attendance[selectedEvent] || {};

    return (
      <div style={{ padding: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>Attendance</h2>
        <div style={{ fontSize: 13, color: "#7a7a9e", marginBottom: 16 }}>
          Event: <strong style={{ color: "#e0e0f0" }}>{ev?.name}</strong>
        </div>

        {/* Scan Section */}
        <div style={{
          ...s.card, marginBottom: 16,
          border: scanMode ? "1px solid rgba(0,210,255,0.4)" : undefined,
          background: scanMode ? "rgba(0,210,255,0.05)" : undefined,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: scanMode ? 12 : 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <ScanIcon /> Barcode Scanner
            </div>
            <button style={s.btn(scanMode)} onClick={() => setScanMode(!scanMode)}>
              {scanMode ? "Close Scanner" : "Open Scanner"}
            </button>
          </div>
          {scanMode && (
            <div>
              <div style={{ fontSize: 12, color: "#7a7a9e", marginBottom: 8 }}>
                Scan a barcode or type the code manually and press Enter
              </div>
              <input
                ref={scanRef}
                type="text" value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={handleScan}
                placeholder="Scan or type barcode ID..."
                style={{ ...s.input, fontSize: 18, fontFamily: "monospace", textAlign: "center", letterSpacing: 3 }}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Scan Result Toast */}
        {scanResult && (
          <div style={s.scanBanner(scanResult.success)}>
            {scanResult.success
              ? <><CheckIcon /> {scanResult.name} — checked in!</>
              : <>⚠️ Barcode "{scanResult.barcodeId}" not found</>}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={s.stat}>
            <div style={s.statNum}>{attendanceCount}</div>
            <div style={s.statLabel}>Present</div>
          </div>
          <div style={s.stat}>
            <div style={{ ...s.statNum, background: "linear-gradient(135deg, #ff5050, #ff8888)", WebkitBackgroundClip: "text" }}>
              {data.participants.length - attendanceCount}
            </div>
            <div style={s.statLabel}>Absent</div>
          </div>
          <div style={s.stat}>
            <div style={s.statNum}>
              {data.participants.length > 0 ? Math.round(attendanceCount / data.participants.length * 100) : 0}%
            </div>
            <div style={s.statLabel}>Rate</div>
          </div>
        </div>

        {/* Participant list with check-in */}
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {data.participants.map(p => {
            const att = eventAttendance[p.id];
            return (
              <div key={p.id} style={{
                ...s.card, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
                borderColor: att?.present ? "rgba(0,210,120,0.25)" : undefined,
                background: att?.present ? "rgba(0,210,120,0.04)" : undefined,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    {p.name}
                    {p.isLeader && <Badge color="#f0a500">Leader</Badge>}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a7a9e", fontFamily: "monospace" }}>
                    {p.barcodeId}
                    {att?.present && <span style={{ color: "#00d278", marginLeft: 8 }}>✓ {att.time}</span>}
                  </div>
                </div>
                <button
                  style={{
                    ...s.btn(att?.present),
                    background: att?.present
                      ? "linear-gradient(135deg, #00d278, #00b868)"
                      : "rgba(108,99,255,0.12)",
                    padding: "8px 14px",
                  }}
                  onClick={() => markAttendance(selectedEvent, p.id)}
                >
                  {att?.present ? <><CheckIcon /> Present</> : "Mark"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // MODAL RENDER
  const renderModal = () => {
    if (!modal) return null;
    return (
      <div style={s.modal} onClick={() => { setModal(null); setBulkAdd(false); }}>
        <div style={s.modalContent} onClick={e => e.stopPropagation()}>
          {modal === "event" && (
            <>
              <h3 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 700 }}>Create Event</h3>
              <div onSubmit={addEvent}>
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Event Name *</label>
                  <input name="name" required style={s.input} placeholder="e.g., Annual Conference 2026" id="ev-name" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Date</label>
                  <input name="date" type="date" style={s.input} id="ev-date" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Location</label>
                  <input name="location" style={s.input} placeholder="e.g., Convention Center" id="ev-loc" />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={s.label}>Description</label>
                  <textarea name="description" style={{ ...s.input, minHeight: 70, resize: "vertical" }} placeholder="Event details..." id="ev-desc" />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" style={s.btn(false)} onClick={() => setModal(null)}>Cancel</button>
                  <button type="button" style={s.btn(true)} onClick={() => {
                    const name = document.getElementById('ev-name').value;
                    if (!name) return;
                    const ev = {
                      id: Date.now(), name,
                      date: document.getElementById('ev-date').value,
                      location: document.getElementById('ev-loc').value,
                      description: document.getElementById('ev-desc').value,
                      createdAt: new Date().toISOString(),
                    };
                    setData(d => ({ ...d, events: [...d.events, ev] }));
                    setModal(null);
                  }}>Create Event</button>
                </div>
              </div>
            </>
          )}
          {modal === "participant" && (
            <>
              <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>Add Participants</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                <button style={{ ...s.btn(!bulkAdd), fontSize: 12 }} onClick={() => setBulkAdd(false)}>Single</button>
                <button style={{ ...s.btn(bulkAdd), fontSize: 12 }} onClick={() => setBulkAdd(true)}>Bulk Import</button>
              </div>
              {!bulkAdd ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={s.label}>Full Name *</label>
                    <input style={s.input} placeholder="e.g., Sarah Johnson" id="p-name" />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={s.label}>Email</label>
                    <input style={s.input} placeholder="email@example.com" id="p-email" />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={s.label}>Phone</label>
                    <input style={s.input} placeholder="+1 234 567 890" id="p-phone" />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button style={s.btn(false)} onClick={() => setModal(null)}>Cancel</button>
                    <button style={s.btn(true)} onClick={() => {
                      const name = document.getElementById('p-name').value;
                      if (!name) return;
                      const p = {
                        id: Date.now(), name,
                        email: document.getElementById('p-email').value || "",
                        phone: document.getElementById('p-phone').value || "",
                        barcodeId: genBarcodeId(), isLeader: false,
                      };
                      setData(d => ({ ...d, participants: [...d.participants, p] }));
                      setModal(null);
                    }}>Add Participant</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={s.label}>Paste participants (one per line)</label>
                    <div style={{ fontSize: 11, color: "#7a7a9e", marginBottom: 8 }}>
                      Format: Name, Email, Phone (email & phone optional)
                    </div>
                    <textarea
                      style={{ ...s.input, minHeight: 180, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                      placeholder={"John Smith, john@email.com, +1234567890\nJane Doe, jane@email.com\nBob Wilson"}
                      id="p-bulk"
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button style={s.btn(false)} onClick={() => setModal(null)}>Cancel</button>
                    <button style={s.btn(true)} onClick={() => {
                      const lines = document.getElementById('p-bulk').value.split("\n").filter(l => l.trim());
                      if (lines.length === 0) return;
                      const newP = lines.map((line, i) => {
                        const parts = line.split(",").map(s => s.trim());
                        return {
                          id: Date.now() + i,
                          name: parts[0] || `Participant ${data.participants.length + i + 1}`,
                          email: parts[1] || "", phone: parts[2] || "",
                          barcodeId: genBarcodeId(), isLeader: false,
                        };
                      });
                      setData(d => ({ ...d, participants: [...d.participants, ...newP] }));
                      setModal(null); setBulkAdd(false);
                    }}>Import All</button>
                  </div>
                </div>
              )}
            </>
          )}
          {modal === "group" && (
            <>
              <h3 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 700 }}>Create Group</h3>
              <div>
                <div style={{ marginBottom: 14 }}>
                  <label style={s.label}>Group Name *</label>
                  <input style={s.input} placeholder="e.g., Group Alpha" id="g-name" />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={s.label}>Assign Leader</label>
                  <select style={s.input} id="g-leader">
                    <option value="">No leader assigned</option>
                    {data.participants.filter(p => p.isLeader).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={s.btn(false)} onClick={() => setModal(null)}>Cancel</button>
                  <button style={s.btn(true)} onClick={() => {
                    const name = document.getElementById('g-name').value;
                    if (!name) return;
                    const leaderId = document.getElementById('g-leader').value;
                    const g = {
                      id: Date.now(), name,
                      leaderId: leaderId ? Number(leaderId) : null,
                      memberIds: [],
                    };
                    setData(d => ({ ...d, groups: [...d.groups, g] }));
                    setModal(null);
                  }}>Create Group</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={s.app}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.3); border-radius: 4px; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        input:focus, textarea:focus, select:focus { border-color: rgba(108,99,255,0.5) !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.1); }
      `}</style>

      <div style={s.header}>
        <h1 style={s.title}>Event Manager</h1>
        <div style={s.subtitle}>Create events · Manage participants · Track attendance with barcodes</div>
      </div>

      <div style={s.tabs}>
        {TABS.map((t, i) => (
          <button key={t} style={s.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && renderEvents()}
      {tab === 1 && renderParticipants()}
      {tab === 2 && renderGroups()}
      {tab === 3 && renderAttendance()}

      {renderModal()}
    </div>
  );
}
