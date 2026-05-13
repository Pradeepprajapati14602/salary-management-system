import type { Employee } from '@salary-mgmt/shared';
import { IconAlert } from '../icons.js';

interface DeleteConfirmDialogProps {
    employee: Employee;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting?: boolean;
}

export function DeleteConfirmDialog({ employee, onConfirm, onCancel, isDeleting = false }: DeleteConfirmDialogProps) {
    return (
        <div className="modal-overlay" onClick={onCancel} role="alertdialog" aria-modal="true" aria-label="delete confirmation">
            <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-dialog-icon" aria-hidden>
                    <IconAlert size={36} />
                </div>
                <h3>Delete Employee?</h3>
                <p>
                    You are about to deactivate <strong>{employee.fullName}</strong>.<br />
                    This will mark them as inactive but they won't be permanently removed.
                </p>
                <div className="modal-footer">
                    <button
                        id="confirm-cancel-btn"
                        className="btn btn-ghost"
                        onClick={onCancel}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        id="confirm-delete-btn"
                        className="btn btn-danger"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting…' : 'Yes, Deactivate'}
                    </button>
                </div>
            </div>
        </div>
    );
}
