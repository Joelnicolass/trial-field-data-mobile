# Trial Mobile · FieldData

## Contexto

FieldData ayuda a productores agropecuarios a llevar su campo hablando. Hoy lo hacen por WhatsApp: mandan un audio o un mensaje y un asistente registra el dato (una vacunación, una lluvia, un pesaje) o responde una consulta.

Ahora lo llevamos a una app propia, y el centro es el grupo del campo. El equipo charla como en cualquier grupo, y en el medio está el agente, nuestro asistente de IA. Cuando alguien cuenta algo que es un dato, el agente lo anota. Si le falta algo, lo pide, y cualquiera del grupo lo puede completar. Cuando lo mencionan, responde.

## Para quién

La app es para la gente que trabaja en un campo ganadero: el dueño, el encargado, los peones y la veterinaria. Parte del ejercicio es pensar quiénes son, dónde están cuando la abren y qué necesitan de ella.

En este ejercicio la usás como Héctor, el dueño. En el grupo también están Mariano, el encargado; Ramón, el peón; y Lucía, la veterinaria.

## Qué construir

Una app en Expo con dos vistas que se hablan entre sí: el grupo y los datos del campo. No hay backend: te damos `mock-data.json` con los datos del campo y `mock-server.ts`, que hace de servidor del grupo. Más abajo está cómo usarlos.

### El grupo

Como Héctor, quiero:

- abrir el grupo y ver qué pasó desde la última vez, empezando por lo que no leí;
- ver llegar los mensajes de los demás mientras estoy en el grupo, sin perder lo que estaba leyendo;
- escribir, responder un mensaje y mencionar a alguien cuando quiera, aunque estén llegando mensajes;
- saber en qué está cada cosa: si lo que mandé se está enviando o falló, si alguien está escribiendo y si el agente está pensando o tarda;
- reintentar lo que no salió;
- darme cuenta de un vistazo de qué dijo una persona y qué anotó el agente;
- completar desde la tarjeta un dato al que le falta algo, sin escribir otro mensaje.

### Los datos del campo

Como Héctor, quiero:

- ver cuántos animales tengo por categoría, cómo dio el último tacto y cuánto llovió mes a mes en el último año;
- buscar un animal por su caravana y filtrar la lista por categoría.

### Las dos juntas

Como Héctor, quiero:

- tocar una tarjeta o un dato del grupo e ir directo a eso en los datos, y al volver encontrar el grupo como lo dejé;
- que lo que se anota en el grupo cuente en los datos: si alguien carga o corrige una lluvia, cambia el total del mes.

### Extras opcionales

Solo si terminaste lo anterior y te queda tiempo. No hacerlos no resta.

- Ver el detalle de un animal.
- Ver la info del grupo: quiénes están, quién vio cada mensaje mío y en qué modo está el agente.
- Las mismas dos vistas en web (Expo web o React), para ver cómo pensás la información en una pantalla grande.

## Los datos

`mock-data.json` trae los datos del campo: el stock, el tacto, las lluvias y los animales. Tomá `now` como la hora actual, en las dos vistas.

- En `rainfall.months`, el mes en curso viene parcial: llega hasta `until`. Una lluvia que se anote en el grupo con fecha posterior se suma a su mes. Si después la corrigen, cuenta el valor nuevo.
- Un mes en `null` no tiene registro. No es cero.

`mock-server.ts` hace de servidor del grupo: guarda el historial y simula a Mariano, Ramón, Lucía y el agente. Ponelo junto al JSON y usalo así, sin modificarlo:

```ts
import { loadChat, connect, send, completeDato, markRead } from './mock-server';

const chat = await loadChat(); // miembros, historial, lo que quedó sin enviar y un cursor

const disconnect = connect((event) => {
  // llegan los eventos de la tabla de abajo
}, { after_cursor: chat.cursor });

const message = await send({ local_id: 'b7e1…', text: '@agente cuántas cabezas hay?', reply_to: null });
await completeDato({ local_id: '4f0a…', dato_id: 'd_03', values: { vaccine: 'Aftosa bivalente' }, base_version: 1 });
markRead(message.seq);
```

- `loadChat()` es la carga inicial. Tarda un poco, como un pedido real.
- Al conectarte, el grupo se empieza a mover: unos 30 segundos de actividad, como si los demás estuvieran escribiendo en ese momento.
- Por `connect` llegan todos los mensajes, también los tuyos. Cada uno trae un `cursor`: si cerrás la conexión, al volver pasá el último que recibiste en `after_cursor` y te llega lo que te perdiste.
- `send` y `completeDato` devuelven una promesa. Cada pedido lleva un `local_id` que generás vos, por ejemplo un uuid. Si reintentás con el mismo `local_id` no se duplica: si ya había salido, te devuelve el mismo mensaje.
- `markRead(seq)` marca como leído hasta ese mensaje.
- `setOnline(false)` simula que no hay señal: no llega nada y todo pedido falla. Con `setOnline(true)` te llega lo que te perdiste.
- Todo vive en memoria. Para arrancar la demo de cero, recargá la app entera: Fast Refresh no lo reinicia.
- Los tipos de TypeScript de todo esto están en el mismo archivo.

