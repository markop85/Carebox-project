const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');

const SEARCH_WORDS = ['Carebox', 'EmergingMed'];
const NUMBER_OF_RESULTS = 2;

/* self invoking functions - scraping google, writing to file, creating JSON file*/
(function googleScraping() {
    let result = {};
    Promise.all(
        SEARCH_WORDS.map(searchWord => {
            return scrapLink(searchWord,result);
        })
    )
    .then(() => {
        writeToFile(result); 
        return JSON.stringify(result); 
        }).catch(err => console.log(err));
})();

/* scraping google by search word using cheerio library*/
function scrapLink(searchWord,result) {
    return new Promise((resolve, reject) => {
        request(`https://www.google.com/search?q=${searchWord}`, (error, response, html) => {
            if (!error && response.statusCode === 200) {
                const $ = cheerio.load(html);
                let queryResults = [];
                $('.g').each((index, queryResult) => {
                    if (index === NUMBER_OF_RESULTS) return false;
                    queryResults.push(buildObj(queryResult, $));   
                })
                result[searchWord] = queryResults;
                resolve();
            } else {
                reject('error');
            }
        })
    })
}

/*return object from query result*/
function buildObj(queryResult, $) {
    return {
        title: $(queryResult).find('h3').text(),
        link: $(queryResult).find('cite').text(),
        description: $(queryResult).find('.st').text()
    };
}

/*write to csv file*/
function writeToFile(result) {
    const writeStream = fs.createWriteStream('result.csv');
    for (let key in result) {
        writeStream.write(`${key}: \n`);
        result[key].forEach((queryResult, index) => {
            writeStream.write(`${index + 1}.TITLE: ${queryResult.title}\nLINK: ${queryResult.link}\nDESCRIPTION: ${queryResult.description} \n\n`);
        });
        writeStream.write(`\n`);
    }
}