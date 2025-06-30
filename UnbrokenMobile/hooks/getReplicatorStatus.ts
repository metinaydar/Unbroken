import { DatabaseService } from '@/services/database.service';

export async function getReplicatorStatus(databaseService: DatabaseService) {
    return await databaseService.getReplicatorStatus();
} 