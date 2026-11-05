# Reglas para el agente

Las mismas reglas de la pestaña **Cómo cargar** de la planilla, en un archivo. Sirven para pegarlas en las instrucciones de tu agente (un Project de Claude, un GPT, Instinct) así no tiene que leer la pestaña cada vez.

Si cambiás algo acá, cambialo también en la pestaña.

---

## Principio

Solo se escribe en **Movimientos, Saldos, Activos, Cierres y Config**. Inicio, Mes, Año y Patrimonio son fórmulas: no se tocan. Tampoco las columnas marcadas como fórmula, que calculan solas.

## Movimientos

| Campo | Regla |
|---|---|
| Una fila, un movimiento | Agregar siempre al final. No borrar ni reordenar filas. ID correlativo: M-0001, M-0002… |
| Fecha | El día en que la plata salió o entró. Un gasto futuro que ya es seguro (una cuota, una reserva) se carga con la fecha en que va a pasar. |
| Tipo | Gasto · Ingreso · Transferencia (entre cuentas tuyas) · Inversión (sale de una cuenta hacia un activo) · Pago a persona (saldar un gasto compartido, un préstamo, una devolución). |
| Categoría | Exactamente una de la lista de Config. Para decidir, usar la columna Qué entra. Si un gasto encaja en dos, preguntar una vez y anotar el comercio en Comercios conocidos. Transferencias, inversiones y pagos a personas van sin categoría. |
| Montos | Monto = lo que salió o entró de la cuenta, en la moneda de esa cuenta. Monto base = lo mismo en la moneda base, con el tipo de cambio del día o el de Config. Siempre positivos. |
| Mi parte | Lo que te toca a vos, en moneda base. Si no es compartido, igual a Monto base. Es lo que suma al presupuesto. En transferencias, inversiones y pagos a personas va 0. |
| Etiqueta | Opcional, para agrupar: un viaje ("Lisboa"), un proyecto, un evento. Mismo nombre para todo. Cuando la persona avisa que se va de viaje, etiquetar todo hasta que avise que volvió. |
| Origen y Revisado | Origen = Manual, Agente, Wallet o Extracto. Lo que carga un agente entra con Revisado = No. Pasa a Sí cuando la persona lo revisa o cuando cuadra contra el extracto. |
| Duplicados | Antes de agregar, buscar si ya hay una fila con el mismo monto y comercio en un rango de 2 días. Si existe, no duplicar: preguntar. |

## Casos

**Gasto compartido.** Compartido con = la persona. Pagó = Yo u Otro.

- Pagaste vos 60 de una cena a medias con Ana: Monto 60, Monto base 60, Mi parte 30, Cuenta = la tuya, Compartido con Ana, Pagó Yo. Ana te debe 30.
- Pagó Ana: Monto 60, Monto base 60, Mi parte 30, Cuenta vacía, Compartido con Ana, Pagó Otro. Le debés 30.

**Pago a persona.** Le pasás 100 a Ana: Tipo Pago a persona, Monto 100, Monto base 100, Mi parte 0, Cuenta = de dónde salió, Compartido con Ana, Pagó Yo. Si Ana te paga a vos: Pagó Otro y Cuenta = dónde entró. Un préstamo se carga igual. Para una deuda vieja sin movimiento de plata, dejar Cuenta vacía y aclararlo en Nota.

**Transferencia.** Cuenta = origen, Cuenta destino = destino. Monto en la moneda de origen. Monto base sirve para convertir al destino. Mi parte = 0.

**Inversión.** Cuenta = de dónde salió la plata. Además, en Activos: sumar la Cantidad y el Invertido de ese activo, o crear la fila si es nuevo.

**Compras grandes.** Cosas que duran y suman patrimonio (auto, bici, computadora, muebles). Van como Gasto, categoría Compras grandes, y además se agregan en Activos con Tipo Bien.

## Config, Saldos y Activos

- **Comercios conocidos.** Si el comercio está en la tabla, usar esa categoría. Si no, deducirla. Cuando la persona corrige, agregar o corregir el comercio.
- **Cuentas y personas nuevas.** Agregarlas en Config antes de usarlas. Toda cuenta nueva arranca con un saldo inicial en Saldos.
- **Saldos.** Cuando la persona dice "el banco tiene 1.340": nueva fila con fecha, cuenta y saldo en la moneda de la cuenta. Nunca editar saldos anteriores: el cuadre compara contra el anterior.
- **Activos.** Actualizar Cantidad, Precio actual y Fecha precio. Un bien (auto, depto) lleva Cantidad 1 y su valor estimado como Precio actual.

## Wallet (automático)

Los mensajes que empiezan con `[Wallet]` vienen del iPhone, por ejemplo `[Wallet] Gasté 36,00 € en MERCADONA con Visa`. Se cargan sin preguntar: Cuenta según la tabla Tarjetas de Config, Descripción = el comercio, Origen Wallet, Revisado No, categoría según Comercios conocidos.

Confirmar con una línea: `✓ Mercadona 36 · Comida · Banco`.

## Ejemplos

| Mensaje | Fila |
|---|---|
| super 36 banco | Gasto, Comida, 36, Banco |
| cena 60 con ana, pagué yo | Gasto, Salidas, Mi parte 30, Compartido con Ana, Pagó Yo |
| le pasé 200 a ana | Pago a persona, 200, Pagó Yo |
| cobré el sueldo, 2.500 | Ingreso, Sueldo, 2500 |
| el banco tiene 1.340 | Fila en Saldos |

## Cierre del mes

El último día del mes o el primero del siguiente: copiar en Cierres los totales de Patrimonio (Líquido, Inversiones, Bienes, Te deben, Patrimonio y Patrimonio en moneda de referencia) como números, no fórmulas.

## Revisión mensual

Una vez por mes, con el extracto de cada cuenta (PDF o CSV):

1. Cada movimiento del extracto que falte en Movimientos se agrega con Origen = Extracto.
2. Lo que ya estaba y coincide pasa a Revisado = Sí.
3. Lo que está en Movimientos pero no en el extracto: preguntar.
4. Cargar en Saldos el saldo final del extracto, con su fecha.
5. En Patrimonio, Dif. último cuadre tiene que dar 0. Si no, falta o sobra algo.
6. Hacer el cierre del mes.

El bloque Para revisar de Inicio muestra qué queda pendiente.

## Arranque con historial

Cuando la persona pasa extractos de varios meses para empezar:

1. Cargar cada movimiento con Origen = Extracto y Revisado = No.
2. Las transferencias entre cuentas propias aparecen en dos extractos: cargarlas una sola vez, como Transferencia. El pago del resumen de la tarjeta de crédito también es una Transferencia (del banco a la tarjeta).
3. Categorizar con el criterio de Config. Juntar lo dudoso y preguntar todo junto, una sola vez. Si aparece un gasto que se repite y no tiene categoría, proponer crearla.
4. Preguntar por las transferencias a otras personas: ¿gasto compartido, préstamo o devolución?
5. Con el saldo final de cada extracto, una fila en Saldos con la fecha del extracto. Ese es el saldo inicial de la cuenta.
6. Proponer un presupuesto por categoría: el promedio de los meses completos, redondeado, marcando las categorías que varían mucho de un mes a otro. No escribirlo en Config hasta que la persona lo apruebe.
