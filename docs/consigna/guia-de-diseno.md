# Guía de diseño · Trial Mobile FieldData

La versión corta del sistema de diseño de FieldData, sacada del tema de nuestra web. Alcanza para que la app se sienta nuestra; lo que no esté acá lo decidís vos. Al final están los mismos valores como tokens de TypeScript.

## Color

Fondo gris azulado y tarjetas blancas. El azul oscuro es para la acción principal, el azul para links y botones con borde, y el teal marca un filtro activo. Los estados llevan texto, fondo y borde.

### Superficies

| Nombre | Hex | Uso |
|---|---|---|
| Fondo | `#EEF2F6` | Detrás de todo |
| Superficie | `#FFFFFF` | Tarjetas, hojas, chat |
| Inset | `#F8FAFC` | Inputs y zonas hundidas |
| Divisor | `#E3E8EF` | Bordes de 1 px |

### Texto

| Nombre | Hex | Uso |
|---|---|---|
| Tinta | `#121926` | Títulos y valores |
| Cuerpo | `#364152` | Texto corrido |
| Secundario | `#697586` | Ayudas y fechas sobre blanco |
| Secundario fuerte | `#4B5565` | Texto chico sobre el gris |

### Interacción

| Nombre | Hex | Uso |
|---|---|---|
| Navy | `#243552` | Barra superior, con texto `#E2E8F0` |
| Primario oscuro | `#115293` | Botón principal (hover `#0D4175`) |
| Primario | `#1976D2` | Links y botones con borde |
| Seleccionado | `#D0E6F6` | Fondo de ítem elegido en menús |
| Teal | `#0077AD` | Filtro o pestaña activa |

### Estados

Un mismo estado lleva siempre el mismo color.

| Estado | Texto | Fondo | Borde | Ejemplos |
|---|---|---|---|---|
| Activo | `#1C8300` | `#E8F5E9` | `#1C8300` | Preñada, guardado, nuevo |
| Vendido | `#5B21B6` | `#EDE9FE` | `#5B21B6` | Vendida |
| Pendiente | `#AD8A00` | `#FFF9E3` | `#AD8A00` | Por vencer, demorado |
| Error | `#D32F2F` | `#FFEBEE` | `#FFCDD2` | Falló, sin conexión |
| Archivado | `#6B7280` | `#F3F4F6` | `#9CA3AF` | Dada de baja, vacía |
| Info | `#075985` | `#E0F2FE` | `#0077AD` | Programado, aviso neutro |
| Naranja | `#D84315` | `#FBE9E7` | `#D84315` | Un dato que falta completar |

La lluvia tiene su color: `#2196F3`.

### Categorías de stock

Color por orden, no por categoría. Ordená de mayor a menor cantidad de cabezas y asigná los colores en ese orden: la categoría que más tiene lleva el primero.

`#0D47A1` · `#00897B` · `#F9A825` · `#6A1B9A` · `#C62828` · `#2E7D32` · `#4E7A9B` · `#8D6E63`

En el teléfono, si hay más de seis, mostrá las cinco más grandes y juntá el resto como «Otras», en gris `#9CA3AF`.

## Tipografía

Inter, la misma de la web. Los números van con cifras tabulares para que no bailen cuando cambian.

| Uso | Estilo | Tamaño | Peso | Interlineado |
|---|---|---|---|---|
| Número grande | h1 | 34 | 700 | 1,17 |
| Título de pantalla | h2 | 24 | 700 | 1,2 |
| Valor de tarjeta | h3 | 20 | 600 | 1,17 |
| Título de tarjeta | h4 | 16 | 600 | 1,24 |
| Cuerpo | body1 | 14 | 400 | 1,334 |
| Chico | caption | 12 | 400 | 1,66 |

## Espacio y forma

Todo en múltiplos de 4: 4, 8, 12, 16, 20, 24, 32 y 40. Las tarjetas son planas, con borde de 1 px y sin sombra; la sombra queda para la acción principal, hojas y menús.

- **Margen de pantalla:** 16 en los costados, 24 en bloques de texto largo.
- **Radios:** 8 en botones, chips de filtro, tarjetas, inputs y hojas. 5 en las etiquetas de estado.
- **Toque mínimo:** 44 × 44 pt; los botones de la web miden 46 de alto. En el campo se toca con el pulgar y a veces con guantes.
- **Barra superior:** navy `#243552` con texto `#E2E8F0`. El contenido va sobre el gris, en tarjetas blancas.

## Componentes base

Estas piezas existen en nuestra web, con estos mismos valores.

- **Botones:** alto 46, radio 8, Inter 15 peso 600.
  - Principal: fondo `#115293`, texto blanco y sombra corta. Hover `#0D4175`.
  - Con borde: texto `#1976D2` y borde `#1976D2` al 50 %.
  - Neutro: texto `#697586` y borde `#E3E8EF`.
