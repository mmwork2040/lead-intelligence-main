import { createContext, useContext, useState, ReactNode } from "react";

interface DemoContextType {
  isDemo: boolean;
  startDemo: () => void;
  exitDemo: () => void;
  demoUser: { id: string; email: string } | null;
  showDemoToast: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_KEY = "leads-intel-demo";

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(() => sessionStorage.getItem(DEMO_KEY) === "true");

  const demoUser = isDemo ? { id: "demo-user-id", email: "demo@leadsintel.com" } : null;

  const startDemo = () => {
    sessionStorage.setItem(DEMO_KEY, "true");
    setIsDemo(true);
  };

  const exitDemo = () => {
    sessionStorage.removeItem(DEMO_KEY);
    sessionStorage.removeItem("demo-tour-step");
    setIsDemo(false);
  };

  const showDemoToast = () => {
    import("sonner").then(({ toast }) => {
      toast.info("Funcionalidade disponível na versão completa", {
        description: "Crie sua conta gratuita para usar todos os recursos.",
        action: {
          label: "Criar Conta",
          onClick: () => {
            exitDemo();
            window.location.href = "/auth";
          },
        },
      });
    }).catch(() => {
      // Fallback silently if sonner fails to load
    });
  };

  return (
    <DemoContext.Provider value={{ isDemo, startDemo, exitDemo, demoUser, showDemoToast }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return context;
}

export function useIsDemo() {
  const { isDemo } = useDemo();
  return isDemo;
}
