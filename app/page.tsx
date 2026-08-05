import LifeOS from "@/components/life-os";
import ModuleLauncher from "@/components/module-launcher";
import AccountShortcut from "@/components/account-shortcut";

export default function HomePage() {
  return (
    <>
      <LifeOS />
      <AccountShortcut />
      <ModuleLauncher />
    </>
  );
}
