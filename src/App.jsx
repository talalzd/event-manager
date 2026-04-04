import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ─── BARCODE GENERATOR ───
const generateBarcodeSVG = (text, width = 200, height = 60) => {
  const CODE128 = {
    '0':'11011001100','1':'11001101100','2':'11001100110','3':'10010011000',
    '4':'10010001100','5':'10001001100','6':'10011001000','7':'10011000100',
    '8':'10001100100','9':'11001001000','A':'11001000100','B':'11000100100',
    'C':'10110011100','D':'10011011100','E':'10011001110','F':'10111001100',
    'G':'10011101100','H':'10011100110','I':'11001110010','J':'11001011100',
    'K':'11001001110','L':'11011100100','M':'11001110100','N':'11101101110',
    'O':'11101001100','P':'11100101100','Q':'11100100110','R':'11101100100',
    'S':'11100110100','T':'11100110010','U':'11011011000','V':'11011000110',
    'W':'11000110110','X':'10100011000','Y':'10001011000','Z':'10001000110',
    '-':'10110001000','.':'10001101000',' ':'11000010010',
  };
  const start = '11010000100', stop = '1100011101011';
  let binary = start;
  for (const ch of text.toUpperCase()) binary += CODE128[ch] || CODE128['0'];
  binary += stop;
  const bw = width / binary.length;
  let bars = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') bars += `<rect x="${i*bw}" y="0" width="${bw+0.5}" height="${height}" fill="#1a1a2e"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height+18}" width="${width}" height="${height+18}"><rect width="${width}" height="${height+18}" fill="white" rx="2"/>${bars}<text x="${width/2}" y="${height+14}" text-anchor="middle" font-family="monospace" font-size="10" fill="#1a1a2e">${text}</text></svg>`;
};

const genBarcodeId = (prefix = "EVT") => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = prefix + "-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

// ─── ICONS ───
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ScanIcon = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7h8M5 9h8M5 11h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V3a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4 4l.5 8a1 1 0 001 1h3a1 1 0 001-1L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const GroupIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 13c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5M8 13c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const LogoutIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M6 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ReportIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2h5l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 9h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;

const Badge = ({ children, color = "#6c63ff" }) => (
  <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:color+"18",color,letterSpacing:0.3 }}>{children}</span>
);

const TABS = ["Events", "Participants", "Groups", "Attendance", "Reports"];

