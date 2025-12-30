import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  TruckIcon,
  DocumentTextIcon,
  UserGroupIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/solid';
import api from '../lib/api';

interface SearchResults {
  fletes: any[];
  cotizaciones: any[];
  clientes: any[];
  camiones: any[];
  choferes: any[];
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Atajo de teclado Ctrl+K o Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click fuera para cerrar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (type: string, id: number) => {
    const routes: Record<string, string> = {
      flete: '/fletes',
      cotizacion: '/cotizaciones',
      cliente: '/clientes',
      camion: '/camiones',
      chofer: '/choferes',
    };

    navigate(`${routes[type]}/${id}`);
    setIsOpen(false);
    setQuery('');
    setResults(null);
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return (
      results.fletes.length +
      results.cotizaciones.length +
      results.clientes.length +
      results.camiones.length +
      results.choferes.length
    );
  };

  return (
    <>
      {/* Botón de búsqueda */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">
          Ctrl K
        </kbd>
      </button>

      {/* Modal de búsqueda */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-20 px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            <div ref={searchRef} className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
              {/* Input de búsqueda */}
              <div className="flex items-center gap-3 p-4 border-b">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar fletes, cotizaciones, clientes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 text-lg outline-none"
                />
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <XMarkIcon className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Resultados */}
              <div className="max-h-96 overflow-y-auto p-4">
                {loading && (
                  <div className="text-center py-8 text-gray-500">Buscando...</div>
                )}

                {!loading && query.length > 0 && query.length < 2 && (
                  <div className="text-center py-8 text-gray-500">
                    Escribe al menos 2 caracteres
                  </div>
                )}

                {!loading && query.length >= 2 && getTotalResults() === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron resultados para "{query}"
                  </div>
                )}

                {/* Fletes */}
                {results && results.fletes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                      Fletes ({results.fletes.length})
                    </h3>
                    <div className="space-y-1">
                      {results.fletes.map((flete) => (
                        <button
                          key={flete.id}
                          onClick={() => handleResultClick('flete', flete.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{flete.folio}</div>
                          <div className="text-sm text-gray-600">
                            {flete.cliente.nombre} • {flete.origen} → {flete.destino}
                          </div>
                          <span className="text-xs text-gray-500">{flete.estado}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cotizaciones */}
                {results && results.cotizaciones.length > 0 && (
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <DocumentTextIcon className="w-5 h-5 text-green-600" />
                      Cotizaciones ({results.cotizaciones.length})
                    </h3>
                    <div className="space-y-1">
                      {results.cotizaciones.map((cot) => (
                        <button
                          key={cot.id}
                          onClick={() => handleResultClick('cotizacion', cot.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{cot.folio}</div>
                          <div className="text-sm text-gray-600">{cot.cliente.nombre}</div>
                          <span className="text-xs text-gray-500">{cot.estado}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clientes */}
                {results && results.clientes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <UsersIcon className="w-5 h-5 text-purple-600" />
                      Clientes ({results.clientes.length})
                    </h3>
                    <div className="space-y-1">
                      {results.clientes.map((cliente) => (
                        <button
                          key={cliente.id}
                          onClick={() => handleResultClick('cliente', cliente.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{cliente.nombre}</div>
                          <div className="text-sm text-gray-600">
                            {cliente.rfc} • {cliente.telefono}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Camiones */}
                {results && results.camiones.length > 0 && (
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <TruckIcon className="w-5 h-5 text-orange-600" />
                      Camiones ({results.camiones.length})
                    </h3>
                    <div className="space-y-1">
                      {results.camiones.map((camion) => (
                        <button
                          key={camion.id}
                          onClick={() => handleResultClick('camion', camion.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{camion.placas}</div>
                          <div className="text-sm text-gray-600">
                            {camion.marca} {camion.modelo} • #{camion.numeroEconomico}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Choferes */}
                {results && results.choferes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <UserGroupIcon className="w-5 h-5 text-indigo-600" />
                      Choferes ({results.choferes.length})
                    </h3>
                    <div className="space-y-1">
                      {results.choferes.map((chofer) => (
                        <button
                          key={chofer.id}
                          onClick={() => handleResultClick('chofer', chofer.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{chofer.nombre}</div>
                          <div className="text-sm text-gray-600">
                            {chofer.telefono} • Licencia: {chofer.licencia}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t p-3 text-xs text-gray-500 flex items-center justify-between">
                <span>Presiona ESC para cerrar</span>
                <span>{getTotalResults()} resultado{getTotalResults() !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
