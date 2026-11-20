// El único lugar que decide con qué servidor habla la app. Hoy es el de
// prueba; para usar uno real se cambia acá, y nada más.

import type { CampoData } from '@/domain/campo';
import data from '@/server/mock-data.json';

import type { ChatApi } from './chatApi';
import { mockChatApi } from './mockChatApi';

export { ApiError, type ChatApi } from './chatApi';

/** El servidor del grupo. */
export const chatApi: ChatApi = mockChatApi;

/** Los datos del campo. Hoy salen de un archivo; con un servidor real serían un pedido. */
export const campoData = data as unknown as CampoData;

/** La hora actual, en ISO. La consigna pide tomar la de los datos. */
export const serverNow: string = data.now;