// ─── STYLES ───
const S = {
  app: { minHeight:"100vh", background:"linear-gradient(145deg,#0d0d1a 0%,#1a1a2e 40%,#16213e 100%)", fontFamily:"'Outfit','Segoe UI',sans-serif", color:"#e0e0f0" },
  header: { padding:"20px 24px 14px", background:"linear-gradient(135deg,rgba(108,99,255,0.12),rgba(0,210,255,0.06))", borderBottom:"1px solid rgba(108,99,255,0.15)" },
  title: { fontSize:22,fontWeight:800,letterSpacing:-0.5,background:"linear-gradient(135deg,#6c63ff,#00d2ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0 },
  subtitle: { fontSize:12,color:"#7a7a9e",marginTop:4 },
  tabs: { display:"flex",gap:0,padding:"0 12px",background:"rgba(10,10,22,0.6)",borderBottom:"1px solid rgba(108,99,255,0.1)",overflowX:"auto" },
  tab: (a) => ({ padding:"12px 14px",fontSize:12,fontWeight:a?700:500,color:a?"#6c63ff":"#7a7a9e",borderBottom:a?"2px solid #6c63ff":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",background:"none",border:"none",fontFamily:"inherit" }),
  card: { background:"rgba(30,30,55,0.7)",borderRadius:14,border:"1px solid rgba(108,99,255,0.12)",padding:16,marginBottom:12,backdropFilter:"blur(10px)" },
  btn: (p) => ({ display:"inline-flex",alignItems:"center",gap:6,padding:p?"10px 20px":"8px 14px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit",background:p?"linear-gradient(135deg,#6c63ff,#5a52e0)":"rgba(108,99,255,0.12)",color:p?"#fff":"#b0b0d0",boxShadow:p?"0 4px 15px rgba(108,99,255,0.3)":"none" }),
  btnDanger: { display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit",background:"rgba(255,80,80,0.15)",color:"#ff5050" },
  input: { width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid rgba(108,99,255,0.2)",background:"rgba(15,15,35,0.8)",color:"#e0e0f0",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box" },
  label: { fontSize:12,fontWeight:600,color:"#8888aa",marginBottom:6,display:"block",textTransform:"uppercase",letterSpacing:0.8 },
  modal: { position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",padding:16 },
  modalContent: { background:"linear-gradient(160deg,#1a1a2e,#16213e)",borderRadius:18,padding:24,width:"100%",maxWidth:440,border:"1px solid rgba(108,99,255,0.2)",maxHeight:"85vh",overflowY:"auto" },
  stat: { textAlign:"center",padding:"14px 10px",background:"rgba(108,99,255,0.06)",borderRadius:12,flex:1 },
  statNum: { fontSize:26,fontWeight:800,background:"linear-gradient(135deg,#6c63ff,#00d2ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" },
  statLabel: { fontSize:10,color:"#7a7a9e",marginTop:4,textTransform:"uppercase",letterSpacing:0.8 },
  scanBanner: (ok) => ({ padding:"12px 18px",borderRadius:12,marginBottom:12,display:"flex",alignItems:"center",gap:10,background:ok?"rgba(0,210,120,0.15)":"rgba(255,80,80,0.15)",border:`1px solid ${ok?"rgba(0,210,120,0.3)":"rgba(255,80,80,0.3)"}`,color:ok?"#00d278":"#ff5050",fontWeight:600,fontSize:13,animation:"slideDown 0.3s ease" }),
};

// ═══════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("leader");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role } }
        });
        if (error) throw error;
        if (data.user) onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onAuth(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ ...S.app, display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{ width:"100%",maxWidth:400 }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <h1 style={{ ...S.title,fontSize:28 }}>Event Manager</h1>
          <p style={{ color:"#7a7a9e",fontSize:14,marginTop:8 }}>Sign in to manage your events</p>
        </div>
        <div style={S.card}>
          <div style={{ display:"flex",gap:0,marginBottom:20,background:"rgba(108,99,255,0.06)",borderRadius:10,padding:3 }}>
            <button style={{ flex:1,padding:"8px",borderRadius:8,border:"none",fontWeight:600,fontSize:13,fontFamily:"inherit",cursor:"pointer",background:mode==="login"?"rgba(108,99,255,0.2)":"transparent",color:mode==="login"?"#6c63ff":"#7a7a9e" }} onClick={()=>setMode("login")}>Sign In</button>
            <button style={{ flex:1,padding:"8px",borderRadius:8,border:"none",fontWeight:600,fontSize:13,fontFamily:"inherit",cursor:"pointer",background:mode==="signup"?"rgba(108,99,255,0.2)":"transparent",color:mode==="signup"?"#6c63ff":"#7a7a9e" }} onClick={()=>setMode("signup")}>Create Account</button>
          </div>

          {mode === "signup" && (
            <>
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>Full Name</label>
                <input style={S.input} value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name"/>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>Role</label>
                <select style={S.input} value={role} onChange={e=>setRole(e.target.value)}>
                  <option value="admin">Admin (full access)</option>
                  <option value="leader">Leader (group management)</option>
                </select>
              </div>
            </>
          )}
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/>
          </div>

          {error && <div style={{ color:"#ff5050",fontSize:13,marginBottom:14,padding:"8px 12px",background:"rgba(255,80,80,0.1)",borderRadius:8 }}>{error}</div>}

          <button style={{ ...S.btn(true),width:"100%",justifyContent:"center",padding:"12px 20px",opacity:loading?0.7:1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [modal, setModal] = useState(null);

  // Data
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // UI state
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkAdd, setBulkAdd] = useState(false);
  const scanRef = useRef(null);

  // ─── AUTH CHECK ───
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      else { setUser(null); setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
  };

  // ─── FETCH ALL DATA ───
  useEffect(() => { if (user) loadAllData(); }, [user]);

  const loadAllData = async () => {
    const [ev, pa, gr, at] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('participants').select('*').order('created_at', { ascending: true }),
      supabase.from('groups').select('*').order('created_at', { ascending: true }),
      supabase.from('attendance').select('*'),
    ]);
    if (ev.data) setEvents(ev.data);
    if (pa.data) setParticipants(pa.data);
    if (gr.data) setGroups(gr.data);
    if (at.data) setAttendance(at.data);
  };

  // Auto-focus scan
  useEffect(() => { if (scanMode && scanRef.current) scanRef.current.focus(); }, [scanMode]);

  const isAdmin = profile?.role === 'admin';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null);
  };

  // ═══════════════════════════════════
  // EVENT CRUD
  // ═══════════════════════════════════
  const createEvent = async () => {
    const name = document.getElementById('ev-name')?.value;
    if (!name) return;
    const barcodeId = genBarcodeId("EV");
    const { data, error } = await supabase.from('events').insert({
      name,
      description: document.getElementById('ev-desc')?.value || '',
      location: document.getElementById('ev-loc')?.value || '',
      start_date: document.getElementById('ev-start')?.value || null,
      end_date: document.getElementById('ev-end')?.value || null,
      barcode_id: barcodeId,
      created_by: user.id,
    }).select().single();
    if (data) { setEvents(prev => [data, ...prev]); setModal(null); }
    if (error) alert(error.message);
  };

  const endEvent = async (id) => {
    if (!confirm("Mark this event as ended?")) return;
    const { error } = await supabase.from('events').update({ status: 'ended' }).eq('id', id);
    if (!error) setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'ended' } : e));
  };

  const deleteEvent = async (id) => {
    if (!confirm("Permanently delete this event and all its data?")) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setParticipants(prev => prev.filter(p => p.event_id !== id));
      setGroups(prev => prev.filter(g => g.event_id !== id));
      setAttendance(prev => prev.filter(a => a.event_id !== id));
      if (selectedEvent === id) setSelectedEvent(null);
    }
  };

  // ═══════════════════════════════════
  // PARTICIPANT CRUD
  // ═══════════════════════════════════
  const addParticipant = async () => {
    if (!selectedEvent) { alert("Select an event first!"); return; }
    const name = document.getElementById('p-name')?.value;
    if (!name) return;
    const { data, error } = await supabase.from('participants').insert({
      event_id: selectedEvent,
      full_name: name,
      email: document.getElementById('p-email')?.value || '',
      phone: document.getElementById('p-phone')?.value || '',
      barcode_id: genBarcodeId("P"),
      is_leader: false,
    }).select().single();
    if (data) { setParticipants(prev => [...prev, data]); setModal(null); }
    if (error) alert(error.message);
  };

  const addBulkParticipants = async () => {
    if (!selectedEvent) { alert("Select an event first!"); return; }
    const raw = document.getElementById('p-bulk')?.value || '';
    const lines = raw.split("\n").filter(l => l.trim());
    if (lines.length === 0) return;
    const rows = lines.map(line => {
      const parts = line.split(",").map(s => s.trim());
      return {
        event_id: selectedEvent,
        full_name: parts[0] || 'Unnamed',
        email: parts[1] || '',
        phone: parts[2] || '',
        barcode_id: genBarcodeId("P"),
        is_leader: false,
      };
    });
    const { data, error } = await supabase.from('participants').insert(rows).select();
    if (data) { setParticipants(prev => [...prev, ...data]); setModal(null); setBulkAdd(false); }
    if (error) alert(error.message);
  };

  const deleteParticipant = async (id) => {
    const { error } = await supabase.from('participants').delete().eq('id', id);
    if (!error) setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const toggleLeader = async (p) => {
    const { error } = await supabase.from('participants').update({ is_leader: !p.is_leader }).eq('id', p.id);
    if (!error) setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, is_leader: !x.is_leader } : x));
  };

  // ═══════════════════════════════════
  // GROUP MANAGEMENT
  // ═══════════════════════════════════
  const createGroup = async () => {
    if (!selectedEvent) return;
    const name = document.getElementById('g-name')?.value;
    if (!name) return;
    const leaderId = document.getElementById('g-leader')?.value;
    const { data, error } = await supabase.from('groups').insert({
      event_id: selectedEvent,
      name,
      leader_id: leaderId ? Number(leaderId) : null,
    }).select().single();
    if (data) { setGroups(prev => [...prev, data]); setModal(null); }
    if (error) alert(error.message);
  };

  const autoAssignGroups = async () => {
    if (!selectedEvent) return;
    const evParticipants = participants.filter(p => p.event_id === selectedEvent);
    const leaders = evParticipants.filter(p => p.is_leader);
    const members = evParticipants.filter(p => !p.is_leader);
    if (leaders.length === 0) { alert("Mark some participants as leaders first!"); return; }

    // Delete existing groups for this event
    await supabase.from('groups').delete().eq('event_id', selectedEvent);

    // Create new groups
    const newGroups = [];
    for (let i = 0; i < leaders.length; i++) {
      const { data } = await supabase.from('groups').insert({
        event_id: selectedEvent,
        name: `Group ${i + 1}`,
        leader_id: leaders[i].id,
      }).select().single();
      if (data) newGroups.push(data);
    }

    // Assign members
    for (let i = 0; i < members.length; i++) {
      const group = newGroups[i % newGroups.length];
      await supabase.from('participants').update({ group_id: group.id }).eq('id', members[i].id);
    }

    await loadAllData();
  };

  const assignToGroup = async (groupId, participantId) => {
    await supabase.from('participants').update({ group_id: groupId }).eq('id', participantId);
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, group_id: groupId } : p));
  };

  const removeFromGroup = async (participantId) => {
    await supabase.from('participants').update({ group_id: null }).eq('id', participantId);
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, group_id: null } : p));
  };

  // ═══════════════════════════════════
  // ATTENDANCE
  // ═══════════════════════════════════
  const markAttendance = async (participantId) => {
    if (!selectedEvent) return;
    const existing = attendance.find(a => a.event_id === selectedEvent && a.participant_id === participantId);
    if (existing) {
      const newVal = !existing.checked_in;
      await supabase.from('attendance').update({
        checked_in: newVal,
        check_in_time: newVal ? new Date().toISOString() : null,
        checked_in_by: user.id,
      }).eq('id', existing.id);
      setAttendance(prev => prev.map(a => a.id === existing.id ? { ...a, checked_in: newVal, check_in_time: newVal ? new Date().toISOString() : null } : a));
    } else {
      const { data } = await supabase.from('attendance').insert({
        event_id: selectedEvent,
        participant_id: participantId,
        checked_in: true,
        check_in_time: new Date().toISOString(),
        checked_in_by: user.id,
      }).select().single();
      if (data) setAttendance(prev => [...prev, data]);
    }
  };

  const handleScan = (e) => {
    if (e.key === "Enter" && scanInput.trim() && selectedEvent) {
      const code = scanInput.trim().toUpperCase();
      const p = eventParticipants.find(p => p.barcode_id === code);
      if (p) {
        markAttendance(p.id);
        setScanResult({ success: true, name: p.full_name, barcodeId: p.barcode_id });
      } else {
        setScanResult({ success: false, barcodeId: code });
      }
      setScanInput("");
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  // ─── DERIVED DATA ───
  const currentEvent = events.find(e => e.id === selectedEvent);
  const eventParticipants = participants.filter(p => p.event_id === selectedEvent);
  const eventGroups = groups.filter(g => g.event_id === selectedEvent);
  const eventAttendance = attendance.filter(a => a.event_id === selectedEvent);
  const presentCount = eventAttendance.filter(a => a.checked_in).length;
  const filteredParticipants = eventParticipants.filter(p =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── PRINT BARCODES ───
  const printBarcodes = () => {
    const w = window.open('', '_blank');
    const html = eventParticipants.map(p => `
      <div style="display:inline-block;margin:12px;text-align:center;page-break-inside:avoid">
        <div style="font-weight:600;margin-bottom:4px;font-size:13px">${p.full_name}</div>
        ${generateBarcodeSVG(p.barcode_id, 220, 55)}
      </div>`).join('');
    w.document.write(`<html><body style="font-family:sans-serif;padding:20px"><h2>${currentEvent?.name || 'Event'} — Participant Barcodes</h2>${html}</body></html>`);
    w.document.close();
    w.print();
  };

  // ─── GENERATE REPORT ───
  const generateReport = () => {
    if (!selectedEvent || !currentEvent) return;
    const total = eventParticipants.length;
    const present = presentCount;
    const absent = total - present;
    const rate = total > 0 ? Math.round(present / total * 100) : 0;
    const leaders = eventParticipants.filter(p => p.is_leader);

    const groupRows = eventGroups.map(g => {
      const leader = eventParticipants.find(p => p.id === g.leader_id);
      const members = eventParticipants.filter(p => p.group_id === g.id);
      const gPresent = members.filter(m => eventAttendance.find(a => a.participant_id === m.id && a.checked_in)).length;
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd">${g.name}</td>
        <td style="padding:8px;border:1px solid #ddd">${leader?.full_name || '—'}</td>
        <td style="padding:8px;border:1px solid #ddd">${members.length}</td>
        <td style="padding:8px;border:1px solid #ddd">${gPresent}/${members.length}</td>
      </tr>`;
    }).join('');

    const attendeeRows = eventParticipants.map(p => {
      const att = eventAttendance.find(a => a.participant_id === p.id);
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #ddd">${p.full_name}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${p.barcode_id}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${p.is_leader ? 'Leader' : 'Member'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;color:${att?.checked_in ? 'green' : 'red'}">${att?.checked_in ? '✓ Present' : '✗ Absent'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${att?.check_in_time ? new Date(att.check_in_time).toLocaleTimeString() : '—'}</td>
      </tr>`;
    }).join('');

    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Report - ${currentEvent.name}</title></head><body style="font-family:Arial,sans-serif;padding:30px;max-width:900px;margin:0 auto;color:#222">
      <div style="border-bottom:3px solid #6c63ff;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0;color:#1a1a2e">${currentEvent.name}</h1>
        <p style="color:#666;margin:6px 0 0">Event Report — Generated ${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} at ${new Date().toLocaleTimeString()}</p>
      </div>
      <h2 style="color:#1a1a2e;border-bottom:1px solid #eee;padding-bottom:8px">Event Details</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:8px;font-weight:600;width:150px">Location</td><td style="padding:8px">${currentEvent.location || '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:600">Start Date</td><td style="padding:8px">${currentEvent.start_date ? new Date(currentEvent.start_date).toLocaleDateString() : '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:600">End Date</td><td style="padding:8px">${currentEvent.end_date ? new Date(currentEvent.end_date).toLocaleDateString() : '—'}</td></tr>
        <tr><td style="padding:8px;font-weight:600">Status</td><td style="padding:8px">${currentEvent.status === 'ended' ? '🔴 Ended' : '🟢 Active'}</td></tr>
        <tr><td style="padding:8px;font-weight:600">Event Barcode</td><td style="padding:8px;font-family:monospace">${currentEvent.barcode_id}</td></tr>
      </table>
      <h2 style="color:#1a1a2e;border-bottom:1px solid #eee;padding-bottom:8px">Attendance Summary</h2>
      <div style="display:flex;gap:20px;margin-bottom:24px">
        <div style="flex:1;text-align:center;padding:20px;background:#f0f0ff;border-radius:10px">
          <div style="font-size:32px;font-weight:800;color:#6c63ff">${total}</div><div style="color:#666">Total</div></div>
        <div style="flex:1;text-align:center;padding:20px;background:#e8fff0;border-radius:10px">
          <div style="font-size:32px;font-weight:800;color:#00b868">${present}</div><div style="color:#666">Present</div></div>
        <div style="flex:1;text-align:center;padding:20px;background:#fff0f0;border-radius:10px">
          <div style="font-size:32px;font-weight:800;color:#ff5050">${absent}</div><div style="color:#666">Absent</div></div>
        <div style="flex:1;text-align:center;padding:20px;background:#f0f0ff;border-radius:10px">
          <div style="font-size:32px;font-weight:800;color:#6c63ff">${rate}%</div><div style="color:#666">Rate</div></div>
      </div>
      ${eventGroups.length > 0 ? `
        <h2 style="color:#1a1a2e;border-bottom:1px solid #eee;padding-bottom:8px">Groups Overview</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead><tr style="background:#f5f5ff"><th style="padding:8px;border:1px solid #ddd;text-align:left">Group</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Leader</th><th style="padding:8px;border:1px solid #ddd">Members</th><th style="padding:8px;border:1px solid #ddd">Attendance</th></tr></thead>
          <tbody>${groupRows}</tbody>
        </table>` : ''}
      <h2 style="color:#1a1a2e;border-bottom:1px solid #eee;padding-bottom:8px">Full Attendance List</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead><tr style="background:#f5f5ff"><th style="padding:8px;border:1px solid #ddd;text-align:left">Name</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Barcode</th><th style="padding:8px;border:1px solid #ddd">Role</th><th style="padding:8px;border:1px solid #ddd">Status</th><th style="padding:8px;border:1px solid #ddd">Check-in Time</th></tr></thead>
        <tbody>${attendeeRows}</tbody>
      </table>
      <div style="text-align:center;padding:20px;color:#999;font-size:12px;border-top:1px solid #eee;margin-top:30px">Generated by Event Manager</div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  // ─── LOADING / AUTH ───
  if (loading) return <div style={{ ...S.app, display:"flex",alignItems:"center",justifyContent:"center" }}><div style={{ color:"#6c63ff",fontSize:16 }}>Loading...</div></div>;
  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); fetchProfile(u.id); }} />;

  // ═══════════════════════════════════
  // RENDER SECTIONS
  // ═══════════════════════════════════

  const renderEvents = () => (
    <div style={{ padding:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Events</h2>
        {isAdmin && <button style={S.btn(true)} onClick={()=>setModal("event")}><PlusIcon/> New Event</button>}
      </div>
      {events.length === 0 ? (
        <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}>
          <div style={{ fontSize:36,marginBottom:12 }}>📅</div>
          <div style={{ fontSize:14 }}>No events yet.{isAdmin ? " Create your first event!" : ""}</div>
        </div>
      ) : events.map(ev => {
        const evP = participants.filter(p => p.event_id === ev.id);
        const evA = attendance.filter(a => a.event_id === ev.id && a.checked_in).length;
        const evG = groups.filter(g => g.event_id === ev.id).length;
        return (
          <div key={ev.id} style={{ ...S.card, borderColor: selectedEvent===ev.id ? "rgba(108,99,255,0.5)" : undefined, cursor:"pointer", opacity: ev.status==='ended' ? 0.6 : 1 }}
            onClick={() => setSelectedEvent(ev.id)}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                  <span style={{ fontSize:16,fontWeight:700 }}>{ev.name}</span>
                  {selectedEvent===ev.id && <Badge color="#00d278">Selected</Badge>}
                  {ev.status==='ended' && <Badge color="#ff5050">Ended</Badge>}
                </div>
                <div style={{ fontSize:12,color:"#7a7a9e",marginTop:4 }}>
                  {ev.start_date && new Date(ev.start_date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  {ev.end_date && ` → ${new Date(ev.end_date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`}
                  {ev.location && ` · ${ev.location}`}
                </div>
                <div style={{ fontSize:11,color:"#6c63ff",fontFamily:"monospace",marginTop:4 }}>
                  {ev.barcode_id}
                </div>
              </div>
              {isAdmin && (
                <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                  {ev.status !== 'ended' && (
                    <button style={{ ...S.btn(false),padding:"6px 10px",fontSize:11 }}
                      onClick={e => { e.stopPropagation(); endEvent(ev.id); }}>End</button>
                  )}
                  <button style={{ ...S.btn(false),padding:"6px 10px",color:"#ff5050" }}
                    onClick={e => { e.stopPropagation(); deleteEvent(ev.id); }}><TrashIcon/></button>
                </div>
              )}
            </div>
            <div style={{ display:"flex",gap:8,marginTop:12 }}>
              <div style={S.stat}><div style={S.statNum}>{evP.length}</div><div style={S.statLabel}>Participants</div></div>
              <div style={S.stat}><div style={S.statNum}>{evG}</div><div style={S.statLabel}>Groups</div></div>
              <div style={S.stat}><div style={S.statNum}>{evA}</div><div style={S.statLabel}>Attended</div></div>
            </div>
            {/* Event barcode */}
            <div style={{ marginTop:12,opacity:0.8 }} dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(ev.barcode_id, 180, 40) }}/>
          </div>
        );
      })}
    </div>
  );

  const renderParticipants = () => (
    <div style={{ padding:16 }}>
      {!selectedEvent ? (
        <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}>
          <div style={{ fontSize:36,marginBottom:12 }}>👆</div>
          <div style={{ fontSize:14 }}>Select an event from the Events tab first</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>
            Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
            <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>
              Participants <span style={{ color:"#6c63ff",fontSize:14 }}>({eventParticipants.length})</span>
            </h2>
            <div style={{ display:"flex",gap:6 }}>
              {eventParticipants.length > 0 && <button style={S.btn(false)} onClick={printBarcodes}>🖨️</button>}
              {isAdmin && <button style={S.btn(true)} onClick={()=>setModal("participant")}><PlusIcon/> Add</button>}
            </div>
          </div>
          <input type="text" placeholder="Search name, email, barcode..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ ...S.input,marginBottom:12 }}/>
          {eventParticipants.length === 0 ? (
            <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}>
              <div style={{ fontSize:36,marginBottom:12 }}>👥</div>
              <div style={{ fontSize:14 }}>No participants yet.</div>
            </div>
          ) : (
            <div style={{ maxHeight:"60vh",overflowY:"auto" }}>
              {filteredParticipants.map(p => (
                <div key={p.id} style={{ ...S.card,padding:12 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontSize:14,fontWeight:600 }}>{p.full_name}</span>
                        {p.is_leader && <Badge color="#f0a500">⭐ Leader</Badge>}
                      </div>
                      <div style={{ fontSize:11,color:"#7a7a9e",marginTop:3 }}>
                        {p.email && <span>{p.email} · </span>}
                        <span style={{ fontFamily:"monospace",color:"#6c63ff" }}>{p.barcode_id}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display:"flex",gap:4 }}>
                        <button style={{ ...S.btn(false),padding:"5px 10px",fontSize:11,color:p.is_leader?"#f0a500":"#b0b0d0" }} onClick={()=>toggleLeader(p)}>⭐</button>
                        <button style={{ ...S.btn(false),padding:"5px 10px",color:"#ff5050" }} onClick={()=>deleteParticipant(p.id)}><TrashIcon/></button>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop:8,opacity:0.8 }} dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(p.barcode_id, 160, 35) }}/>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderGroups = () => {
    if (!selectedEvent) return (
      <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>👆</div><div style={{ fontSize:14 }}>Select an event first</div></div></div>
    );
    const unassigned = eventParticipants.filter(p => !p.is_leader && !p.group_id);
    return (
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong></div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Groups</h2>
          {isAdmin && (
            <div style={{ display:"flex",gap:6 }}>
              <button style={S.btn(false)} onClick={autoAssignGroups}><GroupIcon/> Auto</button>
              <button style={S.btn(true)} onClick={()=>setModal("group")}><PlusIcon/> New</button>
            </div>
          )}
        </div>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:12,background:"rgba(108,99,255,0.06)",padding:"10px 14px",borderRadius:10 }}>
          💡 Mark leaders in the Participants tab, then Auto-Assign distributes members evenly.
        </div>
        {eventGroups.length === 0 ? (
          <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>👨‍👩‍👧‍👦</div><div style={{ fontSize:14 }}>No groups yet.</div></div>
        ) : eventGroups.map(g => {
          const leader = eventParticipants.find(p => p.id === g.leader_id);
          const members = eventParticipants.filter(p => p.group_id === g.id && !p.is_leader);
          return (
            <div key={g.id} style={S.card}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div style={{ fontSize:15,fontWeight:700 }}>{g.name}</div>
                <Badge>{members.length + (leader?1:0)} members</Badge>
              </div>
              {leader && (
                <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(240,165,0,0.08)",borderRadius:10,marginBottom:8,border:"1px solid rgba(240,165,0,0.15)" }}>
                  <span>⭐</span><span style={{ fontSize:13,fontWeight:600,color:"#f0a500" }}>{leader.full_name}</span>
                  <span style={{ fontSize:11,color:"#7a7a9e",marginLeft:"auto" }}>Leader</span>
                </div>
              )}
              {members.map(m => (
                <div key={m.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",borderRadius:8,background:"rgba(108,99,255,0.04)",marginBottom:4 }}>
                  <span style={{ fontSize:13 }}>{m.full_name}</span>
                  {isAdmin && <button style={{ ...S.btn(false),padding:"3px 8px",fontSize:11 }} onClick={()=>removeFromGroup(m.id)}>✕</button>}
                </div>
              ))}
              {isAdmin && unassigned.length > 0 && (
                <select style={{ ...S.input,marginTop:8,fontSize:12,padding:"6px 10px" }} value="" onChange={e=>{ if(e.target.value) assignToGroup(g.id, Number(e.target.value)); }}>
                  <option value="">+ Add member...</option>
                  {unassigned.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderAttendance = () => {
    if (!selectedEvent) return (
      <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>📋</div><div style={{ fontSize:14 }}>Select an event first</div></div></div>
    );
    return (
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong></div>
        <h2 style={{ margin:"0 0 12px",fontSize:18,fontWeight:700 }}>Attendance</h2>

        {/* Scanner */}
        <div style={{ ...S.card,marginBottom:16,border:scanMode?"1px solid rgba(0,210,255,0.4)":undefined,background:scanMode?"rgba(0,210,255,0.05)":undefined }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:scanMode?12:0 }}>
            <div style={{ fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:8 }}><ScanIcon/> Barcode Scanner</div>
            <button style={S.btn(scanMode)} onClick={()=>setScanMode(!scanMode)}>{scanMode?"Close":"Open"}</button>
          </div>
          {scanMode && (
            <div>
              <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Scan a barcode or type the code and press Enter</div>
              <input ref={scanRef} type="text" value={scanInput} onChange={e=>setScanInput(e.target.value)} onKeyDown={handleScan} placeholder="Scan barcode..." style={{ ...S.input,fontSize:18,fontFamily:"monospace",textAlign:"center",letterSpacing:3 }} autoFocus/>
            </div>
          )}
        </div>

        {scanResult && (
          <div style={S.scanBanner(scanResult.success)}>
            {scanResult.success ? <><CheckIcon/> {scanResult.name} — checked in!</> : <>⚠️ Barcode "{scanResult.barcodeId}" not found</>}
          </div>
        )}

        <div style={{ display:"flex",gap:8,marginBottom:16 }}>
          <div style={S.stat}><div style={S.statNum}>{presentCount}</div><div style={S.statLabel}>Present</div></div>
          <div style={S.stat}><div style={{ ...S.statNum,background:"linear-gradient(135deg,#ff5050,#ff8888)",WebkitBackgroundClip:"text" }}>{eventParticipants.length - presentCount}</div><div style={S.statLabel}>Absent</div></div>
          <div style={S.stat}><div style={S.statNum}>{eventParticipants.length>0?Math.round(presentCount/eventParticipants.length*100):0}%</div><div style={S.statLabel}>Rate</div></div>
        </div>

        <div style={{ maxHeight:"50vh",overflowY:"auto" }}>
          {eventParticipants.map(p => {
            const att = eventAttendance.find(a => a.participant_id === p.id);
            return (
              <div key={p.id} style={{ ...S.card,padding:12,display:"flex",alignItems:"center",justifyContent:"space-between",borderColor:att?.checked_in?"rgba(0,210,120,0.25)":undefined,background:att?.checked_in?"rgba(0,210,120,0.04)":undefined }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:6 }}>
                    {p.full_name} {p.is_leader && <Badge color="#f0a500">Leader</Badge>}
                  </div>
                  <div style={{ fontSize:11,color:"#7a7a9e",fontFamily:"monospace" }}>
                    {p.barcode_id}
                    {att?.checked_in && <span style={{ color:"#00d278",marginLeft:8 }}>✓ {new Date(att.check_in_time).toLocaleTimeString()}</span>}
                  </div>
                </div>
                <button style={{ ...S.btn(att?.checked_in),background:att?.checked_in?"linear-gradient(135deg,#00d278,#00b868)":"rgba(108,99,255,0.12)",padding:"8px 14px" }} onClick={()=>markAttendance(p.id)}>
                  {att?.checked_in ? <><CheckIcon/> Present</> : "Mark"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReports = () => {
    if (!selectedEvent) return (
      <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>📊</div><div style={{ fontSize:14 }}>Select an event first</div></div></div>
    );
    const rate = eventParticipants.length > 0 ? Math.round(presentCount / eventParticipants.length * 100) : 0;
    return (
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong></div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Reports</h2>
          <button style={S.btn(true)} onClick={generateReport}><ReportIcon/> Generate Report</button>
        </div>

        {/* Quick stats */}
        <div style={S.card}>
          <div style={{ fontSize:14,fontWeight:700,marginBottom:12 }}>Event Summary</div>
          <div style={{ display:"flex",gap:8,marginBottom:16 }}>
            <div style={S.stat}><div style={S.statNum}>{eventParticipants.length}</div><div style={S.statLabel}>Total</div></div>
            <div style={S.stat}><div style={{ ...S.statNum,background:"linear-gradient(135deg,#00d278,#00b868)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>{presentCount}</div><div style={S.statLabel}>Present</div></div>
            <div style={S.stat}><div style={{ ...S.statNum,background:"linear-gradient(135deg,#ff5050,#ff8888)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>{eventParticipants.length - presentCount}</div><div style={S.statLabel}>Absent</div></div>
            <div style={S.stat}><div style={S.statNum}>{rate}%</div><div style={S.statLabel}>Rate</div></div>
          </div>

          {/* Attendance bar */}
          <div style={{ background:"rgba(255,80,80,0.2)",borderRadius:8,height:10,overflow:"hidden" }}>
            <div style={{ width:`${rate}%`,height:"100%",background:"linear-gradient(90deg,#00d278,#00b868)",borderRadius:8,transition:"width 0.5s ease" }}/>
          </div>
        </div>

        {/* Group breakdown */}
        {eventGroups.length > 0 && (
          <div style={S.card}>
            <div style={{ fontSize:14,fontWeight:700,marginBottom:12 }}>Group Breakdown</div>
            {eventGroups.map(g => {
              const members = eventParticipants.filter(p => p.group_id === g.id);
              const gPresent = members.filter(m => eventAttendance.find(a => a.participant_id === m.id && a.checked_in)).length;
              const gRate = members.length > 0 ? Math.round(gPresent / members.length * 100) : 0;
              const leader = eventParticipants.find(p => p.id === g.leader_id);
              return (
                <div key={g.id} style={{ padding:"10px 0",borderBottom:"1px solid rgba(108,99,255,0.08)" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div>
                      <span style={{ fontSize:13,fontWeight:600 }}>{g.name}</span>
                      {leader && <span style={{ fontSize:11,color:"#f0a500",marginLeft:8 }}>⭐ {leader.full_name}</span>}
                    </div>
                    <Badge color={gRate >= 80 ? "#00d278" : gRate >= 50 ? "#f0a500" : "#ff5050"}>{gPresent}/{members.length} ({gRate}%)</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ ...S.card,textAlign:"center",color:"#7a7a9e",fontSize:13 }}>
          Click <strong>"Generate Report"</strong> to open a printable full report with all details.
        </div>
      </div>
    );
  };

  // ─── MODALS ───
  const renderModal = () => {
    if (!modal) return null;
    return (
      <div style={S.modal} onClick={()=>{setModal(null);setBulkAdd(false);}}>
        <div style={S.modalContent} onClick={e=>e.stopPropagation()}>
          {modal === "event" && (
            <>
              <h3 style={{ margin:"0 0 18px",fontSize:18,fontWeight:700 }}>Create Event</h3>
              <div style={{ marginBottom:14 }}><label style={S.label}>Event Name *</label><input id="ev-name" style={S.input} placeholder="e.g., Annual Conference 2026"/></div>
              <div style={{ display:"flex",gap:10,marginBottom:14 }}>
                <div style={{ flex:1 }}><label style={S.label}>Start Date</label><input id="ev-start" type="date" style={S.input}/></div>
                <div style={{ flex:1 }}><label style={S.label}>End Date</label><input id="ev-end" type="date" style={S.input}/></div>
              </div>
              <div style={{ marginBottom:14 }}><label style={S.label}>Location</label><input id="ev-loc" style={S.input} placeholder="Convention Center"/></div>
              <div style={{ marginBottom:18 }}><label style={S.label}>Description</label><textarea id="ev-desc" style={{ ...S.input,minHeight:70,resize:"vertical" }} placeholder="Event details..."/></div>
              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button style={S.btn(false)} onClick={()=>setModal(null)}>Cancel</button>
                <button style={S.btn(true)} onClick={createEvent}>Create Event</button>
              </div>
            </>
          )}
          {modal === "participant" && (
            <>
              <h3 style={{ margin:"0 0 4px",fontSize:18,fontWeight:700 }}>Add Participants</h3>
              <div style={{ display:"flex",gap:8,marginBottom:18 }}>
                <button style={{ ...S.btn(!bulkAdd),fontSize:12 }} onClick={()=>setBulkAdd(false)}>Single</button>
                <button style={{ ...S.btn(bulkAdd),fontSize:12 }} onClick={()=>setBulkAdd(true)}>Bulk Import</button>
              </div>
              {!bulkAdd ? (
                <>
                  <div style={{ marginBottom:14 }}><label style={S.label}>Full Name *</label><input id="p-name" style={S.input} placeholder="Sarah Johnson"/></div>
                  <div style={{ marginBottom:14 }}><label style={S.label}>Email</label><input id="p-email" style={S.input} placeholder="email@example.com"/></div>
                  <div style={{ marginBottom:18 }}><label style={S.label}>Phone</label><input id="p-phone" style={S.input} placeholder="+1 234 567 890"/></div>
                  <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                    <button style={S.btn(false)} onClick={()=>setModal(null)}>Cancel</button>
                    <button style={S.btn(true)} onClick={addParticipant}>Add</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom:8 }}>
                    <label style={S.label}>Paste participants (one per line)</label>
                    <div style={{ fontSize:11,color:"#7a7a9e",marginBottom:8 }}>Format: Name, Email, Phone</div>
                    <textarea id="p-bulk" style={{ ...S.input,minHeight:180,resize:"vertical",fontFamily:"monospace",fontSize:12 }} placeholder={"John Smith, john@email.com, +1234567890\nJane Doe, jane@email.com\nBob Wilson"}/>
                  </div>
                  <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                    <button style={S.btn(false)} onClick={()=>setModal(null)}>Cancel</button>
                    <button style={S.btn(true)} onClick={addBulkParticipants}>Import All</button>
                  </div>
                </>
              )}
            </>
          )}
          {modal === "group" && (
            <>
              <h3 style={{ margin:"0 0 18px",fontSize:18,fontWeight:700 }}>Create Group</h3>
              <div style={{ marginBottom:14 }}><label style={S.label}>Group Name *</label><input id="g-name" style={S.input} placeholder="Group Alpha"/></div>
              <div style={{ marginBottom:18 }}>
                <label style={S.label}>Assign Leader</label>
                <select id="g-leader" style={S.input}>
                  <option value="">No leader</option>
                  {eventParticipants.filter(p=>p.is_leader).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button style={S.btn(false)} onClick={()=>setModal(null)}>Cancel</button>
                <button style={S.btn(true)} onClick={createGroup}>Create</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(108,99,255,0.3);border-radius:4px}@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}input:focus,textarea:focus,select:focus{border-color:rgba(108,99,255,0.5)!important;box-shadow:0 0 0 3px rgba(108,99,255,0.1)}`}</style>

      <div style={S.header}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <h1 style={S.title}>Event Manager</h1>
            <div style={S.subtitle}>
              Signed in as <strong style={{ color:"#e0e0f0" }}>{profile?.full_name}</strong>
              <Badge color={isAdmin?"#6c63ff":"#f0a500"}>{profile?.role}</Badge>
            </div>
          </div>
          <button style={{ ...S.btn(false),padding:"8px 12px" }} onClick={handleLogout}><LogoutIcon/></button>
        </div>
      </div>

      <div style={S.tabs}>
        {TABS.map((t,i) => <button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {tab===0 && renderEvents()}
      {tab===1 && renderParticipants()}
      {tab===2 && renderGroups()}
      {tab===3 && renderAttendance()}
      {tab===4 && renderReports()}

      {renderModal()}
    </div>
  );
}
