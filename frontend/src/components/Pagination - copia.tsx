interface PaginationProps {
  paginaActual: number
  totalPaginas: number
  totalItems: number
  itemsPorPagina: number
  onCambiarPagina: (pagina: number) => void
}

export default function Pagination({
  paginaActual,
  totalPaginas,
  totalItems,
  itemsPorPagina,
  onCambiarPagina,
}: PaginationProps) {
  if (totalPaginas <= 1) return null

  const indexInicio = (paginaActual - 1) * itemsPorPagina
  const indexFin = Math.min(indexInicio + itemsPorPagina, totalItems)

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-gray-600">
        Mostrando {indexInicio + 1} - {indexFin} de {totalItems} resultados
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onCambiarPagina(Math.max(1, paginaActual - 1))}
          disabled={paginaActual === 1}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
          <button
            key={pagina}
            onClick={() => onCambiarPagina(pagina)}
            className={`px-3 py-2 rounded-lg font-medium ${
              pagina === paginaActual
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {pagina}
          </button>
        ))}
        <button
          onClick={() => onCambiarPagina(Math.min(totalPaginas, paginaActual + 1))}
          disabled={paginaActual === totalPaginas}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
