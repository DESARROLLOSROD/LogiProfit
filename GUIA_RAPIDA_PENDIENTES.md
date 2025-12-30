# 📋 Guía Rápida: Dashboard de Pendientes

## ¿Qué es?
Una página que muestra todas las tareas pendientes del día en un solo lugar, para que no olvides nada importante.

---

## 🚀 Cómo Acceder

### Opción 1: Desde el Menú
1. Abre LogiProfit
2. En el menú lateral, haz clic en **"Pendientes"** (tiene un ícono de reloj ⏰)
3. Si hay tareas pendientes, verás un **número rojo** junto al nombre

### Opción 2: Directo
- Ve a: `http://localhost:5173/pendientes` (desarrollo)
- O: `https://tudominio.com/pendientes` (producción)

---

## 📊 ¿Qué Muestra?

### 4 Tipos de Tareas Pendientes

#### 🟡 1. Fletes sin Gastos Registrados
**¿Qué significa?**
- Tienes fletes que ya están en curso o completados
- Pero NO has registrado ningún gasto (diesel, casetas, etc.)

**¿Por qué es importante?**
- No puedes calcular la utilidad real sin los gastos
- Necesitas estos datos para saber si ganaste o perdiste dinero

**¿Qué hacer?**
1. Haz clic en "Ver Detalles" del flete
2. Ve a la sección de "Gastos"
3. Registra todos los gastos del viaje

---

#### 🟠 2. Cotizaciones por Vencer
**¿Qué significa?**
- Cotizaciones que expiran en los próximos 7 días
- O que ya expiraron

**¿Por qué es importante?**
- Si no haces seguimiento, pierdes la venta
- El cliente podría aceptar o rechazar

**¿Qué hacer?**
1. Revisa el badge de urgencia:
   - 🔴 **Rojo** = Ya venció (llamar urgente)
   - 🟡 **Amarillo** = Vence en 3 días o menos (llamar pronto)
   - 🔵 **Azul** = Vence en más de 3 días (hacer seguimiento)
2. Contacta al cliente
3. Si acepta: Conviértela a Flete
4. Si rechaza: Cambia estado a "Rechazada"

---

#### 🔴 3. Comprobantes Fiscales Faltantes
**¿Qué significa?**
- Gastos que registraste en el sistema
- Pero NO subiste el comprobante (XML o PDF)

**¿Por qué es importante?**
- Sin comprobante, no puedes deducir el gasto
- El SAT puede rechazar tu contabilidad
- Es un requisito legal

**¿Qué hacer?**
1. Haz clic en "Ver Flete"
2. Busca el gasto en la lista
3. Sube el archivo XML del ticket/factura
4. Verifica que coincida el monto

---

#### 🟣 4. Pagos Vencidos
**¿Qué significa?**
- Clientes que debían pagar y no lo han hecho
- *Nota: Esta sección se activará cuando implementemos el módulo de Pagos*

**¿Qué hacer?**
- Por ahora: Llevar control manual
- Próximamente: El sistema te avisará automáticamente

---

## 🔄 Actualizar los Datos

### Automático
- El sistema actualiza solo cada **5 minutos**
- El número rojo en el menú también se actualiza automáticamente

### Manual
- Haz clic en el botón **"Actualizar"** (arriba a la derecha)
- Verás el ícono girando mientras carga
- Útil cuando acabas de completar una tarea

---

## 💡 Consejos de Uso

### Rutina Diaria Recomendada

#### 🌅 Inicio del Día (8:00 AM)
1. Abre la página de **Pendientes**
2. Revisa el total de tareas
3. Prioriza:
   - ⚠️ Primero: Comprobantes faltantes (rojo)
   - ⚠️ Segundo: Cotizaciones vencidas (rojo)
   - ⏰ Tercero: Cotizaciones por vencer (amarillo)
   - 📝 Cuarto: Fletes sin gastos (amarillo)

#### ☀️ Durante el Día
- Revisa el **número rojo** en el menú
- Si aumenta, ve a Pendientes para ver qué pasó
- Actualiza manualmente después de completar tareas

#### 🌙 Fin del Día (6:00 PM)
- Verifica que todo esté en cero
- Si quedan pendientes, decide:
  - ¿Puedo resolverlos hoy? → Hazlo
  - ¿Son para mañana? → Déjalos
  - ¿Necesito ayuda? → Comunícalo

---

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Tienes 3 Pendientes
```
🟡 Fletes sin Gastos: 1
🟠 Cotizaciones por Vencer: 1
🔴 Comprobantes Faltantes: 1
```

**Plan de acción:**
1. Sube el comprobante (5 min) ← Más urgente
2. Llama al cliente de la cotización (10 min)
3. Registra gastos del flete (15 min)

**Tiempo total:** 30 minutos

---

### Ejemplo 2: Cotización Vencida
```
Folio: COT-00145
Cliente: Transportes ABC
Monto: $45,000 MXN
Estado: 🔴 Vencida hace 3 días
```

**¿Qué hacer?**
1. Llama al cliente HOY
2. Pregunta: "¿Qué decidieron sobre la cotización?"
3. Si acepta:
   - Ve a Cotizaciones → COT-00145
   - Haz clic en "Convertir a Flete"
4. Si rechaza:
   - Cambia estado a "Rechazada"
   - Pregunta por qué (para mejorar)

---

## ❓ Preguntas Frecuentes

### ¿El número en el menú se actualiza solo?
Sí, cada 5 minutos automáticamente.

### ¿Por qué no veo algunos fletes?
Solo muestra los 20 más antiguos por categoría. Si tienes más, resuélvelos y aparecerán los siguientes.

### ¿Qué pasa si marco un flete como completado sin gastos?
Aparecerá en "Fletes sin Gastos" hasta que registres al menos un gasto.

### ¿Puedo ignorar un pendiente?
Técnicamente sí, pero no es recomendable:
- Sin gastos = No sabes si ganaste o perdiste
- Sin comprobantes = Problemas con el SAT
- Sin seguimiento = Pierdes ventas

### ¿El sistema envía notificaciones?
Por ahora solo el número rojo en el menú. Próximamente:
- Notificaciones del navegador
- Email diario con resumen
- Alertas de tareas urgentes

---

## 🆘 Solución de Problemas

### No veo ningún pendiente pero sé que hay
1. Haz clic en "Actualizar"
2. Verifica que estés en la empresa correcta
3. Recarga la página (F5)

### El número en el menú no coincide con la página
1. Espera 30 segundos (puede haber delay)
2. Haz clic en "Actualizar"
3. Si persiste, recarga la página completa

### Un flete no aparece aunque no tiene gastos
Verifica el estado del flete:
- Solo muestra: EN_CURSO o COMPLETADO
- No muestra: PLANEADO, CANCELADO

---

## 📞 ¿Necesitas Ayuda?

Si tienes dudas o encuentras un error:
1. Revisa esta guía primero
2. Consulta la documentación técnica: `DASHBOARD_PENDIENTES.md`
3. Contacta al equipo de desarrollo

---

## ✅ Checklist Diario

Imprime esto y ponlo en tu escritorio:

```
[ ] Revisar pendientes al inicio del día
[ ] Priorizar tareas urgentes (rojas)
[ ] Subir comprobantes faltantes
[ ] Hacer seguimiento de cotizaciones
[ ] Registrar gastos de fletes completados
[ ] Verificar que todo esté en cero al final
```

---

**Última actualización:** 30 de Diciembre, 2024
**Versión:** 1.0
