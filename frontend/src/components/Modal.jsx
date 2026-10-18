import { createPortal } from "react-dom";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

function Modal({ children, className = "", onClose, open = true, closeOnBackdrop = false }) {
  useBodyScrollLock(open);

  if (!open) return null;

  const modalRoot = document.getElementById("modal-root") || document.body;
  const modalClassName = `app-modal${className ? ` ${className}` : ""}`;
  const layer = (
    <div className="app-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeOnBackdrop && onClose?.()}>
      <div className={modalClassName}>{children}</div>
    </div>
  );

  return createPortal(layer, modalRoot);
}

export default Modal;