| Evento | Qué significa |
|---|---|
| `message` | llegó un mensaje, tuyo o de otro, con su `cursor` |
| `typing` | una persona está escribiendo |
| `agent_status` | qué está haciendo el agente: `idle`, `thinking` o `slow`, que es cuando tarda más de lo normal |

`typing` no tiene evento de fin: dura hasta que esa persona manda algo, o 6 segundos.

Si un pedido falla, la promesa se rechaza con un `ServerError`. Su `code` dice qué pasó:

| `code` | Qué pasó |
|---|---|
| `no_connection` | no había señal, o se cortó antes de la respuesta |
| `stale_version` | otro cambió el dato antes que vos. `error.dato` trae cómo quedó |
| `no_changes` | mandaste los mismos valores que ya tenía |
| `invalid_value` | un valor no sirve para su campo. `error.field` dice cuál |
| `not_found` | ese dato no existe |

## Cómo leer los mensajes

- `seq` da el orden de la conversación y `message_id` identifica cada mensaje. `cursor` es otra cosa: el orden en que te llegan.
- `sender_id` y `mentions` son ids de `members`. Para mencionar a alguien, escribí `@` y su `short_name`.
- `reply_to` es el `seq` del mensaje citado.
- `watermark` dice hasta qué `seq` leyó cada miembro. Vos sos `me`.
- `unsent` es lo que quedó sin enviar en el teléfono la última vez que usaste la app. Se reintenta con `send` y su mismo `local_id`. De ahí en más, guardar lo que no salió es cosa de tu app.
- `local_id` aparece en los mensajes que salieron de un pedido tuyo: es el que usaste al mandarlo.
- Un mensaje `dato_change` modifica un dato que ya está en el grupo: trae el `dato_id`, qué pasó, quién lo hizo, la versión nueva y qué campos cambiaron. Completar un dato desde la app también genera un `dato_change`, hecho por vos: es lo que devuelve `completeDato`.

| `type` | Quién | Qué trae |
|---|---|---|
| `text` | todos | `text` |
| `audio` | personas | `duration_ms` y `transcript` |
| `photo` | personas | `photo` con ancho, alto, color y descripción; el epígrafe va en `text`. No hay imagen real: dibujá algo que la represente. |
| `system` | el grupo | `text`, por ejemplo «Mariano agregó a Lucía» |
| `dato` | el agente | lo que anotó: `fields`, `status` (`saved`, `incomplete` o `deleted`), `version`, `missing_fields`, `suggestions` y `opens` |
| `card` | el agente | un número principal, un dato secundario y `opens` |
| `table` | el agente | columnas con tipo y filas |
| `dato_change` | el agente | qué dato cambió, quién lo cambió y cómo |

`opens` dice adónde lleva tocar una tarjeta o un dato. Si es `null`, no lleva a ningún lado. Si no hiciste el detalle de un animal, que `view: 'animal'` muestre la lista con solo ese animal.

## Reglas

- Expo (SDK reciente) y TypeScript. Tiene que correr en Expo Go, sin build nativo.
- Librerías a elección. Si sumás una grande, contá por qué en el README.
- Seguí la guía de diseño que te pasamos. Donde no alcance, decidí vos y anotalo.
- Los datos vienen crudos: números sin formato, fechas ISO y `null` donde falta algo. Mostrarlos bien es parte del ejercicio.
- El micrófono puede ser de mentira. No hace falta grabar audio.

## Durante el día

- Vas a tener un canal de Slack abierto con nosotros toda la jornada. Si algo del enunciado no se entiende o te trabás, escribinos: preguntar no resta.
- A mitad de la jornada hacemos un checkpoint corto. Nos contás cómo venís, qué decidiste hasta ahí y qué pensás hacer con el tiempo que queda.

## Entregable

- Un repo que corra con `npx expo start` en Expo Go.
- Un README con cómo correrlo, qué decidiste y por qué, y qué dejaste afuera.
- Capturas de las dos vistas.
- Una demo en vivo: la app corriendo en tu teléfono, en la llamada de revisión.
- Un video corto suma, pero no es obligatorio.

## Tiempo

Una jornada. Si no llegás a todo, priorizá en este orden: primero el grupo, después los datos y por último la conexión entre los dos. En el README anotá qué te faltó.

## Después

Una llamada de 30 minutos. Arrancás con la demo en tu teléfono, después charlamos las decisiones y hacemos un cambio juntos.
