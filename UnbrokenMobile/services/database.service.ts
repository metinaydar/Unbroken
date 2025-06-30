import {
    BasicAuthenticator,
    CblReactNativeEngine,
    Collection,
    Database,
    DatabaseConfiguration,
    FileSystem,
    FullTextIndexItem,
    IndexBuilder,
    LogDomain,
    LogLevel,
    Replicator,
    ReplicatorConfiguration,
    URLEndpoint,
    ValueIndexItem,
    MutableDocument,
    ReplicatorStatus
} from 'cbl-reactnative';

/**
 * Service class for managing the database and its replication.
 */
export class DatabaseService {
    private database: Database | undefined;
    private replicator: Replicator | undefined;
    private engine: CblReactNativeEngine | undefined;

    constructor() {
        //must create a new engine to use the SDK in a React Native environment
        //this must only be done once for the entire app.  This will be implemented as singleton, so it's Ok here.
        this.engine = new CblReactNativeEngine();
    }

    /**
     * returns type of activities in the inventory.location collection
     */
    public async getActivities() {
        const queryStr = "SELECT DISTINCT activity FROM inventory.landmark as activity WHERE landmark.activity IS NOT MISSING";
        return this.database?.createQuery(queryStr).execute();
    }

    /**
     * Retrieves the collections from the database.
     *
     * This function fetches the logistics collection from the
     * `scp` scope of the database. If the collection is found, it
     * is added to an array and returned.
     *
     * @returns {Promise<Collection[]>} A promise that resolves to an array of `Collection` objects.
     * @throws Will throw an error if the database is not initialized.
     */
    private async getCollections(): Promise<Collection[]> {
        const collections: Collection[] = [];
        const logisticsCollection = await this.database?.collection('logistics', 'scp');
        if (logisticsCollection !== undefined) {
            collections.push(logisticsCollection);
        }
        return collections;
    }

    /**
     * returns an array of ResultSet objects for the hotels that match the Full Text Search term in the inventory.hotel collection
     * @param searchTerm
     */
    public async getHotelsBySearchTerm(searchTerm: string) {
        const queryStr = `SELECT * FROM inventory.hotel as hotel WHERE MATCH(idxTextSearch, '${searchTerm}')`;
        return this.database?.createQuery(queryStr).execute();
    }

    /**
     * returns all hotels in the inventory.hotel collection
     */
    public async getHotels() {
        try {
            const queryStr = "SELECT * FROM inventory.hotel as hotel";
            return this.database?.createQuery(queryStr).execute();
        } catch (error) {
            console.debug(`Error: ${error}`);
            throw error;
        }
    }

    /**
     * returns an array of ResultSet objects for the locations that match the search terms of searchName, searchLocation, and activityType in the inventory.location collection
     * @param searchName - string value to search in the name or title fields
     * @param searchLocation - string value to search in the address, city, state, or country fields
     * @param activityType - string value to filter for in the activity field
     */
    public async getLandmarkBySearchTerm(
        searchName: string,
        searchLocation: string,
        activityType: string) {

        /*
        for the first set we will allow for a search on the name, title, and content fields with the value being upper case or lower case by converting the search term to lower case and then searching for it in the lower case version of the fields
         */
        const nameLower = searchName.toLowerCase();
        let queryStr = `SELECT * FROM inventory.landmark as landmark WHERE `;
        let conditions: string[] = [];
        if (nameLower !== '') {
            conditions.push(`(LOWER(landmark.name) LIKE '%${nameLower}%' OR LOWER(landmark.title) LIKE '%${nameLower}%' OR LOWER(landmark.content) LIKE '%${nameLower}%')`);
        }

       /*
       for locations - the term must be the exact value and is case-sensitive to how it's stored in the database
        */
        if (searchLocation !== '') {
            conditions.push(`(landmark.address LIKE '%${searchLocation}%' OR landmark.city LIKE '%${searchLocation}%' OR landmark.state LIKE '%${searchLocation}%' OR landmark.country LIKE '%${searchLocation}%')`);
        }

        //we always filter by activity
        conditions.push(`landmark.activity = '${activityType}' ORDER BY landmark.name`);

        if (conditions.length > 1) {
            queryStr += conditions.join(' AND ');
        } else {
            queryStr += conditions.join();
        }
        return this.database?.createQuery(queryStr).execute();
    }

