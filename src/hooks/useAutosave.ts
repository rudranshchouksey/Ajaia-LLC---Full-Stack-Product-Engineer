"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

type Content = { json: unknown; html: string };
type Pending = { title?: string; content?: true };

const DEBOUNCE_MS = 800;
const RETRY_MS = 5000;

/**
 * Debounced autosave controller (framework-agnostic).
 *
 * - Changes are batched into one PATCH per debounce window.
 * - Only one request is in flight at a time; edits made during a save are
 *   queued and sent right after, so saves can't arrive out of order.
 * - Editor content is serialized lazily at send time (not on every keystroke).
 * - Transient failures retry automatically; 401/403/404 are permanent.
 */
class AutosaveController {
  private pending: Pending = {};
  private inFlight = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private fatal = false;

  /** Serializes the editor; set by the hook once the editor exists. */
  private getContent: () => Content | null = () => null;

  setContentSource(fn: () => Content | null) {
    this.getContent = fn;
  }

  constructor(
    private readonly documentId: string,
    private readonly onState: (status: SaveStatus, error: string | null) => void,
  ) {}

  get dirty() {
    return this.inFlight || this.pending.title !== undefined || this.pending.content !== undefined;
  }

  schedule(change: Pending) {
    this.pending = { ...this.pending, ...change };
    if (this.fatal) return;
    if (!this.inFlight) this.onState("unsaved", null);
    this.clearTimer();
    this.timer = setTimeout(() => void this.flush(), DEBOUNCE_MS);
  }

  retry() {
    this.fatal = false;
    void this.flush();
  }

  async flush(): Promise<void> {
    this.clearTimer();
    if (this.inFlight || this.fatal) return;

    const batch = this.pending;
    this.pending = {};
    const body: { title?: string; content?: Content } = {};
    if (batch.title !== undefined) body.title = batch.title;
    if (batch.content) {
      const content = this.getContent();
      if (content) body.content = content;
    }
    if (body.title === undefined && !body.content) return;

    this.inFlight = true;
    this.onState("saving", null);
    try {
      await api(`/api/documents/${this.documentId}`, { method: "PATCH", body: JSON.stringify(body) });
      this.inFlight = false;
      if (this.pending.title !== undefined || this.pending.content) {
        void this.flush(); // edits arrived while saving
      } else {
        this.onState("saved", null);
      }
    } catch (err) {
      this.inFlight = false;
      // Put the failed batch back; newer edits take precedence.
      this.pending = { ...batch, ...this.pending };
      this.onState("error", err instanceof Error ? err.message : "Couldn't save");
      if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
        this.fatal = true;
      } else {
        this.timer = setTimeout(() => void this.flush(), RETRY_MS);
      }
    }
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}

export function useAutosave(documentId: string, getContent: () => Content | null) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const [controller] = useState(
    () =>
      new AutosaveController(documentId, (s, e) => {
        setStatus(s);
        setError(e);
      }),
  );

  useEffect(() => {
    controller.setContentSource(getContent);
  }, [controller, getContent]);

  // Warn about unsaved changes on tab close / refresh, and save on unmount
  // (e.g. client-side navigation back to the dashboard).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (controller.dirty) {
        void controller.flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      void controller.flush();
    };
  }, [controller]);

  const markContentChanged = useCallback(() => controller.schedule({ content: true }), [controller]);
  const setTitle = useCallback((title: string) => controller.schedule({ title }), [controller]);
  const flush = useCallback(() => controller.flush(), [controller]);
  const retry = useCallback(() => controller.retry(), [controller]);

  return { status, error, markContentChanged, setTitle, flush, retry };
}
