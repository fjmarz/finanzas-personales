# Finanzas personales

Una planilla de Google Sheets para llevar tus finanzas como son en la vida real: varios bancos, varias monedas, viajes, gastos compartidos con amigos y la pareja, inversiones.

La carga la hace un agente (Claude, ChatGPT, Instinct o el que uses). Vos le mandás "super 36 banco" y él escribe la fila. Una vez por mes revisás contra los extractos y listo.

**[Hacer una copia de la planilla](https://docs.google.com/spreadsheets/d/1Zw87bgX5Jnrs4715rphmcPGLWhrHO0nKCI2baEb5diQ/copy)** · [Ver la demo con datos de ejemplo](https://docs.google.com/spreadsheets/d/1_XC2s3DLOhVT-H2Sx9nDVTtPvh6I_ZvPBck3sBG3Leg/edit)

---

## Las 5 ideas

### 1. Todas tus cuentas en un lugar

Bancos, tarjetas, efectivo, cuentas en dólares, cripto. Cada cuenta tiene su moneda y todo se suma en una **moneda base** que elegís vos (EUR, USD, ARS, la que sea).

No hace falta cargar el saldo todos los días. La planilla calcula el **saldo de hoy** así:

> último saldo que cargaste + los movimientos de esa cuenta desde ese día

Cuando cargás un saldo nuevo, compara contra lo que esperaba. Si no da cero, faltan o sobran movimientos. Eso es el **cuadre**, y es lo que hace que los números sean confiables.

### 2. La vida real: viajes, salidas, pagos entre amigos

- **Gastos compartidos.** Cada movimiento tiene "Mi parte". Si pagaste 60 de una cena a medias, gastaste 30 y tu amigo te debe 30. Si pagó él, le debés 30. El presupuesto solo cuenta tu parte.
- **Quién debe qué.** La planilla lleva la cuenta con cada persona. Cuando alguien te transfiere, se carga como "Pago a persona" y la deuda baja. Un préstamo funciona igual.
- **Viajes.** Cualquier movimiento puede llevar una **Etiqueta** ("Lisboa"). Así sabés cuánto costó cada viaje, sumando pasajes, hotel, comidas y Ubers.

### 3. Automatizar todo lo posible

- **Un agente carga por vos.** Le hablás como a una persona y él sigue las reglas de la pestaña "Cómo cargar".
- **Pagos con el iPhone.** Un atajo de iOS le manda al agente cada pago que hacés con Apple Wallet. El agente lo carga solo y te confirma en una línea.
- **Tipo de cambio automático.** Se actualiza solo con Google Finance. Si querés otro (por ejemplo, el blue), escribís el número encima.
- **Comercios conocidos.** Cuando corregís una categoría, el agente lo anota y la próxima vez lo hace bien.

### 4. Revisar y prever

**Revisión mensual.** Una vez por mes le pasás al agente los extractos de tus cuentas. Él:

1. agrega lo que falta,
2. marca como revisado lo que coincide,
3. te pregunta por lo que no aparece en el banco,
4. carga el saldo final,
5. cierra el mes.

El bloque **Para revisar** de Inicio te dice qué queda pendiente: movimientos sin revisar, cuentas que no cuadran, saldos viejos, cierre que falta.

**Previsión.** Las cuotas, reservas e inscripciones que ya sabés que vienen se cargan con la fecha en que van a pasar. Así el mes que viene ya muestra lo que está comprometido.

**Historia.** Cada cierre guarda una foto de tu patrimonio. La pestaña Año la muestra mes a mes.

### 5. Presupuestar

Un monto mensual por categoría y un **ritmo** para cada una:

| Ritmo | Para qué | Cómo avisa |
|---|---|---|
| Fijo | Alquiler, teléfono, suscripciones | Solo si te pasás |
| Variable | Comida, salidas, transporte | Compara contra el día del mes: si a mitad de mes ya gastaste el 80%, te avisa "Rápido" |
| Puntual | Ropa, viajes, regalos | Solo si te pasás |

Inicio te dice cuánto te queda este mes y cuánto podés gastar por día.

---

## Empezar: con tu historial, no de cero

No hace falta configurar nada a mano. Tu historial ya dice en qué gastás, cuánto, y cuánto tenés en cada cuenta.

1. **Hacé una copia** de la planilla (link de arriba).
2. **Descargá tus movimientos** de los últimos 3 a 6 meses de cada banco y tarjeta. Casi todos los bancos exportan CSV o Excel; si solo da PDF, también sirve.
3. **Conectá tu agente** a la planilla y pasale los extractos con este mensaje:

```
Seguí la pestaña "Cómo cargar" de mi planilla de finanzas y hacé el
arranque con historial con estos extractos. Cuando termines, mostrame
las categorías que usaste, el presupuesto que me proponés y el saldo
inicial de cada cuenta.
```

4. **Revisá lo que te propone** y ajustá Config: categorías, presupuesto, personas.
5. **Si tenés inversiones o bienes**, cargalos en Activos.

El agente carga todo el historial, junta las transferencias entre tus cuentas para no contarlas dos veces, te pregunta por los pagos a otras personas, toma el saldo final de cada extracto como punto de partida y te propone un presupuesto con el promedio de cada categoría.

De ahí en adelante, le mandás tus gastos y él carga.

---

## Las pestañas

| Pestaña | Qué es | ¿Se escribe? |
|---|---|---|
| **Inicio** | Cuánto te queda este mes, gastos por categoría, quién debe qué, qué revisar | No |
| **Mes** | Cualquier mes: presupuesto contra real y la lista de movimientos | Solo el selector |
| **Año** | Ingresos, gastos y patrimonio mes a mes | Solo el selector |
| **Patrimonio** | Cuentas con su saldo de hoy, inversiones, bienes, deudas | No |
| **Movimientos** | Una fila por cada gasto, ingreso, transferencia o pago | Sí, el agente |
| **Saldos** | Saldos reales de tus cuentas, con fecha | Sí |
| **Activos** | Inversiones y bienes | Sí |
| **Cierres** | Foto del patrimonio a fin de cada mes | Sí, el agente |
| **Config** | Moneda, cuentas, categorías, presupuesto, personas | Sí |
| **Cómo cargar** | Las reglas que sigue el agente | Leer |

Las vistas tienen fórmulas. Si intentás editarlas, Sheets te avisa.

---

## Tipos de movimiento

| Tipo | Ejemplo | Afecta presupuesto |
|---|---|---|
| Gasto | Super, alquiler, una cena | Sí, por tu parte |
| Ingreso | Sueldo, un trabajo extra | Sí |
| Transferencia | Del banco a la cuenta en dólares | No |
| Inversión | Comprar un ETF | No (se suma en Activos) |
| Pago a persona | Le pasás a un amigo lo que le debías | No (mueve la deuda) |

Los detalles de cada caso están en la pestaña "Cómo cargar".

---

## Categorías

La planilla trae estas. Podés cambiarlas, sumar o borrar en Config y las vistas se actualizan solas. Lo importante es el criterio: si cada gasto tiene un solo lugar claro, los números de un mes se pueden comparar con los del siguiente.

| Categoría | Qué entra | Ritmo |
|---|---|---|
| Vivienda | Alquiler o hipoteca, expensas, luz, gas, agua, internet, limpieza, arreglos de la casa | Fijo |
| Comida | Lo que comprás para comer en casa: súper, verdulería, carnicería, panadería | Variable |
| Salidas | Comer o tomar algo afuera, delivery, cafés, bares, cine, planes con amigos | Variable |
| Deporte | Gimnasio, clases, inscripciones a carreras, equipamiento deportivo | Puntual |
| Salud | Prepaga o seguro médico, médicos, farmacia, suplementos, peluquería, cuidado personal | Puntual |
| Transporte | En tu ciudad: transporte público, taxi, Uber, nafta, estacionamiento, seguro y service del auto | Variable |
| Suscripciones | Teléfono, nube, streaming, apps | Fijo |
| Ropa | Ropa, calzado, accesorios | Puntual |
| Viajes | Todo lo de un viaje fuera de tu ciudad: pasajes, alojamiento y lo que gastás allá | Puntual |
| Extras | Regalos, gustos, compras varias, imprevistos | Puntual |
| Trabajo | Gastos de tu trabajo o tu negocio: coworking, software, contador | Puntual |
| Compras grandes | Cosas que duran años: muebles, electrodomésticos, computadora, bici, auto | Puntual |

Ingresos: **Sueldo**, **Extra** (trabajos puntuales, ventas) y **Otro** (intereses, reintegros, devoluciones de impuestos).

Dos criterios que evitan discusiones con uno mismo:

- **En un viaje, todo va a Viajes.** La cena en Lisboa no es Salidas. Así sabés cuánto te costó el viaje entero.
- **Si dura años, es Compra grande.** Así un mes con una heladera nueva no parece un mes en el que gastaste de más.

---

## Dashboard

Además de las vistas de la planilla, hay un dashboard que la lee en vivo: este mes, el año, por dónde fluye la plata, en qué se va, viajes, cuentas, patrimonio, quién te debe y cuánto te falta para la libertad financiera. Tocás cualquier número y ves los movimientos que hay detrás.

Se arma con Claude en un paso, con los archivos de la carpeta `dashboard/`. Con otro agente, esos archivos le sirven como especificación. Todo está en [DASHBOARD.md](DASHBOARD.md).

---

## Automatizaciones

### Atajo del iPhone

En la app Atajos: **Automatización → Wallet → al tocar cualquier tarjeta**. La acción manda un mensaje a tu agente con este texto:

```
[Wallet] Gasté {Importe} en {Comercio} con {Tarjeta}
```

En Config, la tabla **Tarjetas** le dice al agente a qué cuenta va cada tarjeta.

### Revisión mensual

Pegale esto a tu agente junto con los extractos del mes:

```
Hacé la revisión mensual de mi planilla de finanzas siguiendo la sección
"Revisión mensual" de la pestaña Cómo cargar. Te paso los extractos de
[cuentas]. No borres nada: si algo no coincide, preguntame.
```

---

## Preguntas

**¿Dónde quedan mis datos?** En tu Google Drive. La planilla no se conecta a ningún lado salvo a Google Finance para el tipo de cambio. El dashboard la lee con tu propia conexión de Google Sheets: nadie más la ve, aunque compartas el link del dashboard.

**¿Sirve sin agente?** Sí. Todo se puede cargar a mano. El agente ahorra tiempo, no es obligatorio.

**¿Y si vivo en pareja?** Cada uno lleva su planilla y los gastos compartidos se cargan con "Mi parte". La cuenta entre los dos sale sola en "Quién debe qué".

**¿Puedo cambiar las categorías?** Sí, en Config. Las vistas se actualizan solas.

**¿Un archivo por año?** No. Es un solo archivo. Mes y Año tienen un selector para ver cualquier período.

---

## Qué hay en este repo

| Archivo | Qué es |
|---|---|
| `README.md` | Esta guía |
| `AGENTE.md` | Las reglas de carga, para pegar en las instrucciones de tu agente |
| `DASHBOARD.md` | Cómo armar el dashboard |
| `dashboard/` | Los archivos del dashboard |
| `CHANGELOG.md` | Qué cambió en cada versión |

La planilla no vive acá: se copia desde el link de arriba.

---

## Licencia

MIT. Usala, copiala y cambiala como quieras.
