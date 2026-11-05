# Dashboard

Una página que lee tu planilla en vivo y te muestra todo de un vistazo: cuánto te queda este mes, el año mes a mes, por dónde fluye la plata, en qué se va, tus viajes, tus cuentas, tu patrimonio, quién te debe y cuánto te falta para la libertad financiera.

Tocás cualquier número o gráfico y se abre un panel con los movimientos que hay detrás.

---

## Qué muestra

| Sección | Qué ves |
|---|---|
| Arriba | Patrimonio, ahorro del año, tasa de ahorro y cuántos meses podrías vivir sin trabajar |
| Este mes | Cuánto te queda, cada categoría contra su presupuesto y si vas rápido para el día del mes. Lo que entró, contra el mes anterior |
| El año | Ingresos y gastos mes a mes, ahorro acumulado contra el presupuesto, resultado de cada mes |
| Flujo | De dónde entró la plata y a dónde fue: el año, un mes promedio o un mes puntual |
| En qué se va | Cada categoría contra su presupuesto, un mapa de calor mes a mes y los 15 gastos más grandes |
| Viajes y etiquetas | Cuánto costó cada viaje o proyecto, según la columna Etiqueta |
| Cuentas | El saldo de hoy de cada cuenta y si cuadra |
| Patrimonio | De qué está hecho, cómo creció en cada cierre y cada activo |
| Te deben | El saldo con cada persona |
| Libertad | Cuánto necesitás para no depender de trabajar y en cuántos años llegás, con controles para jugar |

Lee la planilla en vivo: lo que carga tu agente aparece al recargar la página.

---

## Armarlo con Claude (recomendado)

Necesitás Claude con el conector de **Google Sheets** activado y tu copia de la planilla.

1. Copiá el ID de tu planilla: es la parte del link entre `/d/` y `/edit`.
   `https://docs.google.com/spreadsheets/d/`**`ESTE_ES_EL_ID`**`/edit`
2. Abrí un chat nuevo en Claude, subí los archivos de la carpeta `dashboard/` (los seis) y pegá esto:

```
Creá un dashboard nuevo (tipo Dashboard) que se llame "Finanzas personales",
usando exactamente los archivos que te paso:

- dash/meta: {"title": "Finanzas personales"}
- dash/params: {"planilla": "<ID DE MI PLANILLA>"}
- Cada dataset de datasets.json, tal cual, con mi conector de Google Sheets.
- Los archivos index.html, style.css, loaders.js, calcs.js y app.js como
  files/, sin cambiar nada.

Antes de escribir, corré una de las consultas contra mi planilla para
confirmar que el conector funciona. No modifiques el código: si algo falla,
decime qué.
```

3. Cuando termine, abrilo. La primera vez te va a pedir permiso para leer Google Sheets con tu cuenta.

Desde ahí, podés pedirle cambios hablando: "agregá un gráfico de gastos por cuenta", "sacá la sección de libertad", "cambiá los colores".

### Si alguien te comparte su dashboard

El dashboard tiene, abajo de todo, una caja **De qué planilla lee**. Si alguien te comparte el link de su dashboard, podés pegar ahí el link de tu planilla y ver tus números. Cada persona lee con su propia conexión a Google Sheets: nadie ve la planilla de otro.

---

## Con otro agente

Si usás otro agente (ChatGPT, Gemini u otro), estos archivos le sirven como especificación: qué secciones hay, qué rangos de la planilla lee y cómo calcula cada número. Pedile que arme una página HTML a partir de ellos.

La diferencia: el dashboard de Claude lee la planilla en vivo y te deja tocar cada número para ver de dónde sale. Otro agente probablemente te arme una foto que hay que regenerar cada vez.

---

## Cómo está armado

| Archivo | Qué hace |
|---|---|
| `datasets.json` | Las 9 consultas a la planilla: qué rango de qué pestaña lee cada una. `{{planilla}}` es el ID de tu planilla |
| `loaders.js` | Convierte cada rango en filas: montos como números y fechas como AAAA-MM-DD |
| `calcs.js` | Los cálculos: el mes, el año, el flujo, el patrimonio, la libertad |
| `index.html` | La estructura y todos los textos fijos |
| `app.js` | Los gráficos, las tablas y el panel de detalle |
| `style.css` | El diseño |

**Requisitos de la planilla**

- **Configuración regional:** la plantilla viene en español (España), con montos como `1.234,56` y fechas como `dd/mm/aaaa`. No la cambies: el dashboard lee los números en ese formato.
- **Estructura:** lee rangos fijos de las pestañas (por ejemplo, `Patrimonio!B9:I29`). Si agregás o movés filas o columnas en Config o Patrimonio, hay que ajustar `datasets.json`.
- **Categorías:** las lee de Config, así que podés cambiarlas libremente. Una tiene trato especial: **Compras grandes** se separa del gasto normal (no cuenta para el promedio por mes ni para Libertad). Si la renombrás, cambiá el nombre también en `calcs.js` y `app.js`.