- **Chips de filtro:** alto 32, radio 8, Inter 14 peso 400, fondo blanco, borde `#D1D5DB` y texto `#666666`. El activo lleva texto y borde `#0077AD` y fondo `#0077AD` al 8 %.
- **Etiquetas de estado:** alto 24, radio 5, Inter 13 peso 600, borde de 1 px, con los colores de la tabla de estados. En filas apretadas van sin borde, con alto 20 y peso 700. La naranja no es de la web: es la regla nuestra para el dato que falta.
- **Aviso de error:** abajo, fondo blanco, borde de 1 px `#E3E8EF`, radio 8 y sombra. El rojo `#D32F2F` va solo en el ícono. Dura 7 s y trae una cruz para cerrarlo antes.
- **Error al cargar una sección:** ocupa el lugar del contenido. No es rojo: es un estado vacío con un ícono, «No pudimos cargar el contenido», «Revisá tu conexión y probá de nuevo.» y el botón principal «Reintentar».
- **Tarjeta:** fondo blanco, borde de 1 px `#E3E8EF`, radio 8, relleno 20 y sin sombra. Título en 16 peso 600.

## En el grupo

Cuatro reglas. El resto lo decidís vos.

- **Quién habla:** los mensajes de los demás llevan nombre; los tuyos, no. En un grupo de cinco nadie tiene que adivinar quién mandó qué.
- **El agente no es una persona:** se tiene que distinguir de un vistazo, sin leer el nombre. Lo que anota es un dato, no un globo de texto.
- **Un dato, una tarjeta:** si alguien completa o corrige un dato, cambia esa misma tarjeta. Donde pasó, queda una línea que dice quién lo cambió.
- **Lo tuyo resalta:** una mención a vos se ve aunque pases rápido por el chat.

## Cómo escribimos

El agente habla como un vecino que sabe de números, no como un sistema.

- **Voseo, frases cortas:** «Tenés 151 vacas preñadas.» «Confirmá la lluvia.»
- **Palabras del campo:** caravana, lote, potrero, tacto, manga. Nunca «ID», «registro» ni «entidad».
- **Números argentinos:** 1.840,5 ha · 452,3 kg · 83,9 % · 23 mm
- **Fechas:** Hoy y Ayer en palabras. El resto, 14/04; con año solo si no es este.
- **Datos:** el agente guarda solo lo que está completo. Si falta algo, lo pide y la tarjeta queda en naranja hasta que alguien la complete. El naranja es solo para eso.
- **Errores:** qué pasó y qué hacer: «No pudimos cargar el contenido. Revisá tu conexión y probá de nuevo.» El rojo va en el ícono o la etiqueta, nunca de fondo.

## Tokens

Los mismos valores, listos para pegar. El interlineado va en puntos, redondeado.

```ts
export const color = {
  fondo: '#EEF2F6',
  superficie: '#FFFFFF',
  inset: '#F8FAFC',
  divisor: '#E3E8EF',
  tinta: '#121926',
  cuerpo: '#364152',
  secundario: '#697586',
  secundarioFuerte: '#4B5565',
  navy: '#243552',
  sobreNavy: '#E2E8F0',
  primarioOscuro: '#115293',
  primarioOscuroHover: '#0D4175',
  primario: '#1976D2',
  seleccionado: '#D0E6F6',
  teal: '#0077AD',
  chipBorde: '#D1D5DB',
  chipTexto: '#666666',
  lluvia: '#2196F3',
} as const;

export const estado = {
  activo: { texto: '#1C8300', fondo: '#E8F5E9', borde: '#1C8300' },
  vendido: { texto: '#5B21B6', fondo: '#EDE9FE', borde: '#5B21B6' },
  pendiente: { texto: '#AD8A00', fondo: '#FFF9E3', borde: '#AD8A00' },
  error: { texto: '#D32F2F', fondo: '#FFEBEE', borde: '#FFCDD2' },
  archivado: { texto: '#6B7280', fondo: '#F3F4F6', borde: '#9CA3AF' },
  info: { texto: '#075985', fondo: '#E0F2FE', borde: '#0077AD' },
  faltaDato: { texto: '#D84315', fondo: '#FBE9E7', borde: '#D84315' },
} as const;

export const categorias = ['#0D47A1', '#00897B', '#F9A825', '#6A1B9A', '#C62828', '#2E7D32', '#4E7A9B', '#8D6E63'] as const;
export const otras = '#9CA3AF';

export const espacio = [4, 8, 12, 16, 20, 24, 32, 40] as const;
export const radio = { boton: 8, chip: 8, tarjeta: 8, input: 8, hoja: 8, etiqueta: 5 } as const;
export const toqueMinimo = 44;

export const fuente = 'Inter';
export const tipo = {
  h1: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  h2: { fontSize: 24, lineHeight: 29, fontWeight: '700' },
  h3: { fontSize: 20, lineHeight: 23, fontWeight: '600' },
  h4: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  body1: { fontSize: 14, lineHeight: 19, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 20, fontWeight: '400' },
} as const;
```
