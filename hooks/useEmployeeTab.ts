  import { createContext, useContext } from "react";

export const EmployeeTabContext = createContext<{
  goTo: (index: number) => void;
}>({ goTo: () => {} });

export function useEmployeeTab() {
  return useContext(EmployeeTabContext);
}
