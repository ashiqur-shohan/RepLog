import { useState, useEffect, useCallback } from "react";
import { Plus, Search, X, ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { mockExercises } from "../data/mockData";
import { generateId, getSplitColor } from "../lib/utils";

const getExercises = () => Promise.resolve(mockExercises);
const addExercise = (data) => Promise.resolve({ ...data, id: "EX" + generateId() });
const updateExercise = (id, data) => Promise.resolve({ id, ...data });
const deleteExercise = (id) => Promise.resolve({ success: true });

const CATEGORIES = ["All","Push","Pull","Legs","Core","Cardio"];
const EQUIPMENTS = ["All","Bodyweight","Dumbbell","Pull-up Bar","Resistance Band"];
const DIFFICULTIES = ["All","Beginner","Intermediate","Advanced"];

const diffColor = { Beginner: "#22C55E", Intermediate: "#F59E0B", Advanced: "#EF4444" };

const EMPTY_FORM = { name: "", category: "Push", muscle_primary: "", muscle_secondary: "", equipment: "Bodyweight", difficulty: "Beginner" };

export default function LibraryPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [eqFilter, setEqFilter] = useState("All");
  const [diffFilter, setDiffFilter] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [editingEx, setEditingEx] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { getExercises().then(data => { setExercises(data); setLoading(false); }); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = exercises.filter(ex => {
    const q = debouncedQuery.toLowerCase();
    const matchQ = !q || ex.name.toLowerCase().includes(q) || ex.muscle_primary.toLowerCase().includes(q) ||
      (ex.muscle_secondary || "").toLowerCase().includes(q) || ex.equipment.toLowerCase().includes(q);
    const matchCat = catFilter === "All" || ex.category === catFilter;
    const matchEq = eqFilter === "All" || ex.equipment === eqFilter;
    const matchDiff = diffFilter === "All" || ex.difficulty === diffFilter;
    return matchQ && matchCat && matchEq && matchDiff;
  });

  const grouped = filtered.reduce((acc, ex) => {
    const key = ex.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ex);
    return acc;
  }, {});

  const openAdd = () => { setEditingEx(null); setForm(EMPTY_FORM); setFormError(""); setShowSheet(true); };
  const openEdit = (ex) => { setEditingEx(ex); setForm({ name: ex.name, category: ex.category, muscle_primary: ex.muscle_primary, muscle_secondary: ex.muscle_secondary, equipment: ex.equipment, difficulty: ex.difficulty }); setFormError(""); setShowSheet(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Exercise name is required"); return; }
    if (editingEx) {
      const updated = await updateExercise(editingEx.id, form);
      setExercises(prev => prev.map(e => e.id === editingEx.id ? { ...e, ...updated } : e));
      toast.success("Exercise updated");
    } else {
      const newEx = await addExercise(form);
      setExercises(prev => [...prev, newEx]);
      toast.success("Exercise added");
    }
    setShowSheet(false);
  };

  const handleDelete = async () => {
    await deleteExercise(deleteTarget.id);
    setExercises(prev => prev.filter(e => e.id !== deleteTarget.id));
    toast.success("Exercise deleted");
    setDeleteTarget(null);
  };

  const chipStyle = (active) => ({
    flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
    border: active ? "2px solid var(--primary)" : "1px solid var(--border)",
    background: active ? "var(--primary)" : "var(--surface-raised)",
    color: active ? "#fff" : "var(--text-muted)",
    cursor: "pointer",
  });

  if (loading) return <div style={{ padding: 16 }}><div style={{ height: 300, background: "var(--surface)", borderRadius: 16 }} /></div>;

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Sticky search */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--background)", padding: "16px 16px 10px" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search exercises..."
            style={{
              width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid var(--border)",
              background: "var(--surface)", color: "var(--text-primary)", fontSize: 14,
              paddingLeft: 36, paddingRight: query ? 36 : 12, outline: "none",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={14} />
            </button>
          )}
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
          Showing {filtered.length} of {exercises.length} exercises
        </p>
      </div>

      {/* Filters */}
      <div style={{ padding: "0 16px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {CATEGORIES.map(c => <button key={c} onClick={() => setCatFilter(c)} style={chipStyle(catFilter === c)}>{c}</button>)}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {EQUIPMENTS.map(e => <button key={e} onClick={() => setEqFilter(e)} style={chipStyle(eqFilter === e)}>{e}</button>)}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {DIFFICULTIES.map(d => <button key={d} onClick={() => setDiffFilter(d)} style={chipStyle(diffFilter === d)}>{d}</button>)}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: "0 16px" }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: "0 auto 16px" }}>
              <circle cx="32" cy="32" r="30" stroke="var(--border)" strokeWidth="2" />
              <path d="M22 32h20M32 22v20" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>No exercises found</p>
            <button onClick={() => { setQuery(""); setCatFilter("All"); setEqFilter("All"); setDiffFilter("All"); }} style={{
              padding: "8px 16px", borderRadius: 8, border: "1px solid var(--primary)",
              background: "none", color: "var(--primary)", fontSize: 13, cursor: "pointer",
            }}>Clear filters</button>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, exs]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>{cat}</span>
                <span style={{ fontSize: 11, background: "var(--surface-raised)", borderRadius: 10, padding: "1px 7px", color: "var(--text-muted)" }}>{exs.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {exs.map(ex => (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex}
                    expanded={expanded === ex.id}
                    onToggle={() => setExpanded(expanded === ex.id ? null : ex.id)}
                    onEdit={() => openEdit(ex)}
                    onDelete={() => setDeleteTarget(ex)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={openAdd} style={{
        position: "fixed", bottom: 88, right: 20, width: 52, height: 52,
        borderRadius: "50%", border: "none", background: "var(--primary)",
        color: "#fff", fontSize: 24, cursor: "pointer",
        boxShadow: "0 0 24px var(--primary-glow), 0 4px 12px rgba(0,0,0,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40,
      }}>
        <Plus size={22} />
      </button>

      {/* Add/Edit Sheet */}
      {showSheet && (
        <ExerciseSheet
          form={form} setForm={setForm} formError={formError} editing={!!editingEx}
          onSave={handleSave} onClose={() => setShowSheet(false)}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setDeleteTarget(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 16, padding: 24, width: "100%" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Delete {deleteTarget.name}?</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, minHeight: 44, borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, minHeight: 44, borderRadius: 8, border: "none", background: "var(--danger)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ ex, expanded, onToggle, onEdit, onDelete }) {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: getSplitColor(ex.category), flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{ex.name}</span>
        <span style={{ fontSize: 11, background: "var(--surface-raised)", borderRadius: 6, padding: "2px 8px", color: "var(--text-muted)", marginRight: 4 }}>{ex.equipment}</span>
        <span style={{ fontSize: 11, color: diffColor[ex.difficulty] || "var(--text-muted)", fontWeight: 600 }}>{ex.difficulty.slice(0,3)}</span>
        {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </button>
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          <div style={{ paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Primary: <span style={{ color: "var(--text-primary)" }}>{ex.muscle_primary}</span></p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Secondary: <span style={{ color: "var(--text-primary)" }}>{ex.muscle_secondary}</span></p>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={onEdit} style={{ flex: 1, minHeight: 36, borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Edit2 size={12} /> Edit
            </button>
            <button onClick={onDelete} style={{ flex: 1, minHeight: 36, borderRadius: 8, border: "1px solid var(--danger)", background: "none", color: "var(--danger)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseSheet({ form, setForm, formError, editing, onSave, onClose }) {
  const field = (label, key, type = "text") => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{
          width: "100%", minHeight: 48, borderRadius: 12, border: "1px solid var(--border)",
          background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 14, padding: "0 12px", outline: "none",
        }}
      />
    </div>
  );

  const select = (label, key, options) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{label}</label>
      <select
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{
          width: "100%", minHeight: 48, borderRadius: 12, border: "1px solid var(--border)",
          background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 14, padding: "0 12px", outline: "none",
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "20px 20px 0 0", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editing ? "Edit Exercise" : "Add Exercise"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Exercise Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{
                width: "100%", minHeight: 48, borderRadius: 12,
                border: formError ? "1px solid var(--danger)" : "1px solid var(--border)",
                background: "var(--surface-raised)", color: "var(--text-primary)", fontSize: 14, padding: "0 12px", outline: "none",
                marginBottom: 4,
              }}
            />
            {formError && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 10 }}>{formError}</p>}
          </div>
          {select("Category", "category", ["Push","Pull","Legs","Core","Cardio"])}
          {field("Primary Muscle", "muscle_primary")}
          {field("Secondary Muscle", "muscle_secondary")}
          {select("Equipment", "equipment", ["Bodyweight","Dumbbell","Pull-up Bar","Resistance Band"])}
          {select("Difficulty", "difficulty", ["Beginner","Intermediate","Advanced"])}
        </div>
        <div style={{ padding: 16, display: "flex", gap: 10, borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} style={{ flex: 1, minHeight: 48, borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", cursor: "pointer" }}>Cancel</button>
          <button onClick={onSave} style={{ flex: 2, minHeight: 48, borderRadius: 8, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 600, cursor: "pointer", boxShadow: "0 0 20px var(--primary-glow)" }}>Save</button>
        </div>
      </div>
    </div>
  );
}
