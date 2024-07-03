const { readExcelFile } = require('./data');
const puppeteer = require('puppeteer-extra');
const ExcelJS = require('exceljs');
const fs = require('fs');
const KTYPES = readExcelFile('./ktypes.xlsx');


function normalizeEngineParams(params, zyl) {
    let cm3, normalizedZyl, kw, ps;
    try {
        cm3 = params.split(',')[0].replace('cm', 'm3').trim().replace(' ', '');
        normalizedZyl = `${zyl} Zyl.`;
        kw = params.split(',')[1].replace('K', 'k').trim().replace(' ', '');
        ps = params.split(',')[2].trim().replace(' ', '');

        return `${cm3}, ${normalizedZyl}, ${kw}/${ps}`;
    } catch (err) {
        cm3 = params.split(',')[0].replace('cm', 'm3').trim().replace(' ', '');
        normalizedZyl = `${zyl} Zyl.`;
        kw = params.split(',')[1].replace('K', 'k').trim().replace(' ', '');
        return `${normalizedZyl}, ${kw}/${ps}`
    }
}

function getPartBeforeParenthesis(str) {
    const match = str.split('(');
    return match ? match[0].trim() : "";
}

const KTYPESMAP = new Map();
KTYPES.forEach((entry) => {
    const key = `${entry['Marke_Make_EN'].toUpperCase()} ${entry['Modell_Model_EN']} ${normalizeEngineParams(entry['Motor_Engine_EN'], entry['Anzahl der Baujahre'])}`;
    KTYPESMAP.set(key, entry['K-Type'])
});



const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());


const returnValid = (data, isArray) => {
    if (!data || data?.length === 0) {
        if (isArray) {
            return ['-']
        }
        return '-'
    }

    return data;
}

const importDataToExcel = async (data, filePath) => {
    let workbook;
    let worksheet;
    let worksheet2;
    let worksheet3;

    if (fs.existsSync(filePath)) {
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet('Products');
        worksheet2 = workbook.getWorksheet('ExtraSheet_2');
        worksheet3 = workbook.getWorksheet('ExtraSheet_3');
    } else {
        workbook = new ExcelJS.Workbook();
        worksheet = workbook.addWorksheet('Products');
        worksheet2 = workbook.addWorksheet('ExtraSheet_2');
        worksheet3 = workbook.addWorksheet('ExtraSheet_3');
        const row = worksheet.addRow([
            'product_ean',
            'product_sku',
            'product_manufacturer_name',
            'Product Name',
            'Beschreibung',
            'OENummer Hersteller',
            'K-Types',
            'Document Links'
        ]);

        const row2 = worksheet2.addRow([
            'product_ean',
            'product_sku',
            'product_manufacturer_name',
            'Product Name',
            'Beschreibung'
        ]);

        const row3 = worksheet3.addRow([
            'product_ean',
            'product_sku',
            'product_manufacturer_name',
            'Product Name',
            'OENummer Hersteller'
        ]);

        row.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
        row2.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
        row3.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
    }

    worksheet.addRow([
        returnValid(data.product_ean),
        returnValid(data.product_sku),
        returnValid(data.product_manufacturer_name),
        returnValid(data.productName),
        returnValid(data.joinedDetailContent),
        returnValid(data.joinedBoxRefNums),
        returnValid(data.ktypes),
        returnValid(data.pdfLinks)
    ]);


    returnValid(data.splittedDetailContent, true).forEach((sdc) => {
        worksheet2.addRow([
            returnValid(data.product_ean),
            returnValid(data.product_sku),
            returnValid(data.product_manufacturer_name),
            returnValid(data.productName),
            sdc
        ]);
    });

    returnValid(data.joinedBoxRefNums).split(',').forEach((brn) => {
        worksheet3.addRow([
            returnValid(data.product_ean),
            returnValid(data.product_sku),
            returnValid(data.product_manufacturer_name),
            returnValid(data.productName),
            brn
        ]);
    });

    await workbook.xlsx.writeFile(filePath);

}


const checkForNothingFound = async (page) => {
    try {
        await page.waitForSelector('.nothingFound', { timeout: 1000 });
        return true;
    } catch (error) {
        return false;
    }
}


