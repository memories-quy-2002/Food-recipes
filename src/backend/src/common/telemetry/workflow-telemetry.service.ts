import * as Sentry from '@sentry/nestjs';
import { writeStructuredLog } from '../logging/structured-logger';

export const WORKFLOW_SPANS = ['recommendation.compute', 'meal_plan.generate', 'recipe_import.fetch', 'recipe_import.parse', 'notification.generate'] as const;
export type WorkflowSpanName = (typeof WORKFLOW_SPANS)[number];
export type WorkflowAttributes = { surface?: string; candidate_count?: number; result_count?: number; duration?: number; status?: 'ok' | 'error' };

const safeAttributes = (attributes: WorkflowAttributes): WorkflowAttributes => ({
  ...(typeof attributes.surface === 'string' ? { surface: attributes.surface.slice(0, 40) } : {}),
  ...(Number.isFinite(attributes.candidate_count) ? { candidate_count: attributes.candidate_count } : {}),
  ...(Number.isFinite(attributes.result_count) ? { result_count: attributes.result_count } : {}),
  ...(Number.isFinite(attributes.duration) ? { duration: attributes.duration } : {}),
  ...(attributes.status === 'ok' || attributes.status === 'error' ? { status: attributes.status } : {}),
});

type SentrySpanApi = typeof Sentry & { startSpan?: <T>(options: { name: string; op: string; attributes: Record<string, string | number> }, callback: () => T | Promise<T>) => T | Promise<T> };

export class WorkflowTelemetryService {
  async run<T>(name: WorkflowSpanName, attributes: WorkflowAttributes, operation: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    const sentry = Sentry as SentrySpanApi;
    const execute = async () => {
      try {
        const result = await operation();
        this.record(name, { ...attributes, duration: Date.now() - startedAt, status: 'ok' });
        return result;
      } catch (error) {
        this.record(name, { ...attributes, duration: Date.now() - startedAt, status: 'error' });
        throw error;
      }
    };
    if (typeof sentry.startSpan === 'function') {
      return sentry.startSpan({ name, op: 'workflow', attributes: safeAttributes(attributes) as Record<string, string | number> }, execute);
    }
    return execute();
  }

  record(name: WorkflowSpanName, attributes: WorkflowAttributes): void {
    writeStructuredLog('info', 'Workflow telemetry', { type: 'workflow_span', name, ...safeAttributes(attributes) });
  }
}

export const workflowTelemetry = new WorkflowTelemetryService();
