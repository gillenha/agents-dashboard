import { useState } from 'react';
import { api } from '@/api/client';
import { Modal } from '@/components';
import styles from './CreateTaskModal.module.css';

export interface CreateTaskModalProps {
  agentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ agentId, isOpen, onClose }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [inputJson, setInputJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitle('');
    setInputJson('');
    setJsonError(null);
    setApiError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJsonError(null);
    setApiError(null);

    let parsed: Record<string, unknown>;
    try {
      const value = JSON.parse(inputJson);
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        throw new Error('Input must be a JSON object, not an array or primitive');
      }
      parsed = value as Record<string, unknown>;
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      return;
    }

    setSubmitting(true);
    try {
      await api.agents.createTask(agentId, { title, input: parsed });
      handleClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Task">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-title">Title</label>
          <input
            id="task-title"
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Check production endpoints"
            required
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-input">
            Input
            <span className={styles.labelHint}>JSON object</span>
          </label>
          <textarea
            id="task-input"
            className={`${styles.textarea}${jsonError ? ` ${styles.invalid}` : ''}`}
            value={inputJson}
            onChange={(e) => { setInputJson(e.target.value); setJsonError(null); }}
            placeholder='{"urls": ["https://example.com"]}'
            required
            rows={6}
            spellCheck={false}
          />
          {jsonError && <p className={styles.fieldError}>{jsonError}</p>}
        </div>

        {apiError && <p className={styles.apiError}>{apiError}</p>}

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
