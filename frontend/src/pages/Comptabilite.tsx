import { OperationalPageLayout } from '../components/layouts/OperationalPageLayout';
import { FileText } from 'lucide-react';
import { UserInfo } from '../components/UserInfo';
import { AlertBanner } from '../components/AlertBanner';

export function ComptabilitePage() {
    return (
        <OperationalPageLayout
            pageTitle="COMPTABILITÉ"
            pageIcon={FileText}
            borderColor="indigo"
            backgroundColor="background"
            rightContent={<UserInfo />}
        >
            <div className="p-6">
                <AlertBanner
                    type="info"
                    message="L'espace comptabilité est en cours de construction. Revenez bientôt pour accéder aux rapports financiers."
                />
            </div>
        </OperationalPageLayout>
    );
}

