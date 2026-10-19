import { WizardProvider } from "@/components/WizardContext";
import Wizard from "@/components/Wizard";

export default function Home() {
  return (
    <WizardProvider>
      <Wizard />
    </WizardProvider>
  );
}
