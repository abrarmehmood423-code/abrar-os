import LifeOS from "@/components/life-os";
import ModuleLauncher from "@/components/module-launcher";
import AccountShortcut from "@/components/account-shortcut";
import CloudSyncBridge from "@/components/cloud-sync-bridge";

export default function HomePage() {
  return (
    <>
      <CloudSyncBridge />
      <LifeOS />
      <AccountShortcut />
      <ModuleLauncher />
    </>
  );
}