const scrapeProductDetail = async (page) => {

    const isNothingFound = await checkForNothingFound(page);
    if (isNothingFound) return;

    try {
        await page.waitForSelector('.art-name .anchor');


        await page.evaluate(() => {
            const element = document.querySelectorAll('.art-name span.ml.anchor.underline')[0];
            if (element) {
                const event = new MouseEvent('mouseover', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(event);
            }
        });




        const detailUrl = await page.evaluate(() => {
            return document.querySelectorAll('.art-name a.anchor.underline')[0]?.href;
        });


        await page.goto(detailUrl);
        await page.waitForSelector('.art-name');

        const productDetails = await page.evaluate(() => {
            const productName = document.querySelector('.art-name span.ml.anchor')?.textContent.trim();
            const detailContent = document.querySelector('.art-articleCriteria')?.textContent.trim();
            const pdfLinks = [...document.querySelectorAll('.pdfLink')].map(pdf => pdf?.href)?.join(' , ');

            const boxRefNumbers = [];

            const boxRefNmbrBtn = document.querySelector('div[data-content-id="artInfoBoxRefNbrs"]');

            if (boxRefNmbrBtn) {
                boxRefNmbrBtn.click();
                const table = document.querySelector('table.custArea');
                const trs = [...table.querySelectorAll('tr')];
                trs.slice(1).map((tr) => {
                    const td1 = tr.querySelectorAll('td')[0]?.textContent.trim();
                    const td2 = tr.querySelectorAll('td')[1]?.textContent.trim();
                    boxRefNumbers.push(`${td1} ${td2}`);
                });
            }

            const joinedBoxRefNums = boxRefNumbers.join(', ')
            const splittedDetailContent = detailContent?.split('\n');
            const joinedDetailContent = splittedDetailContent?.join('; ');
            return {
                productName,
                pdfLinks,
                splittedDetailContent,
                joinedDetailContent,
                joinedBoxRefNums
            }
        });



        let isArtInfoFound = await page.evaluate(() => {
            const artInfoBoxBtn = document.querySelector('div[data-content-id="artInfoBoxTypes"]');
            if (artInfoBoxBtn) {
                artInfoBoxBtn.click();
                return true;
            }
            return false;
        });

        const kTypesFromScrapedProds = [];


        if (isArtInfoFound) {
            await page.waitForSelector('table.custArea.min640');

            const artInfoDetails = await page.evaluate(() => {
                const artInfo = [];


                const table2 = document.querySelector('table.custArea.min640');
                const trs2 = [...table2.querySelectorAll('tr')];

                trs2.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length === 3) {
                        const modelElement = cells[0].querySelector('b');
                        if (modelElement) {
                            const carModel = modelElement.innerText.trim() + ' ' + (modelElement.nextElementSibling ? modelElement.nextElementSibling.innerText.trim() : '');

                            const tdText = cells[0].innerText.split('\n');

                            tdText.shift();

                            const carEngineParams = tdText.join(' ').trim();

                            artInfo.push({
                                carModel: carModel.trim(),
                                carEngineParams: carEngineParams.replace(/\s+/g, ' ')
                            });
                        }

                    }
                });

                return artInfo;
            });


            artInfoDetails.forEach((aid) => {
                const carModel = getPartBeforeParenthesis(aid.carModel);

                const ktype = KTYPESMAP.get(`${carModel} ${aid.carEngineParams}`);

                if (ktype) {
                    kTypesFromScrapedProds.push(ktype);
                }

            })
        }


        return {
            ...productDetails,
            ktypes: kTypesFromScrapedProds.join(', ')
        }
    } catch (error) {
        console.log('Error while scraping the page', error)

        return;
    }

}

const main = async () => {
    const PRODUCTS = readExcelFile('./products2.xlsx');
    let browser = await puppeteer.launch({ headless: false });


    for (let i = 0; i < 10000; i++) {
        try {
            if (i % 50 === 0) {
                await browser.close();
                browser = await puppeteer.launch({ headless: false });
            }
            const { product_ean, product_sku, product_manufacturer_name } = PRODUCTS[i];
            const pageUrl = `https://www.kfzteile24.de/artikelsuche?search=${product_sku}&searchType=artnrOenr`;
            const page = await browser.newPage();

            await page.setDefaultTimeout(18000);

            await page.goto(pageUrl);

            const prodDetails = await scrapeProductDetail(page);

            let filePath = `final_products_${Math.ceil((i + 1) / 500)}.xlsx`

            await importDataToExcel({ product_ean, product_sku, product_manufacturer_name, ...prodDetails }, filePath);
            console.log(i);

            await page.close();
        } catch (error) {
            console.log(`Error while scraping page ${i}`, error)
        }
    }


    await browser.close();

}



main();
