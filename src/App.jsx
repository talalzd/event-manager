import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "./supabaseClient";

const genCode = (prefix = "EV") => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = prefix + "-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const XIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const ScanIcon = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 7h8M5 9h8M5 11h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V3a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4 4l.5 8a1 1 0 001 1h3a1 1 0 001-1L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const GroupIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 13c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5M8 13c0-2 1.5-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const LogoutIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M6 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ReportIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2h5l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M5 9h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const LinkIcon = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6 8a2 2 0 002.83 0l2-2a2 2 0 00-2.83-2.83l-.5.5M8 6a2 2 0 00-2.83 0l-2 2a2 2 0 002.83 2.83l.5-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;

const Badge = ({ children, color = "#6c63ff" }) => (
  <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:color+"18",color,letterSpacing:0.3 }}>{children}</span>
);

const TABS = ["Events", "Pending", "Participants", "Groups", "Attendance", "Reports", "Questions"];

const S = {
  app: { minHeight:"100vh", background:"linear-gradient(145deg,#0d0d1a 0%,#1a1a2e 40%,#16213e 100%)", fontFamily:"'Outfit','Segoe UI',sans-serif", color:"#e0e0f0" },
  header: { padding:"20px 24px 14px", background:"linear-gradient(135deg,rgba(108,99,255,0.12),rgba(0,210,255,0.06))", borderBottom:"1px solid rgba(108,99,255,0.15)" },
  title: { fontSize:22,fontWeight:800,letterSpacing:-0.5,background:"linear-gradient(135deg,#6c63ff,#00d2ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0 },
  subtitle: { fontSize:12,color:"#7a7a9e",marginTop:4 },
  tabs: { display:"flex",gap:0,padding:"0 12px",background:"rgba(10,10,22,0.6)",borderBottom:"1px solid rgba(108,99,255,0.1)",overflowX:"auto" },
  tab: (a) => ({ padding:"12px 14px",fontSize:12,fontWeight:a?700:500,color:a?"#6c63ff":"#7a7a9e",borderBottom:a?"2px solid #6c63ff":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",background:"none",border:"none",fontFamily:"inherit" }),
  card: { background:"rgba(30,30,55,0.7)",borderRadius:14,border:"1px solid rgba(108,99,255,0.12)",padding:16,marginBottom:12,backdropFilter:"blur(10px)" },
  btn: (p) => ({ display:"inline-flex",alignItems:"center",gap:6,padding:p?"10px 20px":"8px 14px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit",background:p?"linear-gradient(135deg,#6c63ff,#5a52e0)":"rgba(108,99,255,0.12)",color:p?"#fff":"#b0b0d0",boxShadow:p?"0 4px 15px rgba(108,99,255,0.3)":"none" }),
  input: { width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid rgba(108,99,255,0.2)",background:"rgba(15,15,35,0.8)",color:"#e0e0f0",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box" },
  label: { fontSize:12,fontWeight:600,color:"#8888aa",marginBottom:6,display:"block",textTransform:"uppercase",letterSpacing:0.8 },
  modal: { position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",padding:16 },
  modalContent: { background:"linear-gradient(160deg,#1a1a2e,#16213e)",borderRadius:18,padding:24,width:"100%",maxWidth:440,border:"1px solid rgba(108,99,255,0.2)",maxHeight:"85vh",overflowY:"auto" },
  stat: { textAlign:"center",padding:"14px 10px",background:"rgba(108,99,255,0.06)",borderRadius:12,flex:1 },
  statNum: { fontSize:26,fontWeight:800,background:"linear-gradient(135deg,#6c63ff,#00d2ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" },
  statLabel: { fontSize:10,color:"#7a7a9e",marginTop:4,textTransform:"uppercase",letterSpacing:0.8 },
};

// ═══ PUBLIC REGISTRATION FORM (Arabic RTL) ═══
function RegistrationForm({ eventCode }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [extraAnswers, setExtraAnswers] = useState({});
  const [form, setForm] = useState({
    full_name: "", gender: "", phone: "",
    national_id_type: "", national_id: "",
    university_id: "", university_email: "",
    is_volunteer_member: "", has_organizing_experience: "",
    pledge_attendance: false, pledge_guidelines: false,
  });

  useEffect(() => {
    (async () => {
      const [ev, qs] = await Promise.all([
        supabase.from('events').select('*').eq('barcode_id', eventCode).maybeSingle(),
        supabase.from('form_questions').select('*').order('order_index', { ascending: true }),
      ]);
      setEvent(ev.data);
      setQuestions(qs.data || []);
      setLoading(false);
    })();
  }, [eventCode]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    const required = ['full_name','gender','phone','national_id_type','national_id','university_id','university_email','is_volunteer_member','has_organizing_experience'];
    for (const k of required) {
      if (!form[k]) { setError("جميع الحقول مطلوبة"); return; }
    }
    // Validate dynamic questions
    for (const q of questions) {
      if (q.is_required && !extraAnswers[q.id]) {
        setError("جميع الحقول مطلوبة"); return;
      }
    }
    if (!form.pledge_attendance || !form.pledge_guidelines) {
      setError("يجب الموافقة على التعهدات"); return;
    }
    setSubmitting(true);
    const { error: e } = await supabase.from('participants').insert({
      event_id: event.id,
      full_name: form.full_name,
      email: form.university_email,
      phone: form.phone,
      gender: form.gender,
      national_id_type: form.national_id_type,
      national_id: form.national_id,
      university_id: form.university_id,
      university_email: form.university_email,
      is_volunteer_member: form.is_volunteer_member === 'yes',
      has_organizing_experience: form.has_organizing_experience === 'yes',
      pledge_attendance: form.pledge_attendance,
      pledge_guidelines: form.pledge_guidelines,
      extra_answers: extraAnswers,
      status: 'pending',
      is_leader: false,
    });
    setSubmitting(false);
    if (e) { setError(e.message); return; }
    setSubmitted(true);
  };

  const R = {
    page: { minHeight:"100vh",background:"linear-gradient(145deg,#0d0d1a 0%,#1a1a2e 40%,#16213e 100%)",fontFamily:"'Tajawal','Noto Kufi Arabic',sans-serif",color:"#e0e0f0",padding:"24px 16px",direction:"rtl" },
    container: { maxWidth:560,margin:"0 auto" },
    card: { background:"rgba(30,30,55,0.7)",borderRadius:16,border:"1px solid rgba(108,99,255,0.15)",padding:24 },
    title: { fontSize:24,fontWeight:800,margin:"0 0 6px",background:"linear-gradient(135deg,#6c63ff,#00d2ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" },
    label: { fontSize:14,fontWeight:600,color:"#c0c0e0",marginBottom:8,display:"block" },
    input: { width:"100%",padding:"12px 16px",borderRadius:10,border:"1px solid rgba(108,99,255,0.25)",background:"rgba(15,15,35,0.8)",color:"#e0e0f0",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box",textAlign:"right" },
    field: { marginBottom:18 },
    radioGroup: { display:"flex",gap:10,flexWrap:"wrap" },
    radio: (sel) => ({ flex:1,minWidth:120,padding:"12px 16px",borderRadius:10,border:`1px solid ${sel?"#6c63ff":"rgba(108,99,255,0.2)"}`,background:sel?"rgba(108,99,255,0.15)":"rgba(15,15,35,0.6)",color:sel?"#6c63ff":"#c0c0e0",cursor:"pointer",fontSize:14,fontWeight:600,textAlign:"center",transition:"all 0.2s" }),
    check: (sel) => ({ display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderRadius:10,border:`1px solid ${sel?"#00d278":"rgba(108,99,255,0.2)"}`,background:sel?"rgba(0,210,120,0.08)":"rgba(15,15,35,0.6)",cursor:"pointer",fontSize:14,color:sel?"#00d278":"#c0c0e0",fontWeight:500 }),
    submitBtn: { width:"100%",padding:"14px 20px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:16,fontFamily:"inherit",background:"linear-gradient(135deg,#6c63ff,#5a52e0)",color:"#fff",boxShadow:"0 4px 20px rgba(108,99,255,0.4)" },
  };

  if (loading) return <div style={R.page}><div style={{ textAlign:"center",color:"#6c63ff" }}>جاري التحميل...</div></div>;

  if (!event) return (
    <div style={R.page}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={R.container}>
        <div style={{ ...R.card,textAlign:"center" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>⚠️</div>
          <h2 style={{ color:"#ff5050",margin:"0 0 8px" }}>الفعالية غير موجودة</h2>
          <p style={{ color:"#7a7a9e" }}>الرابط غير صحيح أو انتهت الفعالية</p>
        </div>
      </div>
    </div>
  );

  if (submitted) return (
    <div style={R.page}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={R.container}>
        <div style={{ ...R.card,textAlign:"center",padding:40 }}>
          <div style={{ fontSize:64,marginBottom:16 }}>✅</div>
          <h2 style={{ color:"#00d278",margin:"0 0 12px",fontSize:24 }}>تم التسجيل بنجاح</h2>
          <p style={{ color:"#c0c0e0",fontSize:15,lineHeight:1.7 }}>تم استلام طلبك بنجاح. سيتم مراجعته من قبل المشرفين.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={R.page}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>{`input:focus,select:focus{border-color:#6c63ff!important;box-shadow:0 0 0 3px rgba(108,99,255,0.1)}`}</style>
      <div style={R.container}>
        <div style={{ marginBottom:20,textAlign:"center" }}>
          <h1 style={R.title}>التسجيل في الفعالية</h1>
          <div style={{ color:"#c0c0e0",fontSize:18,fontWeight:600,marginTop:8 }}>{event.name}</div>
          {event.description && <div style={{ color:"#a0a0c0",fontSize:14,marginTop:10,lineHeight:1.7,padding:"12px 16px",background:"rgba(108,99,255,0.06)",borderRadius:10,textAlign:"right" }}>{event.description}</div>}
          <div style={{ color:"#7a7a9e",fontSize:13,marginTop:10,display:"flex",flexDirection:"column",gap:4 }}>
            {event.start_date && <div>📅 {new Date(event.start_date + 'T00:00:00').toLocaleDateString('ar-SA')}{event.end_date && event.end_date !== event.start_date && ` - ${new Date(event.end_date + 'T00:00:00').toLocaleDateString('ar-SA')}`}</div>}
            {(event.start_time || event.end_time) && <div>🕐 {event.start_time?.slice(0,5) || ''}{event.end_time && ` - ${event.end_time.slice(0,5)}`}</div>}
            {event.location && <div>📍 {event.location}</div>}
          </div>
        </div>

        <div style={R.card}>
          <div style={R.field}>
            <label style={R.label}>الاسم الثلاثي (باللغة العربية) *</label>
            <input style={R.input} value={form.full_name} onChange={e=>update('full_name',e.target.value)}/>
          </div>

          <div style={R.field}>
            <label style={R.label}>الجنس *</label>
            <div style={R.radioGroup}>
              <div style={R.radio(form.gender==='male')} onClick={()=>update('gender','male')}>ذكر</div>
              <div style={R.radio(form.gender==='female')} onClick={()=>update('gender','female')}>أنثى</div>
            </div>
          </div>

          <div style={R.field}>
            <label style={R.label}>رقم الجوال *</label>
            <input style={R.input} value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="05xxxxxxxx" dir="ltr"/>
          </div>

          <div style={R.field}>
            <label style={R.label}>نوع الهوية *</label>
            <select style={R.input} value={form.national_id_type} onChange={e=>update('national_id_type',e.target.value)}>
              <option value="">اختر نوع الهوية</option>
              <option value="national">هوية وطنية (للسعوديين)</option>
              <option value="iqama">إقامة (لغير السعوديين)</option>
            </select>
          </div>

          <div style={R.field}>
            <label style={R.label}>رقم الهوية *</label>
            <input style={R.input} value={form.national_id} onChange={e=>update('national_id',e.target.value)} dir="ltr"/>
          </div>

          <div style={R.field}>
            <label style={R.label}>الرقم الجامعي *</label>
            <input style={R.input} value={form.university_id} onChange={e=>update('university_id',e.target.value)} dir="ltr"/>
          </div>

          <div style={R.field}>
            <label style={R.label}>البريد الإلكتروني *</label>
            <input style={R.input} type="email" value={form.university_email} onChange={e=>update('university_email',e.target.value)} dir="ltr"/>
          </div>

          <div style={R.field}>
            <label style={R.label}>هل أنت عضو في وحدة العمل التطوعي؟ *</label>
            <div style={R.radioGroup}>
              <div style={R.radio(form.is_volunteer_member==='yes')} onClick={()=>update('is_volunteer_member','yes')}>نعم</div>
              <div style={R.radio(form.is_volunteer_member==='no')} onClick={()=>update('is_volunteer_member','no')}>لا</div>
            </div>
          </div>

          <div style={R.field}>
            <label style={R.label}>هل لديك تجارب سابقة بالتنظيم؟ *</label>
            <div style={R.radioGroup}>
              <div style={R.radio(form.has_organizing_experience==='yes')} onClick={()=>update('has_organizing_experience','yes')}>نعم</div>
              <div style={R.radio(form.has_organizing_experience==='no')} onClick={()=>update('has_organizing_experience','no')}>لا</div>
            </div>
          </div>

          {/* Dynamic admin-managed questions */}
          {questions.map(q => (
            <div key={q.id} style={R.field}>
              <label style={R.label}>{q.label_ar}{q.is_required && ' *'}</label>
              {q.field_type === 'yes_no' ? (
                <div style={R.radioGroup}>
                  <div style={R.radio(extraAnswers[q.id]==='yes')} onClick={()=>setExtraAnswers(a=>({...a,[q.id]:'yes'}))}>نعم</div>
                  <div style={R.radio(extraAnswers[q.id]==='no')} onClick={()=>setExtraAnswers(a=>({...a,[q.id]:'no'}))}>لا</div>
                </div>
              ) : q.field_type === 'multiple_choice' ? (
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {(q.options || []).map((opt,i) => (
                    <div key={i} style={R.radio(extraAnswers[q.id]===opt)} onClick={()=>setExtraAnswers(a=>({...a,[q.id]:opt}))}>{opt}</div>
                  ))}
                </div>
              ) : (
                <input style={R.input} value={extraAnswers[q.id] || ''} onChange={e=>setExtraAnswers(a=>({...a,[q.id]:e.target.value}))}/>
              )}
            </div>
          ))}

          <div style={R.field}>
            <label style={R.label}>التعهدات *</label>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              <div style={R.check(form.pledge_attendance)} onClick={()=>update('pledge_attendance',!form.pledge_attendance)}>
                <div style={{ width:22,height:22,borderRadius:6,border:`2px solid ${form.pledge_attendance?"#00d278":"#6c63ff"}`,display:"flex",alignItems:"center",justifyContent:"center",background:form.pledge_attendance?"#00d278":"transparent",flexShrink:0 }}>
                  {form.pledge_attendance && <CheckIcon/>}
                </div>
                <span style={{ fontSize:13,lineHeight:1.6 }}>أتعهد بالالتزام والحضور في الوقت المذكور أعلاه</span>
              </div>
              <div style={R.check(form.pledge_guidelines)} onClick={()=>update('pledge_guidelines',!form.pledge_guidelines)}>
                <div style={{ width:22,height:22,borderRadius:6,border:`2px solid ${form.pledge_guidelines?"#00d278":"#6c63ff"}`,display:"flex",alignItems:"center",justifyContent:"center",background:form.pledge_guidelines?"#00d278":"transparent",flexShrink:0 }}>
                  {form.pledge_guidelines && <CheckIcon/>}
                </div>
                <span style={{ fontSize:13,lineHeight:1.6 }}>أتعهد بالإلتزام بجميع التعليمات الموجهة لي من قِبل المشرفين، مما يساهم في تسهيل العمل والظهور بشكل لائق</span>
              </div>
            </div>
          </div>

          {error && <div style={{ color:"#ff5050",fontSize:13,marginBottom:14,padding:"10px 14px",background:"rgba(255,80,80,0.1)",borderRadius:8,textAlign:"center" }}>{error}</div>}

          <button style={{ ...R.submitBtn,opacity:submitting?0.7:1 }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "جاري الإرسال..." : "إرسال التسجيل"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ SELF CHECK-IN PAGE (Arabic RTL) ═══
function CheckInPage({ eventCode }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('events').select('*').eq('barcode_id', eventCode).maybeSingle();
      setEvent(data);
      setLoading(false);
    })();
  }, [eventCode]);

  const handleCheckIn = async () => {
    if (!identifier.trim()) return;
    setSubmitting(true);
    setResult(null);
    const { data, error } = await supabase.rpc('self_checkin', {
      p_event_code: eventCode,
      p_identifier: identifier.trim(),
    });
    setSubmitting(false);
    if (error) { setResult({ success: false, error: error.message }); return; }
    setResult(data);
    if (data.success) setIdentifier("");
  };

  const C = {
    page: { minHeight:"100vh",background:"linear-gradient(145deg,#0d0d1a 0%,#1a1a2e 40%,#16213e 100%)",fontFamily:"'Tajawal','Noto Kufi Arabic',sans-serif",color:"#e0e0f0",padding:"24px 16px",direction:"rtl",display:"flex",alignItems:"center",justifyContent:"center" },
    container: { maxWidth:480,width:"100%" },
    card: { background:"rgba(30,30,55,0.7)",borderRadius:16,border:"1px solid rgba(108,99,255,0.15)",padding:28 },
    title: { fontSize:24,fontWeight:800,margin:"0 0 6px",background:"linear-gradient(135deg,#6c63ff,#00d2ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",textAlign:"center" },
    label: { fontSize:14,fontWeight:600,color:"#c0c0e0",marginBottom:8,display:"block" },
    input: { width:"100%",padding:"14px 18px",borderRadius:12,border:"1px solid rgba(108,99,255,0.25)",background:"rgba(15,15,35,0.8)",color:"#e0e0f0",fontSize:16,fontFamily:"inherit",outline:"none",boxSizing:"border-box",textAlign:"right" },
    btn: { width:"100%",padding:"14px 20px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:16,fontFamily:"inherit",background:"linear-gradient(135deg,#6c63ff,#5a52e0)",color:"#fff",boxShadow:"0 4px 20px rgba(108,99,255,0.4)",marginTop:8 },
  };

  if (loading) return <div style={C.page}><div style={{ color:"#6c63ff" }}>جاري التحميل...</div></div>;

  if (!event) return (
    <div style={C.page}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={C.container}>
        <div style={{ ...C.card,textAlign:"center" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>⚠️</div>
          <h2 style={{ color:"#ff5050",margin:"0 0 8px" }}>الفعالية غير موجودة</h2>
          <p style={{ color:"#7a7a9e" }}>الرابط غير صحيح أو انتهت الفعالية</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={C.page}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>{`input:focus{border-color:#6c63ff!important;box-shadow:0 0 0 3px rgba(108,99,255,0.1)}`}</style>
      <div style={C.container}>
        <div style={{ marginBottom:20,textAlign:"center" }}>
          <div style={{ fontSize:44,marginBottom:8 }}>✅</div>
          <h1 style={C.title}>تسجيل الحضور</h1>
          <div style={{ color:"#c0c0e0",fontSize:18,fontWeight:600,marginTop:8 }}>{event.name}</div>
          {event.location && <div style={{ color:"#7a7a9e",fontSize:13,marginTop:4 }}>📍 {event.location}</div>}
        </div>

        <div style={C.card}>
          {result?.success ? (
            <div style={{ textAlign:"center",padding:"20px 0" }}>
              <div style={{ fontSize:64,marginBottom:16 }}>🎉</div>
              <h2 style={{ color:"#00d278",margin:"0 0 12px",fontSize:22 }}>تم تسجيل حضورك بنجاح</h2>
              <p style={{ color:"#c0c0e0",fontSize:16,marginBottom:20 }}>مرحباً، <strong>{result.name}</strong></p>
              <button style={{ ...C.btn,background:"rgba(108,99,255,0.15)",color:"#c0c0e0",boxShadow:"none" }} onClick={()=>{setResult(null);setIdentifier("");}}>تسجيل شخص آخر</button>
            </div>
          ) : (
            <>
              <label style={C.label}>أدخل اسمك الكامل أو رقم الهوية أو الرقم الجامعي</label>
              <input
                style={C.input}
                value={identifier}
                onChange={e=>setIdentifier(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleCheckIn()}
                placeholder="الاسم الكامل أو رقم الهوية"
                autoFocus
              />
              {result && !result.success && (
                <div style={{ color:"#ff5050",fontSize:14,marginTop:14,padding:"12px 16px",background:"rgba(255,80,80,0.1)",borderRadius:10,textAlign:"center",fontWeight:600 }}>
                  ⚠️ {result.error}
                </div>
              )}
              <button style={{ ...C.btn,opacity:submitting?0.7:1 }} onClick={handleCheckIn} disabled={submitting}>
                {submitting ? "جاري التحقق..." : "تأكيد الحضور"}
              </button>
              <div style={{ textAlign:"center",fontSize:12,color:"#7a7a9e",marginTop:16,lineHeight:1.6 }}>
                يجب أن تكون مسجلاً في الفعالية ومعتمداً من قبل المشرفين
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ AUTH SCREEN ═══
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
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
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
        if (error) throw error;
        if (data.user) onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) onAuth(data.user);
      }
    } catch (err) { setError(err.message); }
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
          {mode === "signup" && (<>
            <div style={{ marginBottom:14 }}><label style={S.label}>Full Name</label><input style={S.input} value={fullName} onChange={e=>setFullName(e.target.value)}/></div>
          </>)}
          <div style={{ marginBottom:14 }}><label style={S.label}>Email</label><input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div style={{ marginBottom:18 }}><label style={S.label}>Password</label><input style={S.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()}/></div>
          {error && <div style={{ color:"#ff5050",fontSize:13,marginBottom:14,padding:"8px 12px",background:"rgba(255,80,80,0.1)",borderRadius:8 }}>{error}</div>}
          <button style={{ ...S.btn(true),width:"100%",justifyContent:"center",padding:"12px 20px",opacity:loading?0.7:1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ ROUTER ═══
export default function App() {
  const path = window.location.pathname;
  const registerMatch = path.match(/^\/register\/(.+)$/);
  if (registerMatch) return <RegistrationForm eventCode={registerMatch[1]}/>;
  const checkinMatch = path.match(/^\/checkin\/(.+)$/);
  if (checkinMatch) return <CheckInPage eventCode={checkinMatch[1]}/>;
  return <AdminApp/>;
}

// ═══ ADMIN APP ═══
function AdminApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [modal, setModal] = useState(null);
  const [questionDraft, setQuestionDraft] = useState(null);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [groups, setGroups] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [formQuestions, setFormQuestions] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [qrModal, setQrModal] = useState(null);
  const [eventQrModal, setEventQrModal] = useState(null);
  const scanRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      else { setUser(null); setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
  };

  useEffect(() => { if (user) loadAllData(); }, [user]);

  const loadAllData = async () => {
    const [ev, pa, gr, at, fq] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('participants').select('*').order('created_at', { ascending: true }),
      supabase.from('groups').select('*').order('created_at', { ascending: true }),
      supabase.from('attendance').select('*'),
      supabase.from('form_questions').select('*').order('order_index', { ascending: true }),
    ]);
    if (ev.data) setEvents(ev.data);
    if (pa.data) setParticipants(pa.data);
    if (gr.data) setGroups(gr.data);
    if (at.data) setAttendance(at.data);
    if (fq.data) setFormQuestions(fq.data);
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('participants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, loadAllData)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => { if (scanMode && scanRef.current) scanRef.current.focus(); }, [scanMode]);

  const isAdmin = profile?.role === 'admin';
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); };

  const createEvent = async () => {
    const name = document.getElementById('ev-name')?.value;
    if (!name) return;
    const { data, error } = await supabase.from('events').insert({
      name,
      description: document.getElementById('ev-desc')?.value || '',
      location: document.getElementById('ev-loc')?.value || '',
      start_date: document.getElementById('ev-start')?.value || null,
      end_date: document.getElementById('ev-end')?.value || null,
      start_time: document.getElementById('ev-stime')?.value || null,
      end_time: document.getElementById('ev-etime')?.value || null,
      barcode_id: genCode("EV"),
      created_by: user.id,
    }).select().single();
    if (data) { setEvents(prev => [data, ...prev]); setModal(null); }
    if (error) alert(error.message);
  };

  const endEvent = async (id) => {
    if (!confirm("Mark this event as ended?")) return;
    await supabase.from('events').update({ status: 'ended' }).eq('id', id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'ended' } : e));
  };

  const deleteEvent = async (id) => {
    if (!confirm("Permanently delete this event and all its data?")) return;
    await supabase.from('events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
    setParticipants(prev => prev.filter(p => p.event_id !== id));
    setGroups(prev => prev.filter(g => g.event_id !== id));
    setAttendance(prev => prev.filter(a => a.event_id !== id));
    if (selectedEvent === id) setSelectedEvent(null);
  };

  const copyRegistrationLink = (ev) => {
    const link = `${window.location.origin}/register/${ev.barcode_id}`;
    navigator.clipboard.writeText(link);
    alert("Registration link copied!\n\n" + link);
  };

  const copyCheckinLink = (ev) => {
    const link = `${window.location.origin}/checkin/${ev.barcode_id}`;
    navigator.clipboard.writeText(link);
    alert("Check-in link copied!\n\n" + link);
  };

  const approveParticipant = async (p) => {
    const barcodeId = genCode("P");
    await supabase.from('participants').update({ status: 'approved', barcode_id: barcodeId }).eq('id', p.id);
    setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, status: 'approved', barcode_id: barcodeId } : x));
  };

  const rejectParticipant = async (id) => {
    if (!confirm("Reject and delete this registration?")) return;
    await supabase.from('participants').delete().eq('id', id);
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const deleteParticipant = async (id) => {
    if (!confirm("Delete this participant?")) return;
    await supabase.from('participants').delete().eq('id', id);
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const toggleLeader = async (p) => {
    await supabase.from('participants').update({ is_leader: !p.is_leader }).eq('id', p.id);
    setParticipants(prev => prev.map(x => x.id === p.id ? { ...x, is_leader: !x.is_leader } : x));
  };

  const createGroup = async () => {
    if (!selectedEvent) return;
    const name = document.getElementById('g-name')?.value;
    if (!name) return;
    const leaderId = document.getElementById('g-leader')?.value;
    const { data } = await supabase.from('groups').insert({
      event_id: selectedEvent, name,
      leader_id: leaderId ? Number(leaderId) : null,
    }).select().single();
    if (data) { setGroups(prev => [...prev, data]); setModal(null); }
  };

  const autoAssignGroups = async () => {
    if (!selectedEvent) return;
    const approved = participants.filter(p => p.event_id === selectedEvent && p.status === 'approved');
    const leaders = approved.filter(p => p.is_leader);
    const members = approved.filter(p => !p.is_leader);
    if (leaders.length === 0) { alert("Mark approved participants as leaders first!"); return; }
    await supabase.from('groups').delete().eq('event_id', selectedEvent);
    const newGroups = [];
    for (let i = 0; i < leaders.length; i++) {
      const { data } = await supabase.from('groups').insert({
        event_id: selectedEvent, name: `Group ${i + 1}`, leader_id: leaders[i].id,
      }).select().single();
      if (data) newGroups.push(data);
    }
    for (let i = 0; i < members.length; i++) {
      await supabase.from('participants').update({ group_id: newGroups[i % newGroups.length].id }).eq('id', members[i].id);
    }
    await loadAllData();
  };

  const assignToGroup = async (groupId, participantId) => {
    await supabase.from('participants').update({ group_id: groupId }).eq('id', participantId);
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, group_id: groupId } : p));
  };

  const removeFromGroup = async (id) => {
    await supabase.from('participants').update({ group_id: null }).eq('id', id);
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, group_id: null } : p));
  };

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
        event_id: selectedEvent, participant_id: participantId,
        checked_in: true, check_in_time: new Date().toISOString(), checked_in_by: user.id,
      }).select().single();
      if (data) setAttendance(prev => [...prev, data]);
    }
  };

  const handleScan = (e) => {
    if (e.key === "Enter" && scanInput.trim() && selectedEvent) {
      const code = scanInput.trim().toUpperCase();
      const p = eventApproved.find(p => p.barcode_id === code);
      if (p) {
        markAttendance(p.id);
        setScanResult({ success: true, name: p.full_name });
      } else {
        setScanResult({ success: false, code });
      }
      setScanInput("");
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  // ─── DYNAMIC QUESTIONS CRUD (admin only) ───
  const openAddQuestion = () => {
    setQuestionDraft({ id: null, label_ar: "", field_type: "yes_no", is_required: true, options: [] });
    setModal("question");
  };

  const openEditQuestion = (q) => {
    setQuestionDraft({
      id: q.id,
      label_ar: q.label_ar || "",
      field_type: q.field_type || "text",
      is_required: !!q.is_required,
      options: Array.isArray(q.options) ? q.options : [],
    });
    setModal("question");
  };

  const saveQuestion = async () => {
    const d = questionDraft;
    if (!d || !d.label_ar.trim()) return;
    const cleanOptions = d.field_type === 'multiple_choice'
      ? d.options.map(o => (o || "").trim()).filter(Boolean)
      : [];
    if (d.field_type === 'multiple_choice' && cleanOptions.length < 2) {
      alert("Please add at least 2 options for a multiple choice question.");
      return;
    }
    const payload = {
      label_ar: d.label_ar.trim(),
      field_type: d.field_type,
      is_required: d.is_required,
      options: cleanOptions,
    };
    if (d.id) {
      await supabase.from('form_questions').update(payload).eq('id', d.id);
      setFormQuestions(prev => prev.map(q => q.id === d.id ? { ...q, ...payload } : q));
    } else {
      const { data } = await supabase.from('form_questions').insert({
        ...payload,
        order_index: formQuestions.length + 1,
      }).select().single();
      if (data) setFormQuestions(prev => [...prev, data]);
    }
    setModal(null);
    setQuestionDraft(null);
  };

  const deleteQuestion = async (id) => {
    if (!confirm("Delete this question? Existing answers will be kept.")) return;
    await supabase.from('form_questions').delete().eq('id', id);
    setFormQuestions(prev => prev.filter(q => q.id !== id));
  };

  const currentEvent = events.find(e => e.id === selectedEvent);
  const eventParticipants = participants.filter(p => p.event_id === selectedEvent);
  const eventPending = eventParticipants.filter(p => p.status === 'pending');
  const eventApproved = eventParticipants.filter(p => p.status === 'approved');
  const eventGroups = groups.filter(g => g.event_id === selectedEvent);
  const eventAttendance = attendance.filter(a => a.event_id === selectedEvent);
  const presentCount = eventAttendance.filter(a => a.checked_in).length;
  const filtered = eventApproved.filter(p =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPending = participants.filter(p => p.status === 'pending').length;

  const printQRCodes = () => {
    const w = window.open('', '_blank');
    const cards = eventApproved.map(p => `
      <div style="display:inline-block;margin:10px;padding:16px;border:2px solid #6c63ff;border-radius:12px;text-align:center;page-break-inside:avoid;width:200px">
        <div style="font-weight:700;margin-bottom:8px;font-size:14px">${p.full_name}</div>
        <div id="qr-${p.id}"></div>
        <div style="font-family:monospace;font-size:10px;margin-top:8px;color:#666">${p.barcode_id}</div>
      </div>`).join('');
    w.document.write(`<html><head><script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script></head><body style="font-family:sans-serif;padding:20px"><h2>${currentEvent?.name} — QR Codes</h2>${cards}<script>
      ${eventApproved.map(p => `QRCode.toCanvas(document.getElementById('qr-${p.id}').appendChild(document.createElement('canvas')), '${p.barcode_id}', {width:160});`).join('\n')}
    </script></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const generateReport = () => {
    if (!selectedEvent || !currentEvent) return;
    const total = eventApproved.length;
    const present = presentCount;
    const rate = total > 0 ? Math.round(present / total * 100) : 0;
    const rows = eventApproved.map(p => {
      const att = eventAttendance.find(a => a.participant_id === p.id);
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #ddd">${p.full_name}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${p.national_id || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${p.university_id || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${p.phone || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${p.barcode_id}</td>
        <td style="padding:6px 8px;border:1px solid #ddd;color:${att?.checked_in?'green':'red'}">${att?.checked_in?'✓ Present':'✗ Absent'}</td>
        <td style="padding:6px 8px;border:1px solid #ddd">${att?.check_in_time?new Date(att.check_in_time).toLocaleTimeString():'—'}</td>
      </tr>`;
    }).join('');
    const w = window.open('', '_blank');
    w.document.write(`<html><body style="font-family:Arial,sans-serif;padding:30px;max-width:900px;margin:0 auto">
      <div style="border-bottom:3px solid #6c63ff;padding-bottom:16px;margin-bottom:24px">
        <h1 style="margin:0">${currentEvent.name}</h1>
        <p style="color:#666">Event Report — ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="display:flex;gap:20px;margin-bottom:24px">
        <div style="flex:1;text-align:center;padding:20px;background:#f0f0ff;border-radius:10px"><div style="font-size:32px;font-weight:800;color:#6c63ff">${total}</div><div>Total</div></div>
        <div style="flex:1;text-align:center;padding:20px;background:#e8fff0;border-radius:10px"><div style="font-size:32px;font-weight:800;color:#00b868">${present}</div><div>Present</div></div>
        <div style="flex:1;text-align:center;padding:20px;background:#fff0f0;border-radius:10px"><div style="font-size:32px;font-weight:800;color:#ff5050">${total-present}</div><div>Absent</div></div>
        <div style="flex:1;text-align:center;padding:20px;background:#f0f0ff;border-radius:10px"><div style="font-size:32px;font-weight:800;color:#6c63ff">${rate}%</div><div>Rate</div></div>
      </div>
      <h2>Attendance</h2>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f5f5ff"><th style="padding:8px;border:1px solid #ddd">Name</th><th style="padding:8px;border:1px solid #ddd">National ID</th><th style="padding:8px;border:1px solid #ddd">University ID</th><th style="padding:8px;border:1px solid #ddd">Phone</th><th style="padding:8px;border:1px solid #ddd">Code</th><th style="padding:8px;border:1px solid #ddd">Status</th><th style="padding:8px;border:1px solid #ddd">Time</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  if (loading) return <div style={{ ...S.app,display:"flex",alignItems:"center",justifyContent:"center" }}><div style={{ color:"#6c63ff" }}>Loading...</div></div>;
  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); fetchProfile(u.id); }}/>;

  const renderEvents = () => (
    <div style={{ padding:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Events</h2>
        {isAdmin && <button style={S.btn(true)} onClick={()=>setModal("event")}><PlusIcon/> New Event</button>}
      </div>
      {events.length === 0 ? (
        <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>📅</div><div>No events yet.</div></div>
      ) : events.map(ev => {
        const evP = participants.filter(p => p.event_id === ev.id && p.status === 'approved').length;
        const evPend = participants.filter(p => p.event_id === ev.id && p.status === 'pending').length;
        const evA = attendance.filter(a => a.event_id === ev.id && a.checked_in).length;
        return (
          <div key={ev.id} style={{ ...S.card,borderColor:selectedEvent===ev.id?"rgba(108,99,255,0.5)":undefined,cursor:"pointer",opacity:ev.status==='ended'?0.6:1 }} onClick={()=>setSelectedEvent(ev.id)}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                  <span style={{ fontSize:16,fontWeight:700 }}>{ev.name}</span>
                  {selectedEvent===ev.id && <Badge color="#00d278">Selected</Badge>}
                  {ev.status==='ended' && <Badge color="#ff5050">Ended</Badge>}
                  {evPend > 0 && <Badge color="#f0a500">{evPend} pending</Badge>}
                </div>
                <div style={{ fontSize:12,color:"#7a7a9e",marginTop:4 }}>
                  {ev.start_date && new Date(ev.start_date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  {ev.end_date && ` → ${new Date(ev.end_date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`}
                  {ev.location && ` · ${ev.location}`}
                </div>
                <div style={{ fontSize:11,color:"#6c63ff",fontFamily:"monospace",marginTop:4 }}>{ev.barcode_id}</div>
              </div>
              {isAdmin && (
                <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                  <button style={{ ...S.btn(false),padding:"6px 10px" }} title="Registration link" onClick={e=>{ e.stopPropagation(); copyRegistrationLink(ev); }}><LinkIcon/></button>
                  <button style={{ ...S.btn(false),padding:"6px 10px",fontSize:11 }} title="Check-in QR code" onClick={e=>{ e.stopPropagation(); setEventQrModal(ev); }}>QR</button>
                  {ev.status !== 'ended' && <button style={{ ...S.btn(false),padding:"6px 10px",fontSize:11 }} onClick={e=>{ e.stopPropagation(); endEvent(ev.id); }}>End</button>}
                  <button style={{ ...S.btn(false),padding:"6px 10px",color:"#ff5050" }} onClick={e=>{ e.stopPropagation(); deleteEvent(ev.id); }}><TrashIcon/></button>
                </div>
              )}
            </div>
            <div style={{ display:"flex",gap:8,marginTop:12 }}>
              <div style={S.stat}><div style={S.statNum}>{evP}</div><div style={S.statLabel}>Approved</div></div>
              <div style={S.stat}><div style={S.statNum}>{groups.filter(g=>g.event_id===ev.id).length}</div><div style={S.statLabel}>Groups</div></div>
              <div style={S.stat}><div style={S.statNum}>{evA}</div><div style={S.statLabel}>Attended</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPending = () => {
    if (!selectedEvent) return <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>👆</div><div>Select an event first</div></div></div>;
    return (
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong></div>
        <h2 style={{ margin:"0 0 12px",fontSize:18,fontWeight:700 }}>Pending <span style={{ color:"#f0a500",fontSize:14 }}>({eventPending.length})</span></h2>
        {eventPending.length === 0 ? (
          <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>✨</div><div>No pending registrations.</div></div>
        ) : eventPending.map(p => (
          <div key={p.id} style={S.card}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:15,fontWeight:700,marginBottom:8 }}>{p.full_name}</div>
                <div style={{ fontSize:12,color:"#9999b5",lineHeight:1.8 }}>
                  <div>📱 {p.phone}</div>
                  <div>✉️ {p.university_email}</div>
                  <div>🆔 {p.national_id_type === 'national' ? 'National ID' : 'Iqama'}: <span style={{ fontFamily:"monospace" }}>{p.national_id}</span></div>
                  <div>🎓 Univ ID: <span style={{ fontFamily:"monospace" }}>{p.university_id}</span></div>
                  <div>👤 {p.gender === 'male' ? 'Male' : 'Female'}</div>
                  <div>🤝 Volunteer unit: {p.is_volunteer_member ? 'Yes' : 'No'}</div>
                  <div>📋 Experience: {p.has_organizing_experience ? 'Yes' : 'No'}</div>
                  {p.extra_answers && Object.keys(p.extra_answers).length > 0 && formQuestions.map(q => {
                    const ans = p.extra_answers[q.id];
                    if (ans === undefined || ans === null || ans === '') return null;
                    const display = ans === 'yes' ? 'نعم' : ans === 'no' ? 'لا' : ans;
                    return <div key={q.id} style={{ direction:"rtl",textAlign:"right",marginTop:4,fontFamily:"'Tajawal',sans-serif" }}>❓ {q.label_ar} — <strong style={{ color:"#c0c0e0" }}>{display}</strong></div>;
                  })}
                </div>
              </div>
              {isAdmin && (
                <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0 }}>
                  <button style={{ ...S.btn(true),padding:"8px 14px",fontSize:12,background:"linear-gradient(135deg,#00d278,#00b868)" }} onClick={()=>approveParticipant(p)}><CheckIcon/> Approve</button>
                  <button style={{ ...S.btn(false),padding:"8px 14px",fontSize:12,color:"#ff5050",background:"rgba(255,80,80,0.12)" }} onClick={()=>rejectParticipant(p.id)}><XIcon/> Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderParticipants = () => {
    if (!selectedEvent) return <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>👆</div><div>Select an event first</div></div></div>;
    return (
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong></div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Approved <span style={{ color:"#6c63ff",fontSize:14 }}>({eventApproved.length})</span></h2>
          {eventApproved.length > 0 && <button style={S.btn(false)} onClick={printQRCodes}>🖨️ Print QRs</button>}
        </div>
        <input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ ...S.input,marginBottom:12 }}/>
        {eventApproved.length === 0 ? (
          <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>👥</div><div>No approved participants yet.</div></div>
        ) : (
          <div style={{ maxHeight:"65vh",overflowY:"auto" }}>
            {filtered.map(p => (
              <div key={p.id} style={{ ...S.card,padding:12 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                      <span style={{ fontSize:14,fontWeight:600 }}>{p.full_name}</span>
                      {p.is_leader && <Badge color="#f0a500">⭐ Leader</Badge>}
                    </div>
                    <div style={{ fontSize:11,color:"#7a7a9e",marginTop:3 }}>
                      {p.phone && <span>{p.phone} · </span>}
                      <span style={{ fontFamily:"monospace",color:"#6c63ff" }}>{p.barcode_id}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:4 }}>
                    <button style={{ ...S.btn(false),padding:"5px 10px",fontSize:11 }} onClick={()=>setQrModal(p)}>QR</button>
                    {isAdmin && <>
                      <button style={{ ...S.btn(false),padding:"5px 10px",fontSize:11,color:p.is_leader?"#f0a500":"#b0b0d0" }} onClick={()=>toggleLeader(p)}>⭐</button>
                      <button style={{ ...S.btn(false),padding:"5px 10px",color:"#ff5050" }} onClick={()=>deleteParticipant(p.id)}><TrashIcon/></button>
                    </>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGroups = () => {
    if (!selectedEvent) return <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}>Select an event first</div></div>;
    const unassigned = eventApproved.filter(p => !p.is_leader && !p.group_id);
    return (
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong></div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Groups</h2>
          {isAdmin && <div style={{ display:"flex",gap:6 }}>
            <button style={S.btn(false)} onClick={autoAssignGroups}><GroupIcon/> Auto</button>
            <button style={S.btn(true)} onClick={()=>setModal("group")}><PlusIcon/> New</button>
          </div>}
        </div>
        {eventGroups.length === 0 ? (
          <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>👨‍👩‍👧‍👦</div><div>No groups yet.</div></div>
        ) : eventGroups.map(g => {
          const leader = eventApproved.find(p => p.id === g.leader_id);
          const members = eventApproved.filter(p => p.group_id === g.id && !p.is_leader);
          return (
            <div key={g.id} style={S.card}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div style={{ fontSize:15,fontWeight:700 }}>{g.name}</div>
                <Badge>{members.length + (leader?1:0)} members</Badge>
              </div>
              {leader && <div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(240,165,0,0.08)",borderRadius:10,marginBottom:8 }}><span>⭐</span><span style={{ fontSize:13,fontWeight:600,color:"#f0a500" }}>{leader.full_name}</span></div>}
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
    if (!selectedEvent) return <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}>Select an event first</div></div>;
    return (
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong></div>
        <h2 style={{ margin:"0 0 12px",fontSize:18,fontWeight:700 }}>Attendance</h2>
        <div style={{ ...S.card,marginBottom:16,border:scanMode?"1px solid rgba(0,210,255,0.4)":undefined,background:scanMode?"rgba(0,210,255,0.05)":undefined }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:scanMode?12:0 }}>
            <div style={{ fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:8 }}><ScanIcon/> QR Scanner</div>
            <button style={S.btn(scanMode)} onClick={()=>setScanMode(!scanMode)}>{scanMode?"Close":"Open"}</button>
          </div>
          {scanMode && (
            <div>
              <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Scan QR code or type the code and press Enter</div>
              <input ref={scanRef} type="text" value={scanInput} onChange={e=>setScanInput(e.target.value)} onKeyDown={handleScan} placeholder="Scan QR..." style={{ ...S.input,fontSize:18,fontFamily:"monospace",textAlign:"center",letterSpacing:3 }} autoFocus/>
            </div>
          )}
        </div>
        {scanResult && (
          <div style={{ padding:"12px 18px",borderRadius:12,marginBottom:12,display:"flex",alignItems:"center",gap:10,background:scanResult.success?"rgba(0,210,120,0.15)":"rgba(255,80,80,0.15)",border:`1px solid ${scanResult.success?"rgba(0,210,120,0.3)":"rgba(255,80,80,0.3)"}`,color:scanResult.success?"#00d278":"#ff5050",fontWeight:600,fontSize:13 }}>
            {scanResult.success ? <><CheckIcon/> {scanResult.name} — checked in!</> : <>⚠️ Code "{scanResult.code}" not found</>}
          </div>
        )}
        <div style={{ display:"flex",gap:8,marginBottom:16 }}>
          <div style={S.stat}><div style={S.statNum}>{presentCount}</div><div style={S.statLabel}>Present</div></div>
          <div style={S.stat}><div style={{ ...S.statNum,background:"linear-gradient(135deg,#ff5050,#ff8888)",WebkitBackgroundClip:"text" }}>{eventApproved.length-presentCount}</div><div style={S.statLabel}>Absent</div></div>
          <div style={S.stat}><div style={S.statNum}>{eventApproved.length>0?Math.round(presentCount/eventApproved.length*100):0}%</div><div style={S.statLabel}>Rate</div></div>
        </div>
        <div style={{ maxHeight:"50vh",overflowY:"auto" }}>
          {eventApproved.map(p => {
            const att = eventAttendance.find(a => a.participant_id === p.id);
            return (
              <div key={p.id} style={{ ...S.card,padding:12,display:"flex",alignItems:"center",justifyContent:"space-between",borderColor:att?.checked_in?"rgba(0,210,120,0.25)":undefined,background:att?.checked_in?"rgba(0,210,120,0.04)":undefined }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:600 }}>{p.full_name} {p.is_leader && <Badge color="#f0a500">Leader</Badge>}</div>
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
    if (!selectedEvent) return <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}>Select an event first</div></div>;
    const rate = eventApproved.length > 0 ? Math.round(presentCount / eventApproved.length * 100) : 0;
    return (
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:8 }}>Event: <strong style={{ color:"#e0e0f0" }}>{currentEvent?.name}</strong></div>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Reports</h2>
          <button style={S.btn(true)} onClick={generateReport}><ReportIcon/> Generate</button>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:14,fontWeight:700,marginBottom:12 }}>Summary</div>
          <div style={{ display:"flex",gap:8,marginBottom:16 }}>
            <div style={S.stat}><div style={S.statNum}>{eventApproved.length}</div><div style={S.statLabel}>Total</div></div>
            <div style={S.stat}><div style={{ ...S.statNum,background:"linear-gradient(135deg,#00d278,#00b868)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>{presentCount}</div><div style={S.statLabel}>Present</div></div>
            <div style={S.stat}><div style={{ ...S.statNum,background:"linear-gradient(135deg,#ff5050,#ff8888)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>{eventApproved.length-presentCount}</div><div style={S.statLabel}>Absent</div></div>
            <div style={S.stat}><div style={S.statNum}>{rate}%</div><div style={S.statLabel}>Rate</div></div>
          </div>
          <div style={{ background:"rgba(255,80,80,0.2)",borderRadius:8,height:10,overflow:"hidden" }}>
            <div style={{ width:`${rate}%`,height:"100%",background:"linear-gradient(90deg,#00d278,#00b868)" }}/>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestions = () => {
    if (!isAdmin) return <div style={{ padding:16 }}><div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}><div style={{ fontSize:36,marginBottom:12 }}>🔒</div><div>Only admins can manage questions</div></div></div>;
    return (
      <div style={{ padding:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h2 style={{ margin:0,fontSize:18,fontWeight:700 }}>Registration Questions</h2>
          <button style={S.btn(true)} onClick={openAddQuestion}><PlusIcon/> Add</button>
        </div>
        <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:12,background:"rgba(108,99,255,0.06)",padding:"10px 14px",borderRadius:10 }}>
          💡 These questions appear on every event's registration form, after the default fields. Changes apply to all future registrations.
        </div>
        {formQuestions.length === 0 ? (
          <div style={{ ...S.card,textAlign:"center",padding:40,color:"#7a7a9e" }}>
            <div style={{ fontSize:36,marginBottom:12 }}>❓</div><div>No custom questions yet.</div>
          </div>
        ) : formQuestions.map(q => (
          <div key={q.id} style={S.card}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:600,marginBottom:6,direction:"rtl",textAlign:"right",fontFamily:"'Tajawal',sans-serif" }}>{q.label_ar}</div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  <Badge color={q.field_type==='yes_no'?"#00d2ff":q.field_type==='multiple_choice'?"#a855f7":"#f0a500"}>
                    {q.field_type === 'yes_no' ? 'نعم / لا' : q.field_type === 'multiple_choice' ? 'Multiple choice' : 'Text input'}
                  </Badge>
                  <Badge color={q.is_required?"#ff5050":"#7a7a9e"}>{q.is_required ? 'Required' : 'Optional'}</Badge>
                </div>
                {q.field_type === 'multiple_choice' && Array.isArray(q.options) && q.options.length > 0 && (
                  <div style={{ marginTop:8,fontSize:12,color:"#a0a0c0",direction:"rtl",textAlign:"right",fontFamily:"'Tajawal',sans-serif" }}>
                    {q.options.map((o,i) => <div key={i}>• {o}</div>)}
                  </div>
                )}
              </div>
              <div style={{ display:"flex",gap:4 }}>
                <button style={{ ...S.btn(false),padding:"6px 10px",fontSize:11 }} onClick={()=>openEditQuestion(q)}>Edit</button>
                <button style={{ ...S.btn(false),padding:"6px 10px",color:"#ff5050" }} onClick={()=>deleteQuestion(q.id)}><TrashIcon/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderModal = () => {
    if (eventQrModal) {
      const checkinUrl = `${window.location.origin}/checkin/${eventQrModal.barcode_id}`;
      return (
        <div style={S.modal} onClick={()=>setEventQrModal(null)}>
          <div style={{ ...S.modalContent,maxWidth:380,textAlign:"center" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:"0 0 4px",fontSize:18 }}>{eventQrModal.name}</h3>
            <div style={{ fontSize:12,color:"#7a7a9e",marginBottom:16 }}>Event Check-in QR</div>
            <div style={{ background:"#fff",padding:20,borderRadius:12,display:"inline-block" }}>
              <QRCodeSVG value={checkinUrl} size={220}/>
            </div>
            <div style={{ fontSize:11,color:"#7a7a9e",marginTop:12,wordBreak:"break-all",fontFamily:"monospace" }}>{checkinUrl}</div>
            <div style={{ fontSize:12,color:"#c0c0e0",marginTop:12,lineHeight:1.5 }}>
              Display this QR at the venue. Participants scan it, enter their name or ID, and are marked present automatically.
            </div>
            <div style={{ display:"flex",gap:8,marginTop:20 }}>
              <button style={{ ...S.btn(false),flex:1,justifyContent:"center" }} onClick={()=>copyCheckinLink(eventQrModal)}>Copy Link</button>
              <button style={{ ...S.btn(true),flex:1,justifyContent:"center" }} onClick={()=>{
                const w = window.open('', '_blank');
                w.document.write(`<html><head><title>${eventQrModal.name} - Check-in QR</title><script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script></head><body style="font-family:sans-serif;text-align:center;padding:40px"><h1>${eventQrModal.name}</h1><h2 style="color:#666;font-weight:400">امسح الرمز لتسجيل حضورك</h2><div id="qr" style="display:inline-block;padding:20px;background:#fff;border:2px solid #6c63ff;border-radius:16px"></div><p style="font-family:monospace;color:#999;margin-top:20px">${checkinUrl}</p><script>QRCode.toCanvas(document.getElementById('qr').appendChild(document.createElement('canvas')),'${checkinUrl}',{width:400});</script></body></html>`);
                w.document.close();
                setTimeout(()=>w.print(),500);
              }}>Print</button>
            </div>
            <button style={{ ...S.btn(false),marginTop:8,width:"100%",justifyContent:"center" }} onClick={()=>setEventQrModal(null)}>Close</button>
          </div>
        </div>
      );
    }
    if (qrModal) return (
      <div style={S.modal} onClick={()=>setQrModal(null)}>
        <div style={{ ...S.modalContent,maxWidth:340,textAlign:"center" }} onClick={e=>e.stopPropagation()}>
          <h3 style={{ margin:"0 0 4px",fontSize:18 }}>{qrModal.full_name}</h3>
          <div style={{ fontSize:11,color:"#7a7a9e",fontFamily:"monospace",marginBottom:20 }}>{qrModal.barcode_id}</div>
          <div style={{ background:"#fff",padding:20,borderRadius:12,display:"inline-block" }}>
            <QRCodeSVG value={qrModal.barcode_id} size={200}/>
          </div>
          <button style={{ ...S.btn(false),marginTop:20,width:"100%",justifyContent:"center" }} onClick={()=>setQrModal(null)}>Close</button>
        </div>
      </div>
    );
    if (!modal) return null;
    return (
      <div style={S.modal} onClick={()=>setModal(null)}>
        <div style={S.modalContent} onClick={e=>e.stopPropagation()}>
          {modal === "event" && (<>
            <h3 style={{ margin:"0 0 18px",fontSize:18,fontWeight:700 }}>Create Event</h3>
            <div style={{ marginBottom:14 }}><label style={S.label}>Event Name *</label><input id="ev-name" style={S.input}/></div>
            <div style={{ display:"flex",gap:10,marginBottom:14 }}>
              <div style={{ flex:1 }}><label style={S.label}>Start Date</label><input id="ev-start" type="date" style={S.input}/></div>
              <div style={{ flex:1 }}><label style={S.label}>End Date</label><input id="ev-end" type="date" style={S.input}/></div>
            </div>
            <div style={{ display:"flex",gap:10,marginBottom:14 }}>
              <div style={{ flex:1 }}><label style={S.label}>Start Time</label><input id="ev-stime" type="time" style={S.input}/></div>
              <div style={{ flex:1 }}><label style={S.label}>End Time</label><input id="ev-etime" type="time" style={S.input}/></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={S.label}>Location</label><input id="ev-loc" style={S.input}/></div>
            <div style={{ marginBottom:18 }}><label style={S.label}>Description</label><textarea id="ev-desc" style={{ ...S.input,minHeight:70,resize:"vertical" }}/></div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btn(false)} onClick={()=>setModal(null)}>Cancel</button>
              <button style={S.btn(true)} onClick={createEvent}>Create</button>
            </div>
          </>)}
          {modal === "group" && (<>
            <h3 style={{ margin:"0 0 18px",fontSize:18,fontWeight:700 }}>Create Group</h3>
            <div style={{ marginBottom:14 }}><label style={S.label}>Group Name *</label><input id="g-name" style={S.input}/></div>
            <div style={{ marginBottom:18 }}>
              <label style={S.label}>Leader</label>
              <select id="g-leader" style={S.input}>
                <option value="">No leader</option>
                {eventApproved.filter(p=>p.is_leader).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btn(false)} onClick={()=>setModal(null)}>Cancel</button>
              <button style={S.btn(true)} onClick={createGroup}>Create</button>
            </div>
          </>)}
          {modal === "question" && questionDraft && (<>
            <h3 style={{ margin:"0 0 18px",fontSize:18,fontWeight:700 }}>{questionDraft.id ? 'Edit Question' : 'Add Question'}</h3>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>Question Text (Arabic) *</label>
              <input style={{ ...S.input,direction:"rtl",textAlign:"right",fontFamily:"'Tajawal',sans-serif" }} placeholder="اكتب السؤال هنا"
                value={questionDraft.label_ar}
                onChange={e=>setQuestionDraft(d=>({...d,label_ar:e.target.value}))}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={S.label}>Answer Type</label>
              <select style={S.input} value={questionDraft.field_type}
                onChange={e=>setQuestionDraft(d=>({...d,field_type:e.target.value}))}>
                <option value="yes_no">Yes / No (نعم / لا)</option>
                <option value="text">Text input</option>
                <option value="multiple_choice">Multiple choice</option>
              </select>
            </div>
            {questionDraft.field_type === 'multiple_choice' && (
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>Options (Arabic)</label>
                {questionDraft.options.map((opt,i) => (
                  <div key={i} style={{ display:"flex",gap:6,marginBottom:6 }}>
                    <input style={{ ...S.input,direction:"rtl",textAlign:"right",fontFamily:"'Tajawal',sans-serif" }}
                      placeholder={`الخيار ${i+1}`}
                      value={opt}
                      onChange={e=>setQuestionDraft(d=>{ const o=[...d.options]; o[i]=e.target.value; return {...d,options:o}; })}/>
                    <button style={{ ...S.btn(false),padding:"6px 10px",color:"#ff5050" }}
                      onClick={()=>setQuestionDraft(d=>({...d,options:d.options.filter((_,j)=>j!==i)}))}><TrashIcon/></button>
                  </div>
                ))}
                <button style={{ ...S.btn(false),padding:"6px 12px",fontSize:12 }}
                  onClick={()=>setQuestionDraft(d=>({...d,options:[...d.options,""]}))}>+ Add option</button>
              </div>
            )}
            <div style={{ marginBottom:18 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer" }}
                onClick={()=>setQuestionDraft(d=>({...d,is_required:!d.is_required}))}>
                <div style={{ width:22,height:22,borderRadius:6,border:`2px solid ${questionDraft.is_required?"#00d278":"#6c63ff"}`,display:"flex",alignItems:"center",justifyContent:"center",background:questionDraft.is_required?"#00d278":"transparent",flexShrink:0 }}>
                  {questionDraft.is_required && <CheckIcon/>}
                </div>
                <span style={{ fontSize:13 }}>Required (mandatory to answer)</span>
              </div>
            </div>
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <button style={S.btn(false)} onClick={()=>{setModal(null);setQuestionDraft(null);}}>Cancel</button>
              <button style={S.btn(true)} onClick={saveQuestion}>{questionDraft.id ? 'Save' : 'Add Question'}</button>
            </div>
          </>)}
        </div>
      </div>
    );
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(108,99,255,0.3);border-radius:4px}input:focus,textarea:focus,select:focus{border-color:rgba(108,99,255,0.5)!important;box-shadow:0 0 0 3px rgba(108,99,255,0.1)}`}</style>
      <div style={S.header}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
          <div>
            <h1 style={S.title}>Event Manager</h1>
            <div style={S.subtitle}>
              Signed in as <strong style={{ color:"#e0e0f0" }}>{profile?.full_name}</strong> <Badge color={isAdmin?"#6c63ff":"#f0a500"}>{profile?.role}</Badge>
            </div>
          </div>
          <button style={{ ...S.btn(false),padding:"8px 12px" }} onClick={handleLogout}><LogoutIcon/></button>
        </div>
      </div>
      <div style={S.tabs}>
        {TABS.map((t,i) => {
          if (t === "Questions" && !isAdmin) return null;
          return (
            <button key={t} style={S.tab(tab===i)} onClick={()=>setTab(i)}>
              {t}
              {i === 1 && totalPending > 0 && <span style={{ marginLeft:6,background:"#f0a500",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700 }}>{totalPending}</span>}
            </button>
          );
        })}
      </div>
      {tab===0 && renderEvents()}
      {tab===1 && renderPending()}
      {tab===2 && renderParticipants()}
      {tab===3 && renderGroups()}
      {tab===4 && renderAttendance()}
      {tab===5 && renderReports()}
      {tab===6 && renderQuestions()}
      {renderModal()}
    </div>
  );
}
