import React, {useState, ReactNode, useMemo, useEffect} from 'react';
import {DatabaseService} from "@/services/database.service";
import DatabaseContext from './DatabaseContext';
import { DatabaseContextType } from './DatabaseContextType';

type DatabaseProviderProps = {
    children: ReactNode;
}

const DatabaseProvider: React.FC<DatabaseProviderProps> = ({children}) => {
    const dbService = new DatabaseService();
    const [databaseService, setDatabaseService] = useState<DatabaseService>(dbService);
    const [databaseReady, setDatabaseReady] = useState(false);

    useEffect(() => {
        const initializeDatabase = async () => {
            await dbService.initializeDatabase();
            setDatabaseReady(true);
        };
        initializeDatabase().then().catch(e => console.error(e));
    }, [dbService]);

    const databaseServiceValue = useMemo<DatabaseContextType>(() => ({databaseService, setDatabaseService, databaseReady}), [databaseService, setDatabaseService, databaseReady]);
    return (
        <DatabaseContext.Provider value={databaseServiceValue}>
            {children}
        </DatabaseContext.Provider>
    );
};

export default DatabaseProvider;