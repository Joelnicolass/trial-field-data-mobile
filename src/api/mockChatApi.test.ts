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
    const loading = mockChatApi.loadChat({ limit: 10 });
    jest.advanceTimersByTime(2000);
    const snapshot = await loading;

    expect(snapshot.me).toBe('u_01');
    expect(snapshot.messages.length).toBeGreaterThan(0);
    expect(snapshot.members.some((member) => member.is_agent)).toBe(true);
  });

  /** Abre el grupo adelantando el reloj. */
  async function open(limit: number) {
    const loading = mockChatApi.loadChat({ limit });
    jest.advanceTimersByTime(2000);
    return loading;
  }

  async function older(beforeSeq: number, limit: number) {
    const loading = mockChatApi.loadOlder({ before_seq: beforeSeq, limit });
    jest.advanceTimersByTime(2000);
    return loading;
  }

  it('al abrir entrega el tramo más reciente y los datos completos', async () => {
    const opening = await open(10);

    expect(opening.messages).toHaveLength(10);
    expect(opening.has_older).toBe(true);
    // La lluvia se anotó en un mensaje anterior al tramo, y el dato viene igual.
    const datoIds = opening.datos.map((dato) => dato.id);
    const loadedDatoIds = opening.messages.flatMap((message) => (message.dato ? [message.dato.id] : []));
    expect(datoIds.length).toBeGreaterThan(loadedDatoIds.length);
  });

  it('nunca deja un mensaje sin leer afuera, aunque la página sea chica', async () => {
    const opening = await open(2);
    const me = opening.members.find((member) => member.id === opening.me);
    const firstSeq = opening.messages[0].seq;

    // Lo primero que vino es anterior a mi marca de lectura: lo no leído entró todo.
    expect(firstSeq).toBeLessThanOrEqual(me?.watermark ?? 0);
    expect(opening.messages.length).toBeGreaterThan(2);
  });

  it('las páginas anteriores llegan de a una, hasta que no hay más', async () => {
    const opening = await open(10);
    const first = await older(opening.messages[0].seq, 6);

    expect(first.messages).toHaveLength(6);
    expect(first.messages[5].seq).toBeLessThan(opening.messages[0].seq);
    expect(first.has_older).toBe(true);

    const second = await older(first.messages[0].seq, 6);
    expect(second.has_older).toBe(false);
    expect(second.messages.length).toBeLessThanOrEqual(6);
  });

  it('sin señal no hay página anterior', async () => {
    const opening = await open(10);
    mockChatApi.setOnline(false);
    const failure = older(opening.messages[0].seq, 6).catch((error: unknown) => error);

    expect(await failure).toMatchObject({ code: 'no_connection' });
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
