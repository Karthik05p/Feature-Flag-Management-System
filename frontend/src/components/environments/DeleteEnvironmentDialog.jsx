import { useEffect } from "react";
import Modal from "../Modal";

function DeleteEnvironmentDialog({ environment, isDeleting, error, onClose, onConfirm }) {
  useEffect(() => { const onKey = (event) => event.key === "Escape" && !isDeleting && onClose(); document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [isDeleting, onClose]);
  return <Modal className="delete-confirmation-modal-layer" onClose={() => !isDeleting && onClose()}><section className="feature-modal delete-environment-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-environment-title"><div className="feature-modal-header"><div><p className="dashboard-eyebrow">Destructive action</p><h2 id="delete-environment-title">Delete environment?</h2><p>This permanently removes <strong>{environment.name}</strong>. Only empty environments can be permanently deleted. Environments with flags or audit history cannot be deleted.</p></div><button className="feature-modal-close" aria-label="Close delete confirmation" disabled={isDeleting} onClick={onClose} type="button">×</button></div>{error && <div className="form-submit-error" role="alert">{error}</div>}<div className="feature-form-actions"><button className="btn secondary" disabled={isDeleting} onClick={onClose} type="button">Cancel</button><button className="btn danger" disabled={isDeleting} onClick={onConfirm} type="button">{isDeleting ? "Deleting…" : "Delete Environment"}</button></div></section></Modal>;
}

export default DeleteEnvironmentDialog;
