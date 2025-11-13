import { useState, useEffect } from 'react';
import { Can } from '../components/Can';
import { sessionsCaisseService, adminService } from '../services/api';
import { useAuth, usePermissions } from '@/hooks';
import {
  Plus, CheckCircle, XCircle, AlertTriangle, Users, Landmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { UserInfo } from '../components/UserInfo';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

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
  const [sessionsEnAttenteOuverture, setSessionsEnAttenteOuverture] = useState<SessionCaisse[]>([]);
  const [sessionsEnAttenteValidation, setSessionsEnAttenteValidation] = useState<SessionCaisse[]>([]);
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
    chargerSessions();
    chargerCaissiers();
  }, []);

  const chargerSessions = async () => {
    try {
      // Charger les sessions en attente d'ouverture
      const resultOuverture = await sessionsCaisseService.getAll({ statut: 'en_attente_caissier' });
      setSessionsEnAttenteOuverture(resultOuverture.sessions || []);

      // Charger les sessions en attente de validation
      const resultValidation = await sessionsCaisseService.getEnAttenteValidation();
      setSessionsEnAttenteValidation(resultValidation.sessions || []);
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
    }
  };

  const chargerCaissiers = async () => {
    try {
      const result = await adminService.getUsersByRole('CAISSIER');
      setCaissiers(result.users || []);
    } catch (err) {
      console.error('Erreur chargement caissiers:', err);
      toast.error('Erreur lors du chargement des caissiers');
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
      chargerSessions();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur création session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la création de la session');
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
      chargerSessions();
    } catch (err) {
      const error = err as ApiError;
      console.error('Erreur validation session:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la validation');
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
    <OperationalPageLayout
      pageTitle="TRÉSORERIE"
      pageIcon={Landmark}
      borderColor="purple"
      rightContent={
        <>
          <UserInfo />
          <Can permission="caisse.donner_fond_initial">
            <Button
              onClick={() => setShowCreerSession(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden lg:inline">Créer une session</span>
            </Button>
          </Can>
        </>
      }
    >
      <div className="space-y-6">
        {/* Sessions en attente d'ouverture */}
        <Can permission="caisse.donner_fond_initial">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              Sessions en attente d'ouverture ({sessionsEnAttenteOuverture.length})
            </h2>

            {sessionsEnAttenteOuverture.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune session en attente d'ouverture</p>
            ) : (
              <div className="space-y-4">
                {sessionsEnAttenteOuverture.map((session) => (
                  <div key={session.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
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
                        <p className="text-gray-600">Créée le:</p>
                        <p className="font-semibold">{new Date(session.creee_at).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                    {session.note_ouverture && (
                      <p className="mt-2 text-sm italic text-gray-600">Note: {session.note_ouverture}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Can>

        {/* Sessions en attente de validation */}
        <Can permission="caisse.valider_fermeture">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
              Sessions en attente de validation ({sessionsEnAttenteValidation.length})
            </h2>

            {sessionsEnAttenteValidation.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune session en attente de validation</p>
            ) : (
              <div className="space-y-4">
                {sessionsEnAttenteValidation.map((session) => {
                  const ecart = session.ecart ? parseFloat(session.ecart.toString()) : 0;
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
                              <p className="font-semibold">{session.solde_attendu ? parseFloat(session.solde_attendu.toString()).toFixed(2) : '-'}€</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Solde déclaré:</p>
                              <p className="font-semibold">{session.solde_declare ? parseFloat(session.solde_declare.toString()).toFixed(2) : '-'}€</p>
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
        <DialogContent className="bg-white dark:bg-slate-900 sm:max-w-[500px] border border-border">
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
        <DialogContent className="bg-white dark:bg-slate-900 sm:max-w-[550px] border border-border">
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
                  <p>Solde attendu: <span className="font-bold">{sessionAValider.solde_attendu ? parseFloat(sessionAValider.solde_attendu.toString()).toFixed(2) : '-'}€</span></p>
                  <p>Solde déclaré: <span className="font-bold">{sessionAValider.solde_declare ? parseFloat(sessionAValider.solde_declare.toString()).toFixed(2) : '-'}€</span></p>
                  {sessionAValider.ecart !== null && (() => {
                    const ecartValider = parseFloat(sessionAValider.ecart.toString());
                    return (
                      <p className={`font-bold text-lg mt-2 ${ecartValider === 0 ? 'text-green-600' :
                          ecartValider > 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                        Écart: {ecartValider > 0 ? '+' : ''}{ecartValider.toFixed(2)}€
                      </p>
                    );
                  })()}
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
    </OperationalPageLayout>
  );
}
