import { useEffect, useMemo, useState } from "react";
import { createEnvironment, deleteEnvironment, getEnvironments, getFlags, updateEnvironment } from "../services/api";
import DeleteEnvironmentDialog from "../components/environments/DeleteEnvironmentDialog";
import EnvironmentForm from "../components/environments/EnvironmentForm";
import EnvironmentTable from "../components/environments/EnvironmentTable";
import Pagination from "../components/CompactPagination";

const PAGE_SIZE = 10;

function EnvironmentsPage() {
  const [environments, setEnvironments] = useState([]);
  const [flags, setFlags] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [formEnvironment, setFormEnvironment] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [success, setSuccess] = useState("");

  const loadEnvironments = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [environmentResult, flagResult] = await Promise.all([getEnvironments(), getFlags()]);
      setEnvironments(Array.isArray(environmentResult) ? environmentResult : []);
      setFlags(Array.isArray(flagResult) ? flagResult : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load environments or feature flag counts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => { await loadEnvironments(); };
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return environments.filter((environment) => !query || `${environment.name} ${environment.description || ""}`.toLowerCase().includes(query));
  }, [environments, search]);
  const flagCountsByEnvironment = useMemo(() => flags.reduce((counts, flag) => {
    if (flag.environment_id !== undefined && flag.environment_id !== null) {
      counts.set(flag.environment_id, (counts.get(flag.environment_id) || 0) + 1);
    }
    return counts;
  }, new Map()), [flags]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visiblePage = totalPages ? Math.min(page, totalPages) : 1;
  const paginated = useMemo(() => filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE), [filtered, visiblePage]);
  const resultStart = filtered.length ? (visiblePage - 1) * PAGE_SIZE + 1 : 0;
  const resultEnd = Math.min(visiblePage * PAGE_SIZE, filtered.length);

  const save = async (payload) => {
    setIsSaving(true);
    setFormError("");
    try {
      if (formEnvironment) await updateEnvironment(formEnvironment.id, payload);
      else await createEnvironment(payload);
      await loadEnvironments();
      setIsFormOpen(false);
      setSuccess(`Environment ${formEnvironment ? "updated" : "created"}.`);
    } catch (requestError) {
      setFormError(requestError.message || "The environment could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteEnvironment(deleteTarget.id);
      await loadEnvironments();
      setDeleteTarget(null);
      setSuccess("Environment deleted.");
    } catch (requestError) {
      setDeleteError(requestError.message || "The environment could not be deleted.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="environment-page">
      <div className="feature-page-header"><div><p className="dashboard-eyebrow">Workspace configuration</p><h2>Environments</h2><p>Organize feature releases into clear, independently managed contexts.</p></div><button className="btn primary" onClick={() => { setFormEnvironment(null); setFormError(""); setIsFormOpen(true); }} type="button">+ New Environment</button></div>
      {success && <div className="feature-success-message" role="status">{success}<button className="notification-close" aria-label="Dismiss notification" title="Dismiss" onClick={() => setSuccess("")} type="button">×</button></div>}
      <div className="environment-toolbar"><label htmlFor="environment-search">Search environments</label><input id="environment-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name or description" /></div>
      {isLoading ? <div className="feature-page-state" role="status"><div className="dashboard-state-mark" aria-hidden="true">◌</div><h2>Loading environments</h2><p>Fetching configured release contexts.</p></div> : error ? <div className="feature-page-state feature-page-error" role="alert"><div className="dashboard-state-mark" aria-hidden="true">!</div><h2>Environments could not be loaded</h2><p>{error}</p><button className="btn secondary" onClick={loadEnvironments} type="button">Retry</button></div> : environments.length === 0 ? <div className="feature-empty-state"><h3>No environments yet</h3><p>Create your first environment to organize feature releases.</p><button className="btn primary" onClick={() => { setFormEnvironment(null); setIsFormOpen(true); }} type="button">Create Environment</button></div> : filtered.length === 0 ? <div className="feature-empty-state"><h3>No matching environments</h3><p>Try a different name or description.</p></div> : <><EnvironmentTable environments={paginated} flagCountsByEnvironment={flagCountsByEnvironment} onEdit={(environment) => { setFormEnvironment(environment); setFormError(""); setIsFormOpen(true); }} onDelete={(environment) => { setDeleteTarget(environment); setDeleteError(""); }} /><Pagination ariaLabel="Environment pagination" currentPage={visiblePage} onPageChange={setPage} resultText={`Showing ${resultStart}–${resultEnd} of ${filtered.length}`} totalPages={totalPages} /></>}
      {isFormOpen && <EnvironmentForm environment={formEnvironment} isSubmitting={isSaving} submitError={formError} onClose={() => !isSaving && setIsFormOpen(false)} onSubmit={save} />}
      {deleteTarget && <DeleteEnvironmentDialog environment={deleteTarget} isDeleting={isDeleting} error={deleteError} onClose={() => !isDeleting && setDeleteTarget(null)} onConfirm={confirmDelete} />}
    </section>
  );
}

export default EnvironmentsPage;
