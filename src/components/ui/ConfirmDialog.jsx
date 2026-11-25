/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { MdHelpOutline, MdWarningAmber } from "react-icons/md";
import Button from "./Button";
import Modal from "./Modal";

const ConfirmContext = createContext(null);

export function ConfirmDialog({
  open,
  title = "Confirmar ação",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = tone === "danger";
  const Icon = isDanger ? MdWarningAmber : MdHelpOutline;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={title}
      icon={Icon}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {message}
      </p>
    </Modal>
  );
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    const normalized =
      typeof options === "string" ? { message: options } : options || {};
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        title: normalized.title || "Confirmar ação",
        message: normalized.message || "Tem certeza que deseja continuar?",
        confirmText: normalized.confirmText || "Confirmar",
        cancelText: normalized.cancelText || "Cancelar",
        tone: normalized.tone || "danger",
      });
    });
  }, []);

  const handleClose = useCallback((result) => {
    setDialog(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title}
        message={dialog?.message}
        confirmText={dialog?.confirmText}
        cancelText={dialog?.cancelText}
        tone={dialog?.tone}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async (opts) =>
      window.confirm(typeof opts === "string" ? opts : opts?.message || "Confirmar?");
  }
  return ctx;
}

export default ConfirmDialog;
