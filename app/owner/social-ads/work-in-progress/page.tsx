import OwnerModuleClient from "../../OwnerModuleClient";
import AdWorkspaceClient from "./AdWorkspaceClient";

export default function AdWorkInProgressPage() {
  return <OwnerModuleClient
    title="Ad Work in Progress"
    description="A dedicated persistent workspace for the current WASCIK or affiliate ad. Your selected product or service, platform, direction, generated copy, and latest preview are saved while you work."
    currentPath="/owner/social-ads"
  >
    <AdWorkspaceClient />
  </OwnerModuleClient>;
}
