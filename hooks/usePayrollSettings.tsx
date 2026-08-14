import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PAYROLL_KEY = "payroll_enabled";

interface PayrollContextValue {
  enabled: boolean;
  loaded: boolean;
  toggle: (value: boolean) => void;
}

const PayrollContext = createContext<PayrollContextValue>({
  enabled: false,
  loaded: false,
  toggle: () => {},
});

export function PayrollProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PAYROLL_KEY).then((val) => {
      setEnabled(val === "true");
      setLoaded(true);
    });
  }, []);

  const toggle = useCallback(async (value: boolean) => {
    setEnabled(value);
    await AsyncStorage.setItem(PAYROLL_KEY, String(value));
  }, []);

  return (
    <PayrollContext.Provider value={{ enabled, loaded, toggle }}>
      {children}
    </PayrollContext.Provider>
  );
}

export function usePayrollSettings() {
  return useContext(PayrollContext);
}
