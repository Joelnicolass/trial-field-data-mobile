import { ApiError } from './chatApi';
import { mockChatApi } from './mockChatApi';

// El servidor de prueba responde con demoras: se adelanta el reloj en vez de esperar.
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  mockChatApi.setOnline(true);
  jest.useRealTimers();
});

describe('mockChatApi', () => {
  it('entrega el grupo con la forma que espera la app', async () => {
    const loading = mockChatApi.loadChat();
    jest.advanceTimersByTime(2000);
    const snapshot = await loading;

    expect(snapshot.me).toBe('u_01');
    expect(snapshot.messages.length).toBeGreaterThan(0);
    expect(snapshot.members.some((member) => member.is_agent)).toBe(true);
  });

  it('sin señal, un envío falla con un error de la app, no del servidor de prueba', async () => {
    mockChatApi.setOnline(false);
    const sending = mockChatApi.send({ local_id: 'l_test', text: 'hola', reply_to: null });
    // La promesa se rechaza al adelantar el reloj: se la deja preparada para atajarla.
    const failure = sending.catch((error: unknown) => error);
    jest.advanceTimersByTime(2000);

    const error = await failure;
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'no_connection', field: null });
  });
});
