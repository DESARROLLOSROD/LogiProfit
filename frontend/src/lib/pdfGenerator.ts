import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CotizacionPDF {
  folio: string
  cliente: { nombre: string; rfc?: string; email?: string }
  origen: string
  destino: string
  kmIda: number
  kmVuelta: number
  precioCotizado: number
  utilidadEsperada: number
  margenEsperado: number
  createdAt: string
  costoDieselIda?: number
  costoDieselVuelta?: number
  costoCasetas?: number
  costoViaticos?: number
  costoMantenimiento?: number
  costosIndirectos?: number
  costoAutoPiloto?: number
  costoTotal: number
  requiereAutoPiloto: boolean
}

export const generarPDFCotizacion = (cotizacion: CotizacionPDF) => {
  const doc = new jsPDF()

  // Configuración de fuentes
  doc.setFont('helvetica')

  // Header
  doc.setFontSize(20)
  doc.setTextColor(31, 41, 55) // gray-800
  doc.text('COTIZACIÓN', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(107, 114, 128) // gray-500
  doc.text(`Folio: ${cotizacion.folio}`, 105, 28, { align: 'center' })

  // Información del cliente
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text('Información del Cliente', 14, 45)

  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99) // gray-600
  doc.text(`Nombre: ${cotizacion.cliente.nombre}`, 14, 52)
  if (cotizacion.cliente.rfc) {
    doc.text(`RFC: ${cotizacion.cliente.rfc}`, 14, 58)
  }
  if (cotizacion.cliente.email) {
    doc.text(`Email: ${cotizacion.cliente.email}`, 14, 64)
  }

  // Detalles de la ruta
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text('Detalles de la Ruta', 14, 77)

  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  doc.text(`Origen: ${cotizacion.origen}`, 14, 84)
  doc.text(`Destino: ${cotizacion.destino}`, 14, 90)
  doc.text(`Distancia Ida: ${cotizacion.kmIda.toFixed(1)} km`, 14, 96)
  doc.text(`Distancia Vuelta: ${cotizacion.kmVuelta.toFixed(1)} km`, 14, 102)
  doc.text(`Distancia Total: ${(cotizacion.kmIda + cotizacion.kmVuelta).toFixed(1)} km`, 14, 108)

  if (cotizacion.requiereAutoPiloto) {
    doc.setTextColor(239, 68, 68) // red-500
    doc.text('⚠ Requiere Auto Piloto', 14, 114)
  }

  // Tabla de costos
  const startY = cotizacion.requiereAutoPiloto ? 125 : 120

  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text('Desglose de Costos', 14, startY)

  const tableData = []

  if (cotizacion.costoDieselIda) {
    tableData.push(['Diesel Ida', formatMoney(cotizacion.costoDieselIda)])
  }
  if (cotizacion.costoDieselVuelta) {
    tableData.push(['Diesel Vuelta', formatMoney(cotizacion.costoDieselVuelta)])
  }
  if (cotizacion.costoCasetas) {
    tableData.push(['Casetas', formatMoney(cotizacion.costoCasetas)])
  }
  if (cotizacion.costoViaticos) {
    tableData.push(['Viáticos', formatMoney(cotizacion.costoViaticos)])
  }
  if (cotizacion.costoMantenimiento) {
    tableData.push(['Mantenimiento (25%)', formatMoney(cotizacion.costoMantenimiento)])
  }
  if (cotizacion.costosIndirectos) {
    tableData.push(['Costos Indirectos (20%)', formatMoney(cotizacion.costosIndirectos)])
  }
  if (cotizacion.costoAutoPiloto) {
    tableData.push(['Auto Piloto', formatMoney(cotizacion.costoAutoPiloto)])
  }

  tableData.push(['COSTO TOTAL', formatMoney(cotizacion.costoTotal)])

  autoTable(doc, {
    startY: startY + 5,
    head: [['Concepto', 'Monto']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // primary-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [243, 244, 246], // gray-100
      textColor: [31, 41, 55],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: 'right' },
    },
  })

  // Resumen financiero
  const finalY = (doc as any).lastAutoTable.finalY + 15

  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55)
  doc.text('Resumen Financiero', 14, finalY)

  // Tabla de resumen
  const resumenData = [
    ['Costo Total', formatMoney(cotizacion.costoTotal)],
    ['Precio Cotizado', formatMoney(cotizacion.precioCotizado)],
    ['Utilidad Esperada', formatMoney(cotizacion.utilidadEsperada)],
    ['Margen Esperado', `${cotizacion.margenEsperado.toFixed(1)}%`],
  ]

  autoTable(doc, {
    startY: finalY + 5,
    body: resumenData,
    theme: 'plain',
    styles: {
      fontSize: 11,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold', textColor: [75, 85, 99] },
      1: { cellWidth: 60, halign: 'right', fontSize: 12, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Colorear utilidad según sea positiva o negativa
      if (data.row.index === 2 && data.column.index === 1) {
        if (cotizacion.utilidadEsperada >= 0) {
          data.cell.styles.textColor = [34, 197, 94] // green-500
        } else {
          data.cell.styles.textColor = [239, 68, 68] // red-500
        }
      }
      // Colorear margen según valor
      if (data.row.index === 3 && data.column.index === 1) {
        if (cotizacion.margenEsperado >= 20) {
          data.cell.styles.textColor = [34, 197, 94] // green-500
        } else if (cotizacion.margenEsperado >= 10) {
          data.cell.styles.textColor = [234, 179, 8] // yellow-500
        } else {
          data.cell.styles.textColor = [239, 68, 68] // red-500
        }
      }
    },
  })

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175) // gray-400
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  )

  // Guardar PDF
  doc.save(`Cotizacion_${cotizacion.folio}.pdf`)
}

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}
