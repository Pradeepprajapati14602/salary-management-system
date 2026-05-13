import { useEffect, useState } from 'react';
import type { Employee } from '@salary-mgmt/shared';
import { IconClose } from '../icons.js';

type Mode = 'create' | 'edit';

interface EmployeeFormModalProps {
    mode: Mode;
    employee?: Employee | null;
    onSubmit: (data: Record<string, unknown>) => void;
    onClose: () => void;
    isSubmitting?: boolean;
    error?: string | null;
}

interface FormData {
    fullName: string;
    email: string;
    jobTitle: string;
    department: string;
    country: string;
    salary: string;
    currency: string;
    hireDate: string;
    status: string;
}

interface FormErrors {
    fullName?: string;
    email?: string;
    jobTitle?: string;
    department?: string;
    country?: string;
    salary?: string;
    hireDate?: string;
}

const EMPTY: FormData = {
    fullName: '',
    email: '',
    jobTitle: '',
    department: '',
    country: '',
    salary: '',
    currency: 'USD',
    hireDate: '',
    status: 'active',
};

function validate(d: FormData): FormErrors {
    const errs: FormErrors = {};
    if (!d.fullName.trim() || d.fullName.trim().length < 2) errs.fullName = 'Name must be at least 2 characters.';
    if (!d.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = 'Valid email required.';
    if (!d.jobTitle.trim() || d.jobTitle.trim().length < 2) errs.jobTitle = 'Job title required (min 2 chars).';
    if (!d.department.trim() || d.department.trim().length < 2) errs.department = 'Department required.';
    if (!d.country.trim() || d.country.trim().length < 2) errs.country = 'Country required.';
    if (!d.salary || Number(d.salary) <= 0) errs.salary = 'Salary must be a positive number.';
    if (!d.hireDate) errs.hireDate = 'Hire date required.';
    return errs;
}

export function EmployeeFormModal({
    mode, employee, onSubmit, onClose, isSubmitting = false, error,
}: EmployeeFormModalProps) {
    const [form, setForm] = useState<FormData>(EMPTY);
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        if (mode === 'edit' && employee) {
            setForm({
                fullName: employee.fullName,
                email: employee.email,
                jobTitle: employee.jobTitle,
                department: employee.department,
                country: employee.country,
                salary: String(employee.salary),
                currency: employee.currency,
                hireDate: employee.hireDate.slice(0, 10),
                status: employee.status,
            });
        } else {
            setForm(EMPTY);
        }
        setErrors({});
    }, [mode, employee]);

    const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [k]: e.target.value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        onSubmit({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            jobTitle: form.jobTitle.trim(),
            department: form.department.trim(),
            country: form.country.trim(),
            salary: Number(form.salary),
            currency: form.currency,
            hireDate: new Date(form.hireDate).toISOString(),
            status: form.status,
        });
    };

    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="employee form modal">
            <div className="modal" onClick={stopPropagation}>
                <div className="modal-header">
                    <h2 className="modal-title" id="modal-title">
                        {mode === 'create' ? 'Add Employee' : 'Edit Employee'}
                    </h2>
                    <button id="modal-close-btn" className="btn-icon" onClick={onClose} aria-label="Close modal"><IconClose size={18} /></button>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 14 }}>
                        {error}
                    </div>
                )}

                <form className="modal-form" onSubmit={handleSubmit} noValidate>
                    <div className="modal-form-grid">
                        <div className="field">
                            <label className="label" htmlFor="field-fullName">Full Name</label>
                            <input id="field-fullName" className="input" value={form.fullName} onChange={set('fullName')} placeholder="Jane Smith" />
                            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="field-email">Email</label>
                            <input id="field-email" className="input" type="email" value={form.email} onChange={set('email')} placeholder="jane@example.com" />
                            {errors.email && <span className="field-error">{errors.email}</span>}
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="field-jobTitle">Job Title</label>
                            <input id="field-jobTitle" className="input" value={form.jobTitle} onChange={set('jobTitle')} placeholder="Software Engineer" />
                            {errors.jobTitle && <span className="field-error">{errors.jobTitle}</span>}
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="field-department">Department</label>
                            <input id="field-department" className="input" value={form.department} onChange={set('department')} placeholder="Engineering" />
                            {errors.department && <span className="field-error">{errors.department}</span>}
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="field-country">Country</label>
                            <input id="field-country" className="input" value={form.country} onChange={set('country')} placeholder="India" />
                            {errors.country && <span className="field-error">{errors.country}</span>}
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="field-salary">Salary</label>
                            <input
                                id="field-salary"
                                className="input"
                                type="number"
                                min="1"
                                max="10000000"
                                value={form.salary}
                                onChange={set('salary')}
                                placeholder="75000"
                            />
                            {errors.salary && <span className="field-error">{errors.salary}</span>}
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="field-currency">Currency</label>
                            <select id="field-currency" className="select" value={form.currency} onChange={set('currency')}>
                                <option value="USD">USD</option>
                                <option value="INR">INR</option>
                                <option value="GBP">GBP</option>
                                <option value="EUR">EUR</option>
                                <option value="AUD">AUD</option>
                                <option value="CAD">CAD</option>
                            </select>
                        </div>

                        <div className="field">
                            <label className="label" htmlFor="field-hireDate">Hire Date</label>
                            <input id="field-hireDate" className="input" type="date" value={form.hireDate} onChange={set('hireDate')} />
                            {errors.hireDate && <span className="field-error">{errors.hireDate}</span>}
                        </div>
                    </div>

                    <div className="field">
                        <label className="label" htmlFor="field-status">Status</label>
                        <select id="field-status" className="select" value={form.status} onChange={set('status')}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button id="modal-cancel-btn" type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button id="modal-submit-btn" type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</> : mode === 'create' ? 'Add Employee' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
