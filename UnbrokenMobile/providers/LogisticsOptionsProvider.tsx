import React, { createContext, useContext, useEffect, useState } from 'react';
import DatabaseContext from './DatabaseContext';

export type LogisticsOptions = {
  statuses: string[];
  handlerRoles: string[];
  handoffPoints: string[];
  packageConditions: string[];
  refresh: () => Promise<void>;
};

const LogisticsOptionsContext = createContext<LogisticsOptions>({
  statuses: [],
  handlerRoles: [],
  handoffPoints: [],
  packageConditions: [],
  refresh: async () => {},
});

export const LogisticsOptionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { databaseService, databaseReady } = useContext(DatabaseContext)!;
  const [statuses, setStatuses] = useState<string[]>([]);
  const [handlerRoles, setHandlerRoles] = useState<string[]>([]);
  const [handoffPoints, setHandoffPoints] = useState<string[]>([]);
  const [packageConditions, setPackageConditions] = useState<string[]>([]);

  const fetchOptions = async () => {
    if (!databaseService || !databaseReady) return;
    try {
      setStatuses(await databaseService.getDistinctStatuses());
      setHandlerRoles(await databaseService.getDistinctHandlerRoles());
      setHandoffPoints(await databaseService.getDistinctHandoffPoints());
      setPackageConditions(await databaseService.getDistinctPackageConditions());
    } catch (err) {
      // Optionally handle error
      setStatuses([]);
      setHandlerRoles([]);
      setHandoffPoints([]);
      setPackageConditions([]);
    }
  };

  useEffect(() => {
    if (databaseReady) {
      fetchOptions();
    }
  }, [databaseService, databaseReady]);

  return (
    <LogisticsOptionsContext.Provider
      value={{
        statuses,
        handlerRoles,
        handoffPoints,
        packageConditions,
        refresh: fetchOptions,
      }}
    >
      {children}
    </LogisticsOptionsContext.Provider>
  );
};

export default LogisticsOptionsContext; 