    /**
     * Returns a specific landmark by its ID from the inventory.landmark collection
     * @param landmarkId - string value representing the landmark ID
     */
    public async showLandmark(landmarkId: string) {
        try {
            const queryStr = `SELECT * FROM inventory.landmark as landmark WHERE landmark.id = ${landmarkId}`;
            const result = await this.database?.createQuery(queryStr).execute();
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.debug(`Error: ${error}`);
            throw error;
        }
    }

    /**
     * Updates a landmark record in the inventory.landmark collection
     * @param landmarkId - string value representing the landmark ID
     * @param landmarkData - object containing the updated landmark data
     */
    public async updateLandmark(landmarkId: string, landmarkData: any) {
        try {
            const landmarkCollection = await this.database?.collection('landmark', 'inventory');
            if (!landmarkCollection) {
                throw new Error('Landmark collection not found');
            }

            // First, get the existing document to get its document ID
            const queryStr = `SELECT META().id as docId, * FROM inventory.landmark as landmark WHERE landmark.id = ${landmarkId}`;
            const result = await this.database?.createQuery(queryStr).execute();
            
            if (!result || result.length === 0) {
                throw new Error('Landmark not found');
            }

            const docId = result[0].docId;
            const currentData = result[0].landmark;

            // Update the document with new data
            const updatedData = {
                ...currentData,
                ...landmarkData,
                id: parseInt(landmarkId) // Ensure ID remains as number
            };

            // Create a new mutable document with the updated data
            const mutableDoc = new MutableDocument(docId, null, updatedData);
            
            // Save the updated document using the collection's save method
            await landmarkCollection.save(mutableDoc);
            
            return true;
        } catch (error) {
            console.debug(`Error updating landmark: ${error}`);
            throw error;
        }
    }

    /**
     * Updates a logistics record in the scp.logistics collection
     * @param logisticsId - string value representing the logistics ID
     * @param logisticsData - object containing the updated logistics data
     */
    public async updateLogistics(logisticsId: string, logisticsData: any) {
        try {
            const logisticsCollection = await this.database?.collection('logistics', 'scp');
            if (!logisticsCollection) {
                throw new Error('Logistics collection not found');
            }

            // First, get the existing document to get its document ID
            const queryStr = `SELECT META().id as docId, * FROM scp.logistics as logistics WHERE logistics.item_id = '${logisticsId}'`;
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            
            if (!result || result.length === 0) {
                throw new Error('Logistics record not found');
            }

            const docId = result[0].docId;
            const currentData = result[0].logistics;

            // Get the existing document
            const existingDoc = await logisticsCollection.getDocument(docId);
            if (!existingDoc) {
                throw new Error('Existing document not found');
            }

            // Create a mutable copy of the existing document
            const mutableDoc = new MutableDocument(docId, undefined, existingDoc.getRevisionID(), existingDoc.getData());

            // Merge the new data, but do NOT overwrite item_id
            const updatedData = {
                ...currentData,
                ...logisticsData,
                item_id: currentData.item_id // Always preserve the original item_id
            };

            // Set the updated data
            mutableDoc.setData(updatedData);
            
            // Save the updated document
            await logisticsCollection.save(mutableDoc);
            
            console.log(`Successfully updated logistics record with ID: ${logisticsId}`);
            return true;
        } catch (error) {
            console.debug(`Error updating logistics: ${error}`);
            throw error;
        }
    }

    /**
     * Returns the current status of the replicator
     * @returns Promise<ReplicatorStatus | undefined>
     */
    public async getReplicatorStatus() {
        try {
            if (this.replicator) {
                return await this.replicator.getStatus();
            }
            return undefined;
        } catch (error) {
            console.debug(`Error getting replicator status: ${error}`);
            return undefined;
        }
    }

    /**
     * Initializes the database by setting up logging and configuring the database.
     * @public
     * @throws Will throw an error if the database initialization fails.
     */
    public async initializeDatabase() {
        try {
            //turned on database logging too verbose to see information in IDE
            await Database.setLogLevel(LogDomain.ALL, LogLevel.DEBUG);
            await this.setupDatabase();
            const path = await this.database?.getPath()
            console.debug(`Database Setup with path: ${path}`);
            await this.setupIndexes();
            if (this.replicator === undefined) {
                await this.setupReplicator();
            }
            await this.replicator?.start(true);
        } catch (error) {
            console.log(`Error: ${error}`);
            throw error;
        }
    }

