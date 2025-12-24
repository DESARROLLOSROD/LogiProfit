import * as XLSX from 'xlsx'

export const exportarCotizacionesAExcel = (cotizaciones: any[]) => {
  const datos = cotizaciones.map((cot) => ({
    Folio: cot.folio,
    Cliente: cot.cliente.nombre,
    Origen: cot.origen,
    Destino: cot.destino,
    'Precio Cotizado': cot.precioCotizado,
    'Utilidad Esperada': cot.utilidadEsperada,
    'Margen (%)': cot.margenEsperado.toFixed(1),
    Estado: cot.estado,
    Fecha: new Date(cot.createdAt).toLocaleDateString('es-MX'),
  }))

  const worksheet = XLSX.utils.json_to_sheet(datos)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cotizaciones')

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 15 }, // Folio
    { wch: 25 }, // Cliente
    { wch: 20 }, // Origen
    { wch: 20 }, // Destino
    { wch: 15 }, // Precio
    { wch: 15 }, // Utilidad
    { wch: 12 }, // Margen
    { wch: 15 }, // Estado
    { wch: 12 }, // Fecha
  ]
  worksheet['!cols'] = columnWidths

  XLSX.writeFile(workbook, `Cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportarFletesAExcel = (fletes: any[]) => {
  const datos = fletes.map((flete) => {
    const totalGastos = flete.gastos.reduce((sum: number, g: any) => sum + Number(g.monto), 0)
    const utilidad = Number(flete.precioCliente) - totalGastos

    return {
      Folio: flete.folio,
      Cliente: flete.cliente.nombre,
      Origen: flete.origen,
      Destino: flete.destino,
      'Precio Cliente': flete.precioCliente,
      'Total Gastos': totalGastos,
      Utilidad: utilidad,
      'Margen (%)': flete.precioCliente > 0 ? ((utilidad / flete.precioCliente) * 100).toFixed(1) : '0.0',
      Estado: flete.estado.replace('_', ' '),
      'Fecha Inicio': flete.fechaInicio ? new Date(flete.fechaInicio).toLocaleDateString('es-MX') : '-',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(datos)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fletes')

  const columnWidths = [
    { wch: 15 }, // Folio
    { wch: 25 }, // Cliente
    { wch: 20 }, // Origen
    { wch: 20 }, // Destino
    { wch: 15 }, // Precio
    { wch: 15 }, // Gastos
    { wch: 15 }, // Utilidad
    { wch: 12 }, // Margen
    { wch: 15 }, // Estado
    { wch: 12 }, // Fecha
  ]
  worksheet['!cols'] = columnWidths

  XLSX.writeFile(workbook, `Fletes_${new Date().toISOString().split('T')[0]}.xlsx`)
}

export const exportarDashboardAExcel = (data: any) => {
  // Hoja 1: Resumen
  const resumen = [
    { Métrica: 'Utilidad del Mes', Valor: data.resumen.utilidadMes },
    { Métrica: 'Ingresos del Mes', Valor: data.resumen.ingresosMes },
    { Métrica: 'Gastos del Mes', Valor: data.resumen.gastosMes },
    { Métrica: 'Margen Promedio (%)', Valor: data.resumen.margenPromedio.toFixed(1) },
    { Métrica: 'Total Fletes del Mes', Valor: data.resumen.totalFletesMes },
    { Métrica: 'Fletes Activos', Valor: data.resumen.fletesActivos },
    { Métrica: 'Fletes con Pérdida', Valor: data.resumen.fletesConPerdida },
  ]

  // Hoja 2: Tendencia Mensual
  const tendencia = data.tendenciaMensual.map((item: any) => ({
    Mes: `${item.mes}/${item.anio}`,
    Ingresos: item.ingresos,
    Gastos: item.gastos,
    Utilidad: item.utilidad,
    'Margen (%)': item.margen.toFixed(1),
  }))

  // Hoja 3: Top Clientes
  const topClientes = data.topClientes.map((cliente: any) => ({
    Cliente: cliente.nombre,
    Utilidad: cliente.utilidad,
    'Margen (%)': cliente.margen.toFixed(1),
    'Cantidad Fletes': cliente.cantidadFletes,
  }))

  const workbook = XLSX.utils.book_new()

  const wsResumen = XLSX.utils.json_to_sheet(resumen)
  const wsTendencia = XLSX.utils.json_to_sheet(tendencia)
  const wsTopClientes = XLSX.utils.json_to_sheet(topClientes)

  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen')
  XLSX.utils.book_append_sheet(workbook, wsTendencia, 'Tendencia Mensual')
  XLSX.utils.book_append_sheet(workbook, wsTopClientes, 'Top Clientes')

  XLSX.writeFile(workbook, `Dashboard_${new Date().toISOString().split('T')[0]}.xlsx`)
}
