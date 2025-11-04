import { useAuthorization } from '../hooks/useAuthorization';
import { Can } from '../components/Can';

export function CaissePage() {
  const { can } = useAuthorization();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Caisse</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panneau d'encaissement */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Encaissement</h2>

            <div className="space-y-4">
              <Can permission="caisse.encaisser_especes">
                <button className="w-full mb-2 py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Encaisser en espèces
                </button>
              </Can>

              <Can permission="caisse.encaisser_cb">
                <button className="w-full mb-2 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Encaisser par CB
                </button>
              </Can>

              <Can permission="caisse.encaisser_cheque">
                <button className="w-full mb-2 py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Encaisser par chèque
                </button>
              </Can>
            </div>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Historique</h2>

            <Can permission="caisse.voir_historique">
              <div className="text-gray-600">
                <p>Historique des transactions...</p>
                {can('caisse.voir_historique_global') && (
                  <p className="text-sm text-blue-600 mt-2">
                    Vue globale activée (toutes les transactions)
                  </p>
                )}
              </div>
            </Can>
          </div>
        </div>

        <Can permission="caisse.annuler_vente">
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">
              Annulation de vente
            </h2>
            <button className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700">
              Annuler une transaction
            </button>
          </div>
        </Can>
      </div>
    </div>
  );
}