    /**
     * Sets up the database with the necessary configurations and collections.
     * @private
     * @throws Will throw an error if the database setup fails.
     */
    private async setupDatabase() {
        /* **
        * Note about encryption: In a real-world app, the encryption key
        * should not be hardcoded like it is here.

        * One strategy is to auto generate a unique encryption key per
        * user on initial app load, then store it securely in the
        * device's keychain for later retrieval.
        * **/
        const fileSystem = new FileSystem();
        const directoryPath = await fileSystem.getDefaultPath();

        const dc = new DatabaseConfiguration();
        dc.setDirectory(directoryPath);
        dc.setEncryptionKey('8e31f8f6-60bd-482a-9c70-69855dd02c39');

        this.database = new Database('unbroken', dc);

        await this.database.open();
        const collections = await this.database.collections();
        //check to see if we are missing the travel sample collections, if so then create them
        if (collections.length === 1) {
            await this.database.createCollection('airline', 'inventory');
            await this.database.createCollection('airport', 'inventory');
            await this.database.createCollection('hotel', 'inventory');
            await this.database.createCollection('landmark', 'inventory');
            await this.database.createCollection('logistics', 'scp');
            await this.database.createCollection('route', 'inventory');
            await this.database.createCollection('users', 'tenant_agent_00')
            await this.database.createCollection('bookings', 'tenant_agent_00')
        }
    }

    /**
     * Sets up the indexes for the `hotel` collection in the database.
     *
     * This function creates the following indexes for the `hotel` collection:
     * - `idxTextSearch`: A full-text index on the `address`, `city`, `country`, and `description` fields.
     * - `idxVacancy`: A value index on the `vacancy` field.
     *
     * The full-text index (`idxTextSearch`) is configured to ignore accents.
     *
     * @private
     * @throws Will throw an error if the index creation fails.
     */
    private async setupHotelIndexes() {
        const hotelCollection = await this.database?.collection('hotel', 'inventory');
        //setup full text index for hotel collection
        const ipAddress = FullTextIndexItem.property("address");
        const ipCity = FullTextIndexItem.property("city");
        const ipCountry = FullTextIndexItem.property("country");
        const ipDescription = FullTextIndexItem.property("description");
        const idxFullTextSearch = IndexBuilder.fullTextIndex(ipAddress, ipCity, ipCountry, ipDescription).setIgnoreAccents(true);

        await hotelCollection?.createIndex("idxTextSearch", idxFullTextSearch);

        //setup index to filter hotels by vacancy
        const vacancyValueIndex = IndexBuilder.valueIndex(
            ValueIndexItem.property('vacancy'),
        );
        await hotelCollection?.createIndex('idxVacancy', vacancyValueIndex);
    }

    /**
     * Sets up the indexes for the `hotel` and `landmark` collections in the database.
     *
     * This function calls the `setupHotelIndexes` and `setupLandmarkIndexes` methods
     * to create the necessary indexes for the `hotel` and `landmark` collections.
     *
     * @private
     * @throws Will throw an error if the database is not initialized.
     */
    private async setupIndexes() {
        if (this.database !== undefined) {
            await this.setupHotelIndexes();
            await this.setupLandmarkIndexes();
            await this.setupLogisticsIndexes();
        }
    }

    /**
     * Sets up the indexes for the `landmark` collection in the database.
     *
     * This function creates the following indexes for the `landmark` collection:
     * - `idxLandmarkActivity`: A value index on the `activity` and `name` fields to ensure only valid activities with names are indexed.
     * - `idxLandmarkTextSearch`: A value index on the `title`, `name`, `address`, `city`, `state`, `country`, and `activity` fields for text search.
     *
     * @private
     * @throws Will throw an error if the index creation fails.
     */
    private async setupLandmarkIndexes() {
        const landmarkCollection = await this.database?.collection('landmark', 'inventory');
        /*
        setup landmark activity index - we need to make sure we only grab activities that have names because the dataset is not clean and has some rubbish in it
         */
        const activityValueIndex = IndexBuilder.valueIndex(
            ValueIndexItem.property('activity'),
            ValueIndexItem.property('name'),
        );
        await landmarkCollection?.createIndex('idxLandmarkActivity', activityValueIndex);

        //standard indexed fields for text search
        const idxLandmarkTextSearch = IndexBuilder.valueIndex(
            ValueIndexItem.property('title'),
            ValueIndexItem.property('name'),
            ValueIndexItem.property('address'),
            ValueIndexItem.property('city'),
            ValueIndexItem.property('state'),
            ValueIndexItem.property('country'),
            ValueIndexItem.property('activity'),
        );
        await landmarkCollection?.createIndex('idxLandmarkTextSearch', idxLandmarkTextSearch);
    }

