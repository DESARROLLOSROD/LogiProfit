import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface SolicitudViaticoPDF {
    id: number
    flete: {
        folio: string
        cliente: { nombre: string }
    }
    operador: { nombre: string }
    periodoInicio: string
    periodoFin: string
    montoSolicitado: number
    detalle: {
        comidas?: number
        federales?: number
        taxi?: number
        casetas?: number
        telefono?: number
        pension?: number
        regaderas?: number
        diesel?: number
        conceptos?: Array<{ concepto: string; monto: number }> // Legacy support
    }
    createdAt: string
}

export const generarPDFSolicitudViatico = (solicitud: SolicitudViaticoPDF) => {
    const doc = new jsPDF()

    // Configuración de fuentes
    doc.setFont('helvetica')

    // Header Amarillo "NO BORRAR"
    doc.setFillColor(255, 255, 0) // Yellow
    doc.rect(14, 15, 182, 10, 'F')
    doc.setFontSize(12)
    doc.setTextColor(255, 0, 0) // Red
    doc.setFont('helvetica', 'bold')
    doc.text('NO BORRAR', 105, 21, { align: 'center' })

    // Título e info principal
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text('SOLICITUD DE VIÁTICOS', 105, 35, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const col1X = 14
    const col2X = 110
    let y = 45
    const lineHeight = 6

    doc.text(`Folio Flete: ${solicitud.flete.folio}`, col1X, y)
    doc.text(`Cliente: ${solicitud.flete.cliente.nombre}`, col2X, y)
    y += lineHeight
    doc.text(`Solicitante: ${solicitud.operador.nombre}`, col1X, y)
    doc.text(`Fecha Solicitud: ${new Date(solicitud.createdAt).toLocaleDateString('es-MX')}`, col2X, y)
    y += lineHeight
    doc.text(`Período: ${new Date(solicitud.periodoInicio).toLocaleDateString('es-MX')} al ${new Date(solicitud.periodoFin).toLocaleDateString('es-MX')}`, col1X, y)

    // Tabla de desglose
    // Mapear los campos fijos a la tabla
    const tableData: Array<[string, string]> = []

    const addRow = (label: string, value?: number) => {
        // Siempre mostrar las filas aunque sea 0, para que se parezca al formato fijo
        const monto = value || 0
        tableData.push([label, formatMoney(monto)])
    }

    // Si tiene la estructura nueva (campos fijos)
    if (solicitud.detalle.comidas !== undefined || solicitud.detalle.federales !== undefined) {
        addRow('COMIDAS', solicitud.detalle.comidas)
        addRow('FEDERALES', solicitud.detalle.federales)
        addRow('TAXI', solicitud.detalle.taxi)
        addRow('CASETAS', solicitud.detalle.casetas)
        addRow('TELEFONO', solicitud.detalle.telefono)
        addRow('PENSION', solicitud.detalle.pension)
        addRow('REGADERAS', solicitud.detalle.regaderas)
        addRow('DIESEL', solicitud.detalle.diesel)
    } else if (solicitud.detalle.conceptos) {
        // Fallback para solicitudes antiguas
        solicitud.detalle.conceptos.forEach(c => {
            tableData.push([c.concepto.toUpperCase(), formatMoney(c.monto)])
        })
    } else {
        // Fallback si detalle está vacío pero hay monto (casos raros)
        tableData.push(['VARIOS', formatMoney(solicitud.montoSolicitado)])
    }

    // Agregar totales
    tableData.push(['', '']) // Espacio
    tableData.push(['TOTAL SOLICITADO', formatMoney(solicitud.montoSolicitado)])

    autoTable(doc, {
        startY: y + 10,
        head: [['CONCEPTO', 'MONTO']],
        body: tableData,
        theme: 'plain', // Grid simple como Excel
        styles: {
            fontSize: 10,
            cellPadding: 4,
            textColor: 0,
        },
        headStyles: {
            fillColor: [255, 255, 0], // Yellow header
            textColor: [255, 0, 0], // Red text
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 40, halign: 'right' }
        },
        // Colorear el total
        didParseCell: (data) => {
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold'
            }
        }
    })

    // Footer con firmas
    const pageHeight = doc.internal.pageSize.height
    const firmaY = pageHeight - 40

    doc.setLineWidth(0.5)
    doc.line(30, firmaY, 90, firmaY)
    doc.line(120, firmaY, 180, firmaY)

    doc.setFontSize(8)
    doc.text('FIRMA SOLICITANTE', 60, firmaY + 5, { align: 'center' })
    doc.text('FIRMA AUTORIZACIÓN', 150, firmaY + 5, { align: 'center' })

    // Guardar PDF
    doc.save(`Solicitud_Viatico_${solicitud.id}_${solicitud.flete.folio}.pdf`)
}

const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amount)
}
