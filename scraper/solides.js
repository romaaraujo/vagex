const axios = require('axios');

async function scrap() {
    console.info("[INFO SOLIDES] Iniciando a busca por vagas no site solides.com.br");

    const urlBase = "https://apigw.solides.com.br/jobs/v3/portal-vacancies-new?title=&locations=&take=200&page=1";
    const responseVagas = await axios.get(`${urlBase}`);

    if (responseVagas.status !== 200)
        throw new Error("[ERRO SOLIDES] Erro ao carregar lista de vagas, status: " + responseVagas.status);

    let vagas = [];
    responseVagas.data.data.data.forEach(vaga => {
        vagas.push({
            id: vaga.id.toString(),
            url: vaga.redirectLink,
            titulo: vaga.title,
            descricao: vaga.description.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, " "),
            local: vaga.city?.name + " - " + vaga.state?.code,
            empresa: vaga.companyName,
            hierarquia: vaga.seniority[0]?.name,
            salario: {
                min: vaga.salary?.initialRange,
                max: vaga.salary?.finalRange
            },
            regime: vaga.recruitmentContractType[0]?.name,
        });
    })

    return vagas;
}

module.exports = { scrap };