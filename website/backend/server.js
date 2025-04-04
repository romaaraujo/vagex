const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require('cors');
const uuid = require('uuid');

const app = express();
const uri = "mongodb://admin:adminpassword@mongo:27017/vagas?authSource=admin";
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
app.use(express.json());
app.use(cors());

app.get('/jobs', async (req, res) => {
    await client.connect();
    let vagas = await client.db("vagas")
        .collection("vagas_scraping")
        .find({ ia_categorias: { $ne: null }, "salario.max": { $ne: null } })
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

app.post('/auth', async (req, res) => {
    await client.connect();
    const { nome, senha } = req.body;
    let token = null;

    if (nome == "admin" && senha == "admin") {
        token = uuid.v4();
        await client.db("vagas").collection("tokens").insertOne({ token });
        await client.close();
        return res.send({ message: "Autenticação realizada", token });
    } else {
        await client.close();
        return res.status(401).send({ message: "Usuário ou senha inválidos" });
    }
});

app.post('/auth/validate', async (req, res) => {
    await client.connect();
    const { token } = req.body;
    const tokenDb = await client.db("vagas").collection("tokens").findOne({ token });
    await client.close();

    if (tokenDb) {
        return res.send({ message: "Token válido", token });
    } else {
        return res.status(401).send({ message: "Token inválido" });
    }
});

app.post('/jobs/report', async (req, res) => {
    await client.connect();
    const { jobId, observation } = req.body;

    const tokenDb = await client.db("vagas").collection("reports");
    tokenDb.insertOne({ jobId, observation });

    await client.close();

    return res.send({ message: "Reclamação enviada" });
});

app.get('/jobs/reports', async (req, res) => {
    await client.connect();

    const reports = await client.db("vagas").collection("reports").find().toArray();
    const jobs = await client.db("vagas").collection("vagas_scraping").find().toArray();
    reports.forEach((report) => {
        const job = jobs.find((job) => job._id.toString() == report.jobId);
        report.title = job?.titulo;
        report.jobId = job?._id;
    });

    await client.close();
    return res.send(reports);
});

app.delete('/jobs/reports/:id', async (req, res) => {
    await client.connect();
    const { id } = req.params;
    await client.db("vagas").collection("reports").deleteOne({ _id: new ObjectId(id) });
    await client.close();
    return res.send({ message: "Reclamação excluída" });
});

app.delete('/jobs/:id', async (req, res) => {
    await client.connect();
    const { id } = req.params;
    await client.db("vagas").collection("vagas_scraping").deleteOne({ _id: new ObjectId(id) });
    await client.db("vagas").collection("reports").deleteMany({ jobId: id });

    await client.close();
    return res.send({ message: "Vaga excluída" });
});



const port = 4000;
app.listen(port, () => {
    console.log(`Servidor Online ${port}`);
});