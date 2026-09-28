export function NotesTab({ assessments }: { assessments: Array<Record<string, unknown>> }) {
  const notes = assessments.filter((a) => a.trainer_notes);

  return (
    <div className="card">
      <h3>Trainer notes</h3>
      {notes.length === 0 ? (
        <p className="muted small">No notes recorded yet — add one from the Fitness Data tab.</p>
      ) : (
        notes.map((a) => (
          <div className="alert-item" key={a.id as string}>
            <span className="alert-dot" />
            <div>
              <b>{a.trainer_notes as string}</b>
              <div className="muted small">{new Date(a.created_at as string).toLocaleString()}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
