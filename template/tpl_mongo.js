module.exports = `/**
  Create By brainqi@outlook.com  2016-08-12 09:40:00

  MongoDB common operation utils:
  - Insert One Document.
  - Insert Many Documents.
  - Find Document.
  - Find Specified Document.
  - Find All Documents with a Query Filter and Return results with page info.
  - Find All Documents with a Query Filter and without page query.
  - Find All Specified Documents with a Query Filter and without page query.
  - Find Specified Documents with a Query Filter and page query.
  - Find Doc count.
  - Update One Document.
  - Update Many Documents.
  - FindAndModify Documents.
  - Remove One Document.
  - Remove Many Document.
*/
const config = require('../conf/config'),
    MongoClient = require('mongodb').MongoClient;
var db;

// MongoClient connection pooling.
MongoClient.connect(config.Mongo.url, (err, database) => {
    if (err) throw err;
    // Initialize connection once.
    db = database;
});

module.exports = {
    /**
     * Get Mongo Database Instance.
     */
    getDB: () => {
        return db;
    },
    /** 
     * Insert one document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} doc Inserted document.
     * @param {Function} callback callback(err,result).
    */
    insertDocument: (collectionName, doc, callback) => {
        var collection = db.collection(collectionName);
        doc.createAt = Date();
        collection.insertOne(doc, (err, result) => {
            callback(err, result);
        });
    },

    // ---------------------------------------------------------------------------
    /**
     * Insert many documents.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Array} docs Inserted documents.
     * @param {Function} callback callback(err,result).
     */
    insertDocuments: (collectionName, docs, callback) => {
        var collection = db.collection(collectionName);
        collection.insertMany(docs, (err, result) => {
            // console.log(result.result.n);   // result Contains the result document from MongoDB
            // console.log(result.ops.length); //ops Contains the documents inserted with added _id fields
            callback(err, result);
        });

    },

    // ---------------------------------------------------------------------------
    /**
     * Upsert document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} upsertDoc Upserted document.
     * @param {Function} callback callback(err,result).
     */
    upsertDocument: (collectionName, queryDoc, upsertDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.update(queryDoc, upsertDoc, { upsert: true }, (err, result) => {
            callback(err, result);
        });
    },

    /**
     * Find One Document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Function} callback callback(doc).
     */
    findDocument: (collectionName, queryDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.findOne(queryDoc).then((doc) => {
            callback(doc);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Function} callback callback(doc).
     */
    findSpecifiedDocument: (collectionName, queryDoc, specifiedDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.findOne(queryDoc, specifiedDoc).then((doc) => {
            callback(doc);
        });
    },

    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a Query Filter and Return results with page info.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Function} callback callback(results).
     */
    findDocuments: (collectionName, queryDoc, callback) => {
        queryDoc = queryDoc == null ? {} : queryDoc;
        var page = queryDoc.page == null ? 1 : parseInt(queryDoc.page);
        var size = queryDoc.size == null ? 20 : parseInt(queryDoc.size);
        size = size > 200 ? 200 : size; // API speed limit for 200 records/times
        var skip = (page - 1) * size;
        delete queryDoc.page;
        delete queryDoc.size;
        var collection = db.collection(collectionName);
        // desc by create time.
        collection.find(queryDoc)
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                collection.count(queryDoc,
                    (err, count) => {
                        var results = {};
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },

    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a Query Filter and without page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Function} callback callback(docs).
     */
    findAllDocuments: (collectionName, queryDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.find(queryDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Documents with a sorted document and a Query Filter and without page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} sortDoc Sort document.
     * @param {Function} callback callback(docs).
     */
    findAllDocumentsSorted: (collectionName, queryDoc, sortDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.find(queryDoc)
            .sort(sortDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Specified Documents with a Query Filter and without page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Function} callback callback(doc).
     */
    findAllSpecifiedDocuments: (collectionName, queryDoc, specifiedDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.find(queryDoc, specifiedDoc)
            .toArray((err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Documents with a Query Filter and page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Function} callback callback(doc).
     */
    findSpecifiedDocuments: (collectionName, queryDoc, specifiedDoc, callback) => {
        queryDoc = queryDoc == null ? {} : queryDoc;
        var page = queryDoc.page == null ? 1 : parseInt(queryDoc.page);
        var size = queryDoc.size == null ? 20 : parseInt(queryDoc.size);
        size = size > 200 ? 200 : size; // API speed limit for 200 records/times
        var skip = (page - 1) * size;
        delete queryDoc.page;
        delete queryDoc.size;
        var collection = db.collection(collectionName);
        collection.find(queryDoc, specifiedDoc)
            .sort({ createAt: -1 })
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                collection.count(queryDoc,
                    (err, count) => {
                        var results = {};
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Specified Sorted Documents with a Query Filter and page query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Object} sortDoc Sort document.
     * @param {Function} callback callback(results).
     */
    findSpecifiedSortedDocuments: (collectionName, queryDoc, specifiedDoc, sortDoc, callback) => {
        queryDoc = queryDoc == null ? {} : queryDoc;
        var page = queryDoc.page == null ? 1 : parseInt(queryDoc.page);
        var size = queryDoc.size == null ? 20 : parseInt(queryDoc.size);
        size = size > 200 ? 200 : size; // API speed limit for 200 records/times
        var skip = (page - 1) * size;
        delete queryDoc.page;
        delete queryDoc.size;
        var collection = db.collection(collectionName);

        collection.find(queryDoc, specifiedDoc)
            .sort(sortDoc)
            .skip(skip)
            .limit(size)
            .toArray(
            (err, docs) => {
                collection.count(queryDoc,
                    (err, count) => {
                        var results = {};
                        results.docs = docs;
                        results.count = count;
                        callback(results);
                    });
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find All Specified Sorted Documents without page Filter query.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} specifiedDoc Specified returned document. For example: {name: 1, passwd:0} name returned and passwd not.
     * @param {Object} sortDoc Sort document.
     * @param {Function} callback callback(docs).
     */
    findAllSpecifiedSortedDocuments: (collectionName, queryDoc, specifiedDoc, sortDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.find(queryDoc, specifiedDoc)
            .sort(sortDoc)
            .toArray(
            (err, docs) => {
                callback(docs);
            });
    },
    // ---------------------------------------------------------------------------
    /**
     * Find Doc count.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Function} callback callback(results).
     */
    findCount: (collectionName, queryDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.count(queryDoc, (err, count) => {
            callback(count);
        })
    },
    // ---------------------------------------------------------------------------
    /**
     * Update one document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} conditionDoc Update condition document.
     * @param {Object} sortDoc Sort document.
     * @param {Function} callback callback(err,result).
     */
    updateDocument: (collectionName, conditionDoc, updatedDoc, callback) => {
        var collection = db.collection(collectionName);
        var update_doc = null;
        delete updatedDoc._id; // don't update _id & createAt field.
        delete updatedDoc.createAt;
        if (updatedDoc.hasOwnProperty('$push') || updatedDoc.hasOwnProperty('$pull') || updatedDoc.hasOwnProperty('$unset')) {
            update_doc = updatedDoc;
        } else {
            updatedDoc.updateAt = Date();
            update_doc = { $set: updatedDoc };
        }
        collection.updateOne(conditionDoc, update_doc, (err, result) => {
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Update many documents.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} conditionDoc Update condition document.
     * @param {Object} updatedDoc Updated document.
     * @param {Function} callback callback(err,result).
     */
    updateDocuments: (collectionName, conditionDoc, updatedDoc, callback) => {
        updatedDoc.updateAt = new Date();
        var collection = db.collection(collectionName);
        delete updatedDoc._id; // don't update _id & createAt field.
        delete updatedDoc.createAt;
        collection.updateMany(conditionDoc, { $set: updatedDoc }, (err, result) => {
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * findAndModify requires a sort parameter. 
     * 
     * The {new: true} option will return the updated document when boolean true. 
     * If set to false, it will return the old document before update. 
     * 
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} queryDoc Query document.
     * @param {Object} sortDoc Sort document.
     * @param {Object} updateDoc Update document.
     * @param {Function} callback callback(err,result).
     */
    FindAndModifyDocument: (collectionName, queryDoc, sortDoc, updateDoc, callback) => {
        var collection = db.collection(collectionName);
        collection.findAndModify(queryDoc, sortDoc, updateDoc, { new: true }, (err, result) => {
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Remove one document.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} doc Remove document.
     * @param {Function} callback callback(err,result).
     */
    removeDocument: (collectionName, doc, callback) => {
        var collection = db.collection(collectionName);
        collection.deleteOne(doc, (err, result) => {
            callback(err, result);
        });
    },
    // ---------------------------------------------------------------------------
    /**
     * Remove Many documents.
     * 
     * @param {String} collectionName Mongodb collection name.
     * @param {Object} doc Remove document.
     * @param {Function} callback callback(err,result).
     */
    removeDocuments: (collectionName, doc, callback) => {
        var collection = db.collection(collectionName);
        collection.deleteMany(doc, (err, result) => {
            callback(err, result);
        });
    }
};
`