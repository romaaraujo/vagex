const axios = require('axios');
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
            console.info("[INFO AI] Iniciando busca por requisições de classificação");
            await client.connect();

            let request = await client.db("vagas").collection("classifications").find({
                data: { $exists: false }
            }).sort({ $natural: -1 }).limit(1).toArray();

            if (request.length) {
                await execute();
            }

            await client.close();

            console.info("[INFO AI] Aguardando 1 minuto para próxima verificação");
            await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
        }
    } catch (error) {
        console.error(`[ERRO AI] ${error}`);
    } finally {
        await client.close();
    }
})();

let execute = (async () => {

    let vagas = await client.db("vagas")
        .collection("vagas_scraping")
        .find({ ia_categorias: null })
        .toArray();

    console.info(`[INFO AI] ${vagas.length} vagas encontradas e enviadas para processamento`);

    for (const vaga of vagas) {
        const dados = await classifyText(`${vaga.titulo} (${vaga.empresa}) - ${vaga.hierarquia} (${vaga.regime}) - ${vaga.descricao}`);
        vaga.ia_categorias = dados.length > 0 ? dados : [];
        await client.db("vagas")
            .collection("vagas_scraping")
            .updateOne(
                { _id: vaga._id },
                { $set: { ia_categorias: vaga.ia_categorias } }
            );

        if (dados.length === 0)
            console.info(`[INFO AI] Vaga ${vaga._id} não retornou categorias`);
        else
            console.info(`[INFO AI] Vaga ${vaga._id} categorizada com sucesso`);
    }

    await client.db("vagas").collection("classifications").updateMany(
        { data: { $exists: false } },
        { $set: { data: new Date() } }
    );

    console.info(`[INFO AI] ${vagas.length} vagas atualizadas com sucesso`);

});

const apiKey = 'AIzaSyBcwntHSnp2S2_QJanzIBxsSJmN3CGRZAY';
const url = `https://language.googleapis.com/v2/documents:classifyText?key=${apiKey}`;

async function classifyText(text) {
    try {
        const data = {
            document: {
                type: "PLAIN_TEXT",
                content: text,
                languageCode: "pt-BR"
            }
        };

        const response = await axios.post(url, data);
        return response.data.categories?.map((categoria) => ({
            nome: categoria.name,
            confianca: categoria.confidence,
            severidade: categoria.severity
        })) || [];
    } catch (error) {
        console.error(`[ERRO AI]: ${error}`);
        return [];
    }
}