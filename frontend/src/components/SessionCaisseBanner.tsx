import { Can } from './Can';
import { AlertBanner } from './AlertBanner';
import { AlertCircle, CheckCircle } from 'lucide-react';

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

interface SessionCaisseBannerProps {
  session: SessionCaisse | null;
  onOuvrirSession: () => void;
  onFermerSession: () => void;
}

export function SessionCaisseBanner({
  session,
  onOuvrirSession,
  onFermerSession
}: SessionCaisseBannerProps) {
  return (
    <Can permission="caisse.recevoir_fond">
      {session && session.statut === 'en_attente_caissier' && (
        <AlertBanner
          type="warning"
          icon={AlertCircle}
          title="Session en attente d'ouverture"
          message={
            <>
              Fond initial: <strong>{parseFloat(session.fond_initial.toString()).toFixed(2)}€</strong>
              {' '}- Trésorier: {session.tresorier_prenom} {session.tresorier_nom}
            </>
          }
          action={{
            label: 'Ouvrir la caisse',
            onClick: onOuvrirSession
          }}
        />
      )}

      {session && session.statut === 'ouverte' && (
        <AlertBanner
          type="success"
          icon={CheckCircle}
          title="Session active"
          message={
            <>
              Fond initial: <strong>{parseFloat(session.fond_initial.toString()).toFixed(2)}€</strong>
              {' '}- Ouverte le {new Date(session.ouverte_at!).toLocaleString('fr-FR')}
            </>
          }
          action={{
            label: 'Fermer la caisse',
            onClick: onFermerSession
          }}
        />
      )}

      {!session && (
        <AlertBanner
          type="info"
          icon={AlertCircle}
          title="Aucune session active"
          message="En attente qu'un trésorier vous attribue un fond de caisse"
        />
      )}
    </Can>
  );
}
