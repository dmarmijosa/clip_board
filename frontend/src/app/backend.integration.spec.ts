import { environment } from '../environments/environment';

describe('Integración API backend', () => {
  it('debe responder con estado OK en /health', async () => {
    const response = await fetch(`${environment.apiBaseUrl}/health`);
    expect(response.ok).toBeTrue();
    const payload = await response.json();
    expect(payload.status).toBe('ok');
    expect(typeof payload.timestamp).toBe('string');
  });
});
