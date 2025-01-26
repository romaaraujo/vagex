const axios = require('axios');
const cheerio = require('cheerio');

async function scrap() {
    console.info("[INFO VagasComBr] Iniciando a busca por vagas no site vagas.com.br");

    const urlBase = "https://www.vagas.com.br";
    const responseVagas = await axios.get(`${urlBase}/vagas-de-?ordenar_por=mais_recentes`);
    if (responseVagas.status !== 200)
        throw new Error("[ERRO VagasComBr] Erro ao carregar lista de vagas, status: " + responseVagas.status);

    const urlVagas = [];
    let $ = cheerio.load(responseVagas.data);
    $('.link-detalhes-vaga').each((i, element) => {
        const link = $(element).attr('href');
        if (link)
            urlVagas.push(link);
    });

    if (urlVagas.length === 0)
        throw new Error("[ERRO VagasComBr] Nenhuma vaga encontrada");

    let vagas = [];

    for (const url of urlVagas) {
        const response = await axios.get(urlBase + url);
        if (response.status !== 200)
            throw new Error("[ERRO VagasComBr] Erro ao carregar a página, status: " + response.status);

        $ = cheerio.load(response.data);

        vagas.push({
            id: $('.job-breadcrumb__item--id').text().trim().replace("v", ""),
            url: urlBase + url,
            titulo: $('.job-shortdescription__title').text().trim(),
            descricao: $('.job-tab-content p').text().trim().replace(/\s+/g, ' '),
            local: $('.info-localizacao').text().trim(),
            empresa: $('.job-shortdescription__company').text().trim(),
            hierarquia: $('.job-hierarchylist__item').text().trim().replace(/\s+/g, ' '),
            salario: null,
            regime: $('.info-modelo-contratual').text().trim().replace("Regime ", ""),
        });
    };

    return vagas;
}

module.exports = { scrap };