    /**
     * Sets up the indexes for the `logistics` collection in the database.
     *
     * This function creates the following indexes for the `logistics` collection:
     * - `idxLogisticsStatus`: A value index on the `status` and `rfid` fields to ensure only valid statuses with rfids are indexed.
     * - `idxLogisticsTextSearch`: A value index on the `rfid`, `shipment_id`, `origin`, `destination`, and `status` fields for text search.
     *
     * @private
     * @throws Will throw an error if the index creation fails.
     */
    private async setupLogisticsIndexes() {
        const logisticsCollection = await this.database?.collection('logistics', 'scp');
        /*
        setup logistics status index - we need to make sure we only grab statuses that have rfids because the dataset is not clean and has some rubbish in it
         */
        const statusValueIndex = IndexBuilder.valueIndex(
            ValueIndexItem.property('status'),
            ValueIndexItem.property('shipment_id'),
            ValueIndexItem.property('rfid'),
        );
        await logisticsCollection?.createIndex('idxLogisticsStatus', statusValueIndex);

        //standard indexed fields for text search
        const idxLogisticsTextSearch = IndexBuilder.valueIndex(
            ValueIndexItem.property('status'),
            ValueIndexItem.property('shipment_id'),
            ValueIndexItem.property('rfid'),
            ValueIndexItem.property('destination'),
            ValueIndexItem.property('handler_role'),
            ValueIndexItem.property('handoff_point'),
            ValueIndexItem.property('item_id'),
            ValueIndexItem.property('origin'),
            ValueIndexItem.property('package_condition'),
            ValueIndexItem.property('timestamp'),
        );
        await logisticsCollection?.createIndex('idxLogisticsTextSearch', idxLogisticsTextSearch);
    }

    /**
     * Sets up the replicator for the database.
     *
     * This function configures the replicator to synchronize the local database with a remote
     * Couchbase Sync Gateway or Capella App Service endpoint. It retrieves the collections
     * from the database and sets up the replicator with the specified target URL and authentication.
     *
     * The replicator is configured to run continuously and accept only self-signed certificates.
     *
     * @private
     * @throws Will throw an error if no collections are found to set the replicator to.
     */
    private async setupReplicator() {
        const collections = await this.getCollections();
        if (collections.length > 0) {

            //****************************************************************
            //YOU MUST CHANGE THIS TO YOUR LOCAL IP ADDRESS OR TO YOUR CAPELLA CONNECTION STRING
            //****************************************************************
            const targetUrl = new URLEndpoint('wss://xyz.cloud.couchbase.com:4984');

            //****************************************************************
            //YOU MUST CREATE THIS USER IN YOUR SYNC GATEWAY CONFIGURATION OR CAPPELLA APP SERVICE ENDPOINT
            //****************************************************************
            const auth = new BasicAuthenticator('user', 'pass');

            const config = new ReplicatorConfiguration(targetUrl);
            config.addCollections(collections);
            config.setAuthenticator(auth);
            config.setContinuous(true);
            config.setAcceptOnlySelfSignedCerts(false);
            this.replicator = await Replicator.create(config);
        } else {
            throw new Error('No collections found to set replicator to');
        }
    }

    /**
     * Returns an array of ResultSet objects for the logistics that match the search terms of searchRfid, searchShipmentId, and status in the scp.logistics collection
     * @param searchRfid - string value to search in the rfid field
     * @param searchShipmentId - string value to search in the shipment_id field
     * @param status - string value to filter for in the status field
     */
    public async getLogisticsBySearchTerm(
        searchRfid: string,
        searchShipmentId: string,
        status: string) {

        let queryStr = `SELECT * FROM scp.logistics WHERE `;
        let conditions: string[] = [];

        if (searchRfid !== '') {
            conditions.push(`logistics.rfid LIKE '%${searchRfid}%'`);
        }

        if (searchShipmentId !== '') {
            conditions.push(`logistics.shipment_id LIKE '%${searchShipmentId}%'`);
        }

        if (status !== '') {
            conditions.push(`logistics.status = '${status}'`);
        }
        //we always filter by status
        

        if (conditions.length > 1) {
            queryStr += conditions.join(' AND ');
        } else {
            queryStr += conditions.join();
        }
        
        console.log(`SQL Query: ${queryStr}`);
        return this.database?.createQuery(queryStr).execute();
    }

