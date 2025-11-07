import { useState, useEffect } from 'react';
import { Can } from '../components/Can';
import { sessionsCaisseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { Link } from 'react-router-dom';
import {
  Home, Plus, CheckCircle, XCircle, AlertTriangle, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface SessionCaisse {
  id: number;
  tresorier_id: number;
  caissier_id: number;
  creee_at: string;
  ouverte_at: string | null;
  fermee_at: string | null;
  validee_at: string | null;
  fond_initial: number;
  solde_attendu: number | null;
  solde_declare: number | null;
  solde_valide: number | null;
  ecart: number | null;
  statut: 'en_attente_caissier' | 'ouverte' | 'en_attente_validation' | 'validee' | 'anomalie';
  note_ouverture: string | null;
  note_fermeture: string | null;
  note_validation: string | null;
  tresorier_nom?: string;
  tresorier_prenom?: string;
  caissier_nom?: string;
  caissier_prenom?: string;
}

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

export function TresoreriePage() {
  const { user } = useAuth();
  const { roles } = usePermissions();

  const [showCreerSession, setShowCreerSession] = useState(false);
  const [showValiderSession, setShowValiderSession] = useState(false);
  const [sessionAValider, setSessionAValider] = useState<SessionCaisse | null>(null);
  const [sessionsEnAttente, setSessionsEnAttente] = useState<SessionCaisse[]>([]);
  const [loading, setLoading] = useState(false);

  // Form créer session
  const [caissiers, setCaissiers] = useState<User[]>([]);
  const [caissierSelectionne, setCaissierSelectionne] = useState<string>('');
  const [fondInitial, setFondInitial] = useState('');
  const [noteCreation, setNoteCreation] = useState('');

  // Form valider session
  const [soldeValide, setSoldeValide] = useState('');
  const [statutFinal, setStatutFinal] = useState<'validee' | 'anomalie'>('validee');
  const [noteValidation, setNoteValidation] = useState('');

  useEffect(() => {
    chargerSessionsEnAttente();
    chargerCaissiers();
  }, []);

  const chargerSessionsEnAttente = async () => {
    try {
      const result = await sessionsCaisseService.getEnAttenteValidation();
      setSessionsEnAttente(result.sessions);
    } catch (err) {
      console.error('Erreur chargement sessions en attente:', err);
    }
  };

  const chargerCaissiers = async () => {
    try {
      // TODO: créer un endpoint pour récupérer les utilisateurs avec le rôle caissier
      // Pour l'instant, on utilise un placeholder
      setCaissiers([]);
    } catch (err) {
      console.error('Erreur chargement caissiers:', err);
    }
  };

  const creerSession = async () => {
    if (!caissierSelectionne) {
      toast.error('Veuillez sélectionner un caissier');
      return;
    }

    const fond = parseFloat(fondInitial);
    if (!fond || fond <= 0) {
      toast.error('Le fond initial doit être supérieur à 0');
      return;
    }

    setLoading(true);

    try {
      await sessionsCaisseService.creer({
        caissier_id: parseInt(caissierSelectionne),
        fond_initial: fond,
        note_ouverture: noteCreation || undefined
      });

      toast.success('Session créée avec succès');
      setShowCreerSession(false);
      setCaissierSelectionne('');
      setFondInitial('');
      setNoteCreation('');
      chargerSessionsEnAttente();
    } catch (err: any) {
      console.error('Erreur création session:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la création de la session');
    } finally {
      setLoading(false);
    }
  };

  const validerSession = async () => {
    if (!sessionAValider) return;

    const solde = parseFloat(soldeValide);
    if (isNaN(solde) || solde < 0) {
      toast.error('Veuillez saisir le solde validé');
      return;
    }

    setLoading(true);

    try {
      await sessionsCaisseService.valider(
        sessionAValider.id,
        solde,
        statutFinal,
        noteValidation || undefined
      );

      toast.success('Session validée avec succès');
      setShowValiderSession(false);
      setSessionAValider(null);
      setSoldeValide('');
      setStatutFinal('validee');
      setNoteValidation('');
      chargerSessionsEnAttente();
    } catch (err: any) {
      console.error('Erreur validation session:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const ouvrirDialogValidation = (session: SessionCaisse) => {
    setSessionAValider(session);
    setSoldeValide(session.solde_declare?.toString() || '');
    setStatutFinal('validee');
    setNoteValidation('');
    setShowValiderSession(true);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente_caissier':
        return <Badge className="bg-yellow-500">En attente caissier</Badge>;
      case 'ouverte':
        return <Badge className="bg-green-500">Ouverte</Badge>;
      case 'en_attente_validation':
        return <Badge className="bg-blue-500">En attente validation</Badge>;
      case 'validee':
        return <Badge className="bg-green-600">Validée</Badge>;
      case 'anomalie':
        return <Badge className="bg-red-500">Anomalie</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b-2 border-purple-500">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-lg">Retour</span>
            </Link>
            <div className="h-8 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-purple-600">TRÉSORERIE</h1>
          </div>

          <div className="text-right">
            <div className="font-semibold">{user?.prenom} {user?.nom}</div>
            <div className="text-sm text-gray-600">{roles.join(', ')}</div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Actions trésorier */}
        <Can permission="caisse.donner_fond_initial">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Gestion des sessions de caisse
              </h2>
              <Button
                onClick={() => setShowCreerSession(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Créer une session
              </Button>
            </div>

            <p className="text-gray-600">
              Créez une nouvelle session en attribuant un fond de caisse initial à un caissier.
            </p>
          </div>
        </Can>

        {/* Sessions en attente de validation */}
        <Can permission="caisse.valider_fermeture">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
              Sessions en attente de validation ({sessionsEnAttente.length})
            </h2>

            {sessionsEnAttente.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune session en attente de validation</p>
            ) : (
              <div className="space-y-4">
                {sessionsEnAttente.map((session) => {
                  const ecart = session.ecart || 0;
                  const ecartClass = ecart === 0 ? 'text-green-600' : ecart > 0 ? 'text-blue-600' : 'text-red-600';

                  return (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">
                              Session #{session.id} - {session.caissier_prenom} {session.caissier_nom}
                            </h3>
                            {getStatutBadge(session.statut)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Fond initial:</p>
                              <p className="font-semibold">{parseFloat(session.fond_initial.toString()).toFixed(2)}€</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Solde attendu:</p>
                              <p className="font-semibold">{session.solde_attendu?.toFixed(2) || '-'}€</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Solde déclaré:</p>
                              <p className="font-semibold">{session.solde_declare?.toFixed(2) || '-'}€</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Écart:</p>
                              <p className={`font-bold text-lg ${ecartClass}`}>
                                {ecart > 0 ? '+' : ''}{ecart.toFixed(2)}€
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 text-sm text-gray-600">
                            <p>Ouverte le: {session.ouverte_at && new Date(session.ouverte_at).toLocaleString('fr-FR')}</p>
                            <p>Fermée le: {session.fermee_at && new Date(session.fermee_at).toLocaleString('fr-FR')}</p>
                            {session.note_fermeture && (
                              <p className="mt-2 italic">Note: {session.note_fermeture}</p>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={() => ouvrirDialogValidation(session)}
                          className="ml-4 bg-blue-600 hover:bg-blue-700"
                        >
                          Valider
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Can>
      </div>

      {/* Dialog créer session */}
      <Dialog open={showCreerSession} onOpenChange={setShowCreerSession}>
        <DialogContent className="bg-white sm:max-w-[500px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Créer une session de caisse</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="caissier-select">Caissier *</Label>
              <div>
                <Select value={caissierSelectionne} onValueChange={setCaissierSelectionne}>
                  <SelectTrigger id="caissier-select" className="w-full bg-white">
                    <SelectValue placeholder="Sélectionner un caissier" />
                  </SelectTrigger>
                  <SelectContent className="z-100 bg-white">
                    {caissiers.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.prenom} {c.nom}
                      </SelectItem>
                    ))}
                    {caissiers.length === 0 && (
                      <SelectItem value="placeholder" disabled>
                        Aucun caissier disponible
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500">
                Sélectionnez le caissier qui recevra le fond de caisse
              </p>
            </div>

            <div className="space-y-2">
              <Label>Fond initial *</Label>
              <Input
                type="number"
                step="0.01"
                value={fondInitial}
                onChange={(e) => setFondInitial(e.target.value)}
                placeholder="0.00"
                className="text-lg font-bold"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Montant en espèces que vous remettez au caissier
              </p>
            </div>

            <div className="space-y-2">
              <Label>Note (optionnel)</Label>
              <textarea
                value={noteCreation}
                onChange={(e) => setNoteCreation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Commentaires..."
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              onClick={() => {
                setShowCreerSession(false);
                setCaissierSelectionne('');
                setFondInitial('');
                setNoteCreation('');
              }}
              variant="outline"
            >
              Annuler
            </Button>
            <Button
              onClick={creerSession}
              disabled={loading || !caissierSelectionne || !fondInitial}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Création en cours...
                </>
              ) : (
                'Créer la session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog valider session */}
      <Dialog open={showValiderSession} onOpenChange={setShowValiderSession}>
        <DialogContent className="bg-white sm:max-w-[550px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Valider la session #{sessionAValider?.id}</DialogTitle>
          </DialogHeader>

          {sessionAValider && (
            <div className="space-y-5 py-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h4 className="font-semibold mb-3">Informations de la session</h4>
                <div className="text-sm space-y-2">
                  <p>Caissier: <span className="font-semibold">{sessionAValider.caissier_prenom} {sessionAValider.caissier_nom}</span></p>
                  <p>Fond initial: <span className="font-bold">{parseFloat(sessionAValider.fond_initial.toString()).toFixed(2)}€</span></p>
                  <p>Solde attendu: <span className="font-bold">{sessionAValider.solde_attendu?.toFixed(2) || '-'}€</span></p>
                  <p>Solde déclaré: <span className="font-bold">{sessionAValider.solde_declare?.toFixed(2) || '-'}€</span></p>
                  {sessionAValider.ecart !== null && (
                    <p className={`font-bold text-lg mt-2 ${
                      sessionAValider.ecart === 0 ? 'text-green-600' :
                      sessionAValider.ecart > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      Écart: {sessionAValider.ecart > 0 ? '+' : ''}{sessionAValider.ecart.toFixed(2)}€
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Solde validé (après recomptage) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={soldeValide}
                  onChange={(e) => setSoldeValide(e.target.value)}
                  placeholder="0.00"
                  className="text-lg font-bold"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Recomptez les espèces et confirmez le montant
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut-select">Statut final *</Label>
                <div>
                  <Select value={statutFinal} onValueChange={(v) => setStatutFinal(v as 'validee' | 'anomalie')}>
                    <SelectTrigger id="statut-select" className="w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-100 bg-white">
                      <SelectItem value="validee">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Validée (OK)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="anomalie">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Anomalie (Écart important)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Note de validation (optionnel)</Label>
                <textarea
                  value={noteValidation}
                  onChange={(e) => setNoteValidation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Commentaires sur la validation..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 gap-2">
            <Button
              onClick={() => {
                setShowValiderSession(false);
                setSessionAValider(null);
                setSoldeValide('');
                setStatutFinal('validee');
                setNoteValidation('');
              }}
              variant="outline"
            >
              Annuler
            </Button>
            <Button
              onClick={validerSession}
              disabled={loading || !soldeValide}
              className={statutFinal === 'validee' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Validation en cours...
                </>
              ) : (
                `Valider ${statutFinal === 'validee' ? '✓' : '⚠'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
