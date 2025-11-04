export function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Administration</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Gestion des utilisateurs</h2>
            <p className="text-gray-600">
              Interface de gestion des utilisateurs et attribution des rôles
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Rôles et permissions</h2>
            <p className="text-gray-600">
              Configuration des rôles et permissions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Logs système</h2>
            <p className="text-gray-600">
              Consultation des logs d'activité
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            <p className="text-gray-600">
              Paramètres de l'application
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
