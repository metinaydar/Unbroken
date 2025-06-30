import { DatabaseService } from '@/services/database.service';

export async function getLogisticsBySearchTerm(
    databaseService: DatabaseService,
    searchRfid: string,
    searchShipmentId: string,
    status: string
) {
    return await databaseService.getLogisticsBySearchTerm(searchRfid, searchShipmentId, status);
}

export async function getLogisticsById(
    databaseService: DatabaseService,
    logisticsId: string
) {
    return await databaseService.showLogistics(logisticsId);
}

export async function updateLogisticsById(
    databaseService: DatabaseService,
    logisticsId: string,
    logisticsData: any
) {
    return await databaseService.updateLogistics(logisticsId, logisticsData);
}

export async function getDistinctStatuses(databaseService: DatabaseService) {
    return await databaseService.getDistinctStatuses();
}

export async function getDistinctOrigins(databaseService: DatabaseService) {
    return await databaseService.getDistinctOrigins();
}

export async function getDistinctDestinations(databaseService: DatabaseService) {
    return await databaseService.getDistinctDestinations();
}

export async function getDistinctHandlerRoles(databaseService: DatabaseService) {
    return await databaseService.getDistinctHandlerRoles();
}

export async function getDistinctHandoffPoints(databaseService: DatabaseService) {
    return await databaseService.getDistinctHandoffPoints();
}

export async function getDistinctPackageConditions(databaseService: DatabaseService) {
    return await databaseService.getDistinctPackageConditions();
}

export async function getDistinctShipmentIds(databaseService: DatabaseService) {
    return await databaseService.getDistinctShipmentIds();
}

export async function getDistinctRfids(databaseService: DatabaseService) {
    return await databaseService.getDistinctRfids();
} 