    /**
     * Returns a specific logistics record by its ID from the scp.logistics collection
     * @param logisticsId - string value representing the logistics ID
     */
    public async showLogistics(logisticsId: string) {
        try {
            const queryStr = `SELECT * FROM scp.logistics WHERE logistics.item_id = '${logisticsId}'`;
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.debug(`Error: ${error}`);
            throw error;
        }
    }

    /**
     * Returns distinct status values from the scp.logistics collection
     */
    public async getDistinctStatuses() {
        try {
            const queryStr = "SELECT DISTINCT logistics.status FROM scp.logistics WHERE logistics.status IS NOT MISSING ORDER BY logistics.status";
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result?.map(item => item.status) || [];
        } catch (error) {
            console.debug(`Error getting distinct statuses: ${error}`);
            throw error;
        }
    }

    /**
     * Returns distinct origin values from the scp.logistics collection
     */
    public async getDistinctOrigins() {
        try {
            const queryStr = "SELECT DISTINCT logistics.origin FROM scp.logistics WHERE logistics.origin IS NOT MISSING ORDER BY logistics.origin";
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result?.map(item => item.origin) || [];
        } catch (error) {
            console.debug(`Error getting distinct origins: ${error}`);
            throw error;
        }
    }

    /**
     * Returns distinct destination values from the scp.logistics collection
     */
    public async getDistinctDestinations() {
        try {
            const queryStr = "SELECT DISTINCT logistics.destination FROM scp.logistics WHERE logistics.destination IS NOT MISSING ORDER BY logistics.destination";
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result?.map(item => item.destination) || [];
        } catch (error) {
            console.debug(`Error getting distinct destinations: ${error}`);
            throw error;
        }
    }

    /**
     * Returns distinct handler role values from the scp.logistics collection
     */
    public async getDistinctHandlerRoles() {
        try {
            const queryStr = "SELECT DISTINCT logistics.handler_role FROM scp.logistics WHERE logistics.handler_role IS NOT MISSING ORDER BY logistics.handler_role";
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result?.map(item => item.handler_role) || [];
        } catch (error) {
            console.debug(`Error getting distinct handler roles: ${error}`);
            throw error;
        }
    }

    /**
     * Returns distinct handoff point values from the scp.logistics collection
     */
    public async getDistinctHandoffPoints() {
        try {
            const queryStr = "SELECT DISTINCT logistics.handoff_point FROM scp.logistics WHERE logistics.handoff_point IS NOT MISSING ORDER BY logistics.handoff_point";
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result?.map(item => item.handoff_point) || [];
        } catch (error) {
            console.debug(`Error getting distinct handoff points: ${error}`);
            throw error;
        }
    }

    /**
     * Returns distinct package condition values from the scp.logistics collection
     */
    public async getDistinctPackageConditions() {
        try {
            const queryStr = "SELECT DISTINCT logistics.package_condition FROM scp.logistics WHERE logistics.package_condition IS NOT MISSING ORDER BY logistics.package_condition";
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result?.map(item => item.package_condition) || [];
        } catch (error) {
            console.debug(`Error getting distinct package conditions: ${error}`);
            throw error;
        }
    }

    /**
     * Returns distinct shipment ID values from the scp.logistics collection
     */
    public async getDistinctShipmentIds() {
        try {
            const queryStr = "SELECT DISTINCT logistics.shipment_id FROM scp.logistics WHERE logistics.shipment_id IS NOT MISSING ORDER BY logistics.shipment_id";
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result?.map(item => item.shipment_id) || [];
        } catch (error) {
            console.debug(`Error getting distinct shipment IDs: ${error}`);
            throw error;
        }
    }

    /**
     * Returns distinct RFID values from the scp.logistics collection
     */
    public async getDistinctRfids() {
        try {
            const queryStr = "SELECT DISTINCT logistics.rfid FROM scp.logistics WHERE logistics.rfid IS NOT MISSING ORDER BY logistics.rfid";
            console.log(`SQL Query: ${queryStr}`);
            const result = await this.database?.createQuery(queryStr).execute();
            return result?.map(item => item.rfid) || [];
        } catch (error) {
            console.debug(`Error getting distinct RFIDs: ${error}`);
            throw error;
        }
    }
}