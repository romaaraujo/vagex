const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

async function scrap() {
    console.info("[INFO PORTAL ABRE] Iniciando a busca por vagas no site portalabre.com.br");

    const urlBase = "https://www.portalabre.com.br/Vagas.do?action=pesquisar";

    const axios = require('axios');

    const responseVagas = await axios.post('https://www.portalabre.com.br/Vagas.do?action=pesquisar', 'cdUf=PE&cdCidade=51136', {
        headers: {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
            'cookie': 'JSESSIONID=57D8A72C492394CAE518EEA3ECD7DD' + Math.random(0, 9) + 'F',
            'origin': 'https://www.portalabre.com.br',
            'pragma': 'no-cache',
            'priority': 'u=0, i',
            'referer': 'https://www.portalabre.com.br/Vagas.do?action=pesquisar',
            'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Linux"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
        },
        responseType: "arraybuffer",
    });

    if (responseVagas.status !== 200)
        throw new Error("[ERRO PORTAL ABRE] Erro ao carregar lista de vagas, status: " + responseVagas.status);

    const urlVagas = [];

    let $ = cheerio.load(
        iconv.decode(Buffer.from(responseVagas.data), "latin1"))
    let vagas = [];

    $('.panel-default').each((i, element) => {
        const title = $(element).find('.panel-heading .panel-title a').text().replace("Clique Aqui", "");

        if (title.includes("gio -")) {
            const city = $(element).find('.panel-body small.color-s.mr5').eq(0).text();
            const description = $(element).find('.panel-body small.color-s.mr5').eq(4).text().replace('DETALHES OPORTUNIDADE:', '');
            const id = $(element).find('.panel-body .pl2').find('a').eq(1).attr('href').split('=')[2];
            const link = $(element).find('.panel-body .pl2').find('a').eq(1).attr('href').split('.php?u=')[1];

            vagas.push({
                id: id,
                url: link,
                titulo: title,
                descricao: description,
                local: city,
                hierarquia: "Estagiário",
                regime: "Estágio",
            });
        }
    });

    return vagas;
}

module.exports = { scrap };