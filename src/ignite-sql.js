const IgniteClient = require("apache-ignite-client");
const IgniteClientConfiguration = IgniteClient.IgniteClientConfiguration;
const CacheConfiguration = IgniteClient.CacheConfiguration;
const ObjectType = IgniteClient.ObjectType;
const CacheEntry = IgniteClient.CacheEntry;
const SqlFieldsQuery = IgniteClient.SqlFieldsQuery;

async function performSqlFieldsQuery(insertData) {
    const igniteClient = new IgniteClient();
    try {
        await igniteClient.connect(
            new IgniteClientConfiguration("127.0.0.1:10800")
        );
        const cache = await igniteClient.getOrCreateCache(
            "OglediCache",
            new CacheConfiguration().setSqlSchema("PUBLIC")
        );

        // create table using SqlFieldsQuery
        (
            await cache.query(
                new SqlFieldsQuery(
                    `CREATE TABLE IF NOT EXISTS OglediUporabnikov (
                        UserOgledID integer primary key,
                        KrajID integer,
                        KrajNaziv varchar,
                        PrireditevID integer,
                        PrireditevNaziv varchar,
                        PrireditevDatum varchar,
                        ZnamenitostID integer,
                        ZnamenitostNaziv varchar,
                        Timestamp varchar,
                        UserId integer
                    )`
                )
            )
        ).getAll();

        // insert data into the table
        const insertQuery = new SqlFieldsQuery(
            `INSERT INTO OglediUporabnikov (UserOgledID, KrajID, KrajNaziv, PrireditevID, PrireditevNaziv, PrireditevDatum, ZnamenitostID, ZnamenitostNaziv, Timestamp, UserId) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).setArgTypes(ObjectType.PRIMITIVE_TYPE.INTEGER);
        (
            await cache.query(
                insertQuery.setArgs(
                    Number(insertData.UserOgledID),
                    Number(insertData.KrajID),
                    insertData.KrajNaziv,
                    Number(insertData.PrireditevID),
                    insertData.PrireditevNaziv,
                    insertData.PrireditevDatum,
                    Number(insertData.ZnamenitostID),
                    insertData.ZnamenitostNaziv,
                    insertData.Timestamp,
                    Number(insertData.UserId)
                )
            )
        ).getAll();

        // obtain sql fields cursor
        const sqlFieldsCursor = await cache.query(
            new SqlFieldsQuery(
                `SELECT * from OglediUporabnikov WHERE UserOgledID=${insertData.UserOgledID}`
            ).setPageSize(1)
        );

        // iterate over elements returned by the query
        do {
            console.log(await sqlFieldsCursor.getValue());
        } while (sqlFieldsCursor.hasMore());

        // obtain sql fields cursor
        const sqlFieldsCursorCount = await cache.query(
            new SqlFieldsQuery(
                `SELECT Count(UserOgledID) from OglediUporabnikov`
            ).setPageSize(1)
        );

        // iterate over elements returned by the query
        do {
            console.log(await sqlFieldsCursorCount.getValue());
        } while (sqlFieldsCursorCount.hasMore());
    } catch (err) {
        console.log(err.message);
    } finally {
        igniteClient.disconnect();
    }
}

module.exports.performSqlFieldsQuery = performSqlFieldsQuery;
