import { WorkflowTelemetryService } from './workflow-telemetry.service';

describe('WorkflowTelemetryService', () => {
  it('keeps workflow attributes within the observability allowlist', async () => {
    const service = new WorkflowTelemetryService();
    const result = await service.run('recipe_import.parse', { surface: 'import', status: 'ok' }, async () => 'parsed');
    expect(result).toBe('parsed');
  });

  it('records an error status when a workflow fails', async () => {
    const service = new WorkflowTelemetryService();
    const record = jest.spyOn(service, 'record');
    await expect(service.run('notification.generate', { surface: 'header' }, async () => { throw new Error('failed'); })).rejects.toThrow('failed');
    expect(record).toHaveBeenCalledWith('notification.generate', expect.objectContaining({ status: 'error', duration: expect.any(Number) }));
  });
});
