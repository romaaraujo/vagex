const vagasComBr = require('./vagasComBr');
const solides = require('./solides');
const portalAbre = require('./portalabre');
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = "mongodb://admin:adminpassword@mongo:27017/vagas?authSource=admin";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true
    }
});

(async () => {
    try {
        while (true) {
            console.info("[INFO] Iniciando busca por requisições de busca");
            await client.connect();

            let request = await client.db("vagas").collection("searches").find({
                data: { $exists: false }
            }).sort({ $natural: -1 }).limit(1).toArray();

            if (request.length) {
                await execute();
            }

            await client.close();

            console.info("[INFO] Aguardando 1 minuto para próxima verificação");
            await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
        }
    } catch (error) {
        console.error(`[ERRO AI] ${error}`);
    } finally {
        await client.close();
    }
})();

let execute = (async () => {
    let vagas = [];
    let v1 = vagasComBr.scrap();
    let v2 = solides.scrap();
    let v3 = portalAbre.scrap();

    await Promise.all([v1, v2, v3]).then(values => {
        vagas.push(...values[0]);
        vagas.push(...values[1]);
        vagas.push(...values[2]);
    }).then(async () => {
        await client.db("vagas")
            .collection("vagas_scraping")
            .insertMany(vagas)
            .then(() => {
                console.info(`[INFO] ${vagas.length} vagas inseridas com sucesso`);
            })
    });

    await client.db("vagas").collection("searches").updateMany(
        { data: { $exists: false } },
        { $set: { data: new Date() } }
    );
});