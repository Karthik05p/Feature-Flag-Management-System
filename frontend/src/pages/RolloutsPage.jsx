import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { createTargetingRule, deleteTargetingRule, getEnvironments, getFlags, getTargetingRules, updateTargetingRule } from "../services/api";
import Modal from "../components/Modal";
import StatCard from "../components/dashboard/StatCard";
import TargetingRuleForm from "../components/features/TargetingRuleForm";
import Pagination from "../components/CompactPagination";

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : parsed.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatRuleType(value) {
  if (value === "user") return "User";
  if (value === "group") return "Group";
  if (value === "percentage") return "Percentage";
  return value ? String(value) : "Unknown";
}

function formatCondition(rule) {
  const value = rule.value == null || rule.value === "" ? "Not specified" : String(rule.value);
  if (rule.rule_type === "percentage") {
    const percentage = Math.max(0, Math.min(100, Number(rule.percentage) || 0));
    return `${percentage}% of users`;
  }
  if (rule.rule_type === "user") return `User ID ${rule.operator || "equals"} ${value}`;
  if (rule.rule_type === "group") return `Group ${rule.operator || "equals"} ${value}`;
  return value;
}

function RolloutsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rules, setRules] = useState([]);
  const [flags, setFlags] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [environment, setEnvironment] = useState("");
  const [selectedFlagId, setSelectedFlagId] = useState(() => searchParams.get("flagId") || "");
  const [ruleType, setRuleType] = useState("");
  const [status, setStatus] = useState("");
  const [treatment, setTreatment] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [createRuleError, setCreateRuleError] = useState("");
  const [editingRule, setEditingRule] = useState(null);
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [editRuleError, setEditRuleError] = useState("");
  const [deletingRule, setDeletingRule] = useState(null);
  const [isDeletingRule, setIsDeletingRule] = useState(false);
  const [deleteRuleError, setDeleteRuleError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(() => Number(location.state?.page) > 0 ? Number(location.state.page) : 1);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ruleResult, flagResult, environmentResult] = await Promise.all([getTargetingRules(), getFlags(), getEnvironments()]);
      setRules(Array.isArray(ruleResult) ? ruleResult : []);
      setFlags(Array.isArray(flagResult) ? flagResult : []);
      setEnvironments(Array.isArray(environmentResult) ? environmentResult : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load targeting rule data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = async () => { await load(); };
    initialLoad();
  }, []);

  const ruleRows = useMemo(() => rules.map((rule) => {
    const flag = flags.find((item) => item.id === rule.flag_id);
    const env = environments.find((item) => item.id === flag?.environment_id);
    return { ...rule, flag, environment: env };
  }).sort((a, b) => (a.environment?.name || `Environment #${a.flag?.environment_id || 0}`).localeCompare(b.environment?.name || `Environment #${b.flag?.environment_id || 0}`) || (a.flag?.name || a.flag?.key || "").localeCompare(b.flag?.name || b.flag?.key || "") || a.priority - b.priority || a.id - b.id), [rules, flags, environments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ruleRows.filter((rule) => {
      const flagText = `${rule.flag?.name || ""} ${rule.flag?.key || ""}`.toLowerCase();
      return (!query || flagText.includes(query))
        && (!environment || String(rule.environment?.id || rule.flag?.environment_id) === environment)
        && (!selectedFlagId || String(rule.flag_id) === selectedFlagId)
        && (!ruleType || rule.rule_type === ruleType)
        && (!status || (status === "active" ? rule.is_active : !rule.is_active))
        && (!treatment || (treatment === "enabled" ? rule.enabled : !rule.enabled));
    });
  }, [ruleRows, search, environment, selectedFlagId, ruleType, status, treatment]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visiblePage = totalPages ? Math.min(page, totalPages) : 1;
  const paginated = useMemo(() => filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE), [filtered, visiblePage]);
  const resultStart = filtered.length ? (visiblePage - 1) * PAGE_SIZE + 1 : 0;
  const resultEnd = Math.min(visiblePage * PAGE_SIZE, filtered.length);
  const clearFilters = () => { setSearch(""); setEnvironment(""); setSelectedFlagId(""); setRuleType(""); setStatus(""); setTreatment(""); setPage(1); };
  const closeCreateFlow = () => {
    if (isCreatingRule) return;
    setIsCreateOpen(false);
    setSelectedFlag(null);
    setCreateRuleError("");
  };
  const handleCreateRule = async (payload) => {
    if (isCreatingRule) return;
    setIsCreatingRule(true);
    setCreateRuleError("");
    try {
      await createTargetingRule(payload);
      await load();
      setIsCreateOpen(false);
      setSelectedFlag(null);
      setCreateRuleError("");
      setSuccessMessage("Targeting rule created successfully.");
    } catch (requestError) {
      setCreateRuleError(requestError.message || "The targeting rule could not be created.");
    } finally {
      setIsCreatingRule(false);
    }
  };
  const closeEditFlow = () => {
    if (isEditingRule) return;
    setEditingRule(null);
    setEditRuleError("");
  };
  const handleUpdateRule = async (payload) => {
    if (!editingRule || isEditingRule) return;
    setIsEditingRule(true);
    setEditRuleError("");
    try {
      await updateTargetingRule(editingRule.id, payload);
      await load();
      setEditingRule(null);
      setEditRuleError("");
      setSuccessMessage("Targeting rule updated successfully.");
    } catch (requestError) {
      setEditRuleError(requestError.message || "The targeting rule could not be updated.");
    } finally {
      setIsEditingRule(false);
    }
  };
  const openEditFlow = (rule) => {
    setEditRuleError("");
    setEditingRule(rule);
  };
  const openDeleteConfirmation = () => {
    if (!editingRule || isEditingRule || isDeletingRule) return;
    setDeleteRuleError("");
    setDeletingRule(editingRule);
  };
  const closeDeleteConfirmation = () => {
    if (!isDeletingRule) {
      setDeletingRule(null);
      setDeleteRuleError("");
    }
  };
  const handleDeleteRule = async () => {
    if (!deletingRule || isDeletingRule) return;
    setIsDeletingRule(true);
    setDeleteRuleError("");
    try {
      await deleteTargetingRule(deletingRule.id);
      await load();
      setDeletingRule(null);
      setEditingRule(null);
      setDeleteRuleError("");
      setSuccessMessage("Targeting rule deleted successfully.");
    } catch (requestError) {
      setDeleteRuleError(requestError.message || "The targeting rule could not be deleted.");
    } finally {
      setIsDeletingRule(false);
    }
  };

  return <section className="rollouts-page">
    {successMessage && <div className="feature-success-message" role="status">{successMessage}<button aria-label="Dismiss success message" onClick={() => setSuccessMessage("")} type="button">×</button></div>}
    <div className="feature-page-header"><div><p className="dashboard-eyebrow">Workspace / Targeting Rules</p><h2>Targeting Rules</h2><p>Manage how feature flags are targeted across users, groups, and percentage rollouts.</p></div><button className="btn primary" onClick={() => { setCreateRuleError(""); setSelectedFlag(null); setIsCreateOpen(true); }} type="button">+ Add Targeting Rule</button></div>
    {!loading && !error && <div className="dashboard-stats-grid rollout-summary"><StatCard label="Total Rules" value={rules.length} detail="Configured across your workspace" tone="blue" /><StatCard label="Active Rules" value={rules.filter((rule) => rule.is_active).length} detail="Participating in evaluation" tone="green" /><StatCard label="User Rules" value={rules.filter((rule) => rule.rule_type === "user").length} detail="User ID targeting" tone="purple" /><StatCard label="Group Rules" value={rules.filter((rule) => rule.rule_type === "group").length} detail="Group targeting" tone="muted" /><StatCard label="Percentage Rules" value={rules.filter((rule) => rule.rule_type === "percentage").length} detail="Percentage rollout rules" tone="blue" /></div>}
    <div className="rollout-filters"><div><label htmlFor="rollout-search">Search flags</label><input id="rollout-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by flag name or key" /></div><div><label htmlFor="rollout-environment">Environment</label><select id="rollout-environment" value={environment} onChange={(event) => { setEnvironment(event.target.value); setPage(1); }}><option value="">All environments</option>{environments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div><label htmlFor="rollout-flag">Feature flag</label><select id="rollout-flag" value={selectedFlagId} onChange={(event) => { setSelectedFlagId(event.target.value); setPage(1); }}><option value="">All feature flags</option>{flags.map((flag) => { const flagEnvironment = environments.find((item) => item.id === flag.environment_id); return <option key={flag.id} value={flag.id}>{flag.name || flag.key} — {flagEnvironment?.name || `Environment #${flag.environment_id}`}</option>; })}</select></div><div><label htmlFor="rollout-rule-type">Rule type</label><select id="rollout-rule-type" value={ruleType} onChange={(event) => { setRuleType(event.target.value); setPage(1); }}><option value="">All rule types</option><option value="user">User</option><option value="group">Group</option><option value="percentage">Percentage</option></select></div><div><label htmlFor="rollout-status">Status</label><select id="rollout-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div><label htmlFor="rollout-treatment">Treatment</label><select id="rollout-treatment" value={treatment} onChange={(event) => { setTreatment(event.target.value); setPage(1); }}><option value="">All treatments</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></div></div>
    {!loading && !error && <p className="rollout-result-count">{filtered.length} rule{filtered.length === 1 ? "" : "s"}</p>}
    {loading ? <div className="feature-page-state" role="status"><h2>Loading targeting rules</h2><p>Fetching rules, flags, and environments.</p></div> : error ? <div className="feature-page-state feature-page-error" role="alert"><h2>Targeting rules could not be loaded</h2><p>{error}</p><button className="btn secondary" onClick={load} type="button">Retry</button></div> : !rules.length ? <div className="feature-empty-state"><h3>No targeting rules yet</h3><p>Targeting rules can be configured from a feature flag's details.</p><button className="btn primary" onClick={() => navigate("/features")} type="button">Go to Feature Flags</button></div> : !filtered.length ? <div className="feature-empty-state"><h3>No targeting rules match your filters</h3><p>Try adjusting your search or filters.</p><button className="btn secondary" onClick={clearFilters} type="button">Clear filters</button></div> : <><div className="rollout-table-wrap"><table className="rollout-table"><caption className="visually-hidden">Targeting rules</caption><thead><tr><th>Flag</th><th>Environment</th><th>Rule Type</th><th>Condition</th><th>Status</th><th>Treatment</th><th>Priority</th><th>Created</th><th>Action</th></tr></thead><tbody>{paginated.map((rule) => <tr key={rule.id}><td data-label="Flag"><strong>{rule.flag?.name || `Flag #${rule.flag_id}`}</strong><small>{rule.flag?.key || `Flag #${rule.flag_id}`}</small></td><td data-label="Environment">{rule.environment?.name || `Environment #${rule.flag?.environment_id || "?"}`}</td><td data-label="Rule Type"><span className="environment-status is-active">{formatRuleType(rule.rule_type)}</span></td><td data-label="Condition" title={formatCondition(rule)}>{formatCondition(rule)}</td><td data-label="Status"><span className={`environment-status ${rule.is_active ? "is-active" : "is-inactive"}`}>{rule.is_active ? "Active" : "Inactive"}</span></td><td data-label="Treatment"><span className={`rollout-treatment ${rule.enabled ? "is-enabled" : "is-disabled"}`}>{rule.enabled ? "Enabled" : "Disabled"}</span></td><td data-label="Priority">{rule.priority}</td><td data-label="Created">{formatDate(rule.created_at)}</td><td data-label="Action"><button className="text-action" onClick={() => openEditFlow(rule)} type="button">Manage</button></td></tr>)}</tbody></table></div><Pagination ariaLabel="Targeting rules pagination" currentPage={visiblePage} onPageChange={setPage} resultText={`Showing ${resultStart}-${resultEnd} of ${filtered.length}`} totalPages={totalPages} /></>}
    {isCreateOpen && !selectedFlag && <Modal className="targeting-form-modal-layer" onClose={closeCreateFlow}><section className="feature-modal targeting-form-modal" aria-labelledby="targeting-rule-select-title" aria-modal="true" role="dialog"><div className="feature-modal-header"><div><p className="dashboard-eyebrow">Release configuration</p><h2 id="targeting-rule-select-title">Add Targeting Rule</h2><p>Select the feature flag this rule should apply to.</p></div><button className="feature-modal-close" aria-label="Close targeting rule creation" onClick={closeCreateFlow} type="button">×</button></div><div className="feature-flag-form"><div className="form-field full-width"><label htmlFor="targeting-rule-flag">Feature Flag</label><select id="targeting-rule-flag" value="" onChange={(event) => setSelectedFlag(flags.find((flag) => String(flag.id) === event.target.value) || null)}><option value="">Select a feature flag</option>{flags.map((flag) => { const flagEnvironment = environments.find((item) => item.id === flag.environment_id); return <option key={flag.id} value={flag.id}>{flag.name || flag.key} — {flagEnvironment?.name || `Environment #${flag.environment_id}`}</option>; })}</select><span className="form-field-hint">Choose an existing flag before configuring its targeting rule.</span></div></div></section></Modal>}
    {isCreateOpen && selectedFlag && <TargetingRuleForm flag={selectedFlag} isSubmitting={isCreatingRule} submitError={createRuleError} onClose={closeCreateFlow} onSubmit={handleCreateRule} />}
    {editingRule && <TargetingRuleForm flag={editingRule.flag} rule={editingRule} isSubmitting={isEditingRule || isDeletingRule} submitError={editRuleError} onClose={closeEditFlow} onDelete={openDeleteConfirmation} onSubmit={handleUpdateRule} />}
    {deletingRule && <Modal className="delete-targeting-rule-modal-layer" onClose={closeDeleteConfirmation}><section className="feature-modal delete-targeting-rule-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-targeting-rule-title"><div className="feature-modal-header"><div><p className="dashboard-eyebrow">Destructive action</p><h2 id="delete-targeting-rule-title">Delete Targeting Rule?</h2><p>Are you sure you want to delete the targeting rule for <strong>{deletingRule.flag?.name || deletingRule.flag?.key || `Flag #${deletingRule.flag_id}`}</strong>?</p><p>This action cannot be undone.</p></div><button className="feature-modal-close" aria-label="Close delete targeting rule confirmation" disabled={isDeletingRule} onClick={closeDeleteConfirmation} type="button">×</button></div>{deleteRuleError && <div className="form-submit-error" role="alert">{deleteRuleError}</div>}<div className="feature-form-actions"><button className="btn secondary" disabled={isDeletingRule} onClick={closeDeleteConfirmation} type="button">Cancel</button><button className="btn danger" disabled={isDeletingRule} onClick={handleDeleteRule} type="button">{isDeletingRule ? "Deleting…" : "Delete Rule"}</button></div></section></Modal>}
  </section>;
}

export default RolloutsPage;
