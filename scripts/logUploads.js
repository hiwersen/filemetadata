const { MongoClient, GridFSBucket } = require('mongodb'); 
const dbUri = require('../index.js');

(async () => {
    const client = new MongoClient(dbUri);

    try {
        await  client.connect();
        const dbName = dbUri.split('/').pop().split('?')[0];
        const db = client.db(dbName);
        const bucket = new GridFSBucket(db, { bucketName: 'uploads' }); 

        try {
            const uploads = await bucket.find().toArray();

            for (const file of uploads) {
                console.log(file); 
            }
        } catch (error) {
            console.error(error);
        }
    } catch (error) {
        console.error(error);
    } finally {
        if (client) {
            await client.close();
        }
    }
})();
