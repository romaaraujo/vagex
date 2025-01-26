const express = require('express');
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const uri = "mongodb+srv://romario:qypZsfQuoDCurCdl@cluster0.ywmvhsu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true
    }
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});

app.get('/jobs', async (req, res) => {
    await client.connect();
    let vagas = await client.db("vagas")
        .collection("vagas_scraping")
        .find({ ia_categorias: { $ne: null } })
        .toArray();

    let traducaoCategorias = require('./translate-categories.json');

    vagas = vagas.map((vaga) => {
        vaga.ia_categorias = vaga.ia_categorias.filter((categoria) => categoria.nome !== "/Jobs & Education/Jobs/Job Listings");
        vaga.tags = vaga.ia_categorias.map((categoria) =>
            traducaoCategorias[categoria.nome] ?? categoria.nome);
        return vaga;
    });

    res.send(vagas);
});

app.post('/jobs/search', async (req, res) => {
    await client.connect();
    await client.db("vagas").collection("searches").insertOne({});
    await client.close();
    return res.send({ message: "Search saved" });
});

app.post('/jobs/classify', async (req, res) => {
    await client.connect();
    await client.db("vagas").collection("classifications").insertOne({});
    await client.close();
    return res.send({ message: "Classification saved" });
});

app.get('/jobs/last-classification', async (req, res) => {
    await client.connect();
    const classifications = await client.db("vagas").collection("classifications").find().sort({ $natural: -1 }).limit(1).toArray();
    await client.close();
    return res.send(classifications);
});

app.get('/jobs/last-search', async (req, res) => {
    await client.connect();
    const searches = await client.db("vagas").collection("searches").find().sort({ $natural: -1 }).limit(1).toArray();
    await client.close();
    return res.send(searches);
});

const port = 4000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});