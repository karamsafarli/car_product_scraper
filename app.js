const { readExcelFile } = require('./data');
const puppeteer = require('puppeteer-extra');
const ExcelJS = require('exceljs');
const fs = require('fs');
const KTYPES = readExcelFile('./ktypes.xlsx');


function normalizeEngineParams(params) {
    let cm3, kw, ps;
    try {
        cm3 = params.split(',')[0].replace('cm', 'm3').trim().replace(' ', '');
        kw = params.split(',')[1].replace('K', 'k').trim().replace(' ', '');
        ps = params.split(',')[2].trim().replace(' ', '');

        return `${cm3}, ${kw}/${ps}`;
    } catch (err) {
        cm3 = params.split(',')[0].replace('cm', 'm3').trim().replace(' ', '');
        kw = params.split(',')[1].replace('K', 'k').trim().replace(' ', '');
        return `${kw}/${ps}`
    }
}

function getPartBeforeParenthesis(str) {
    const match = str.split('(');
    return match ? match[0].trim() : "";
}

const KTYPESMAP = new Map();
KTYPES.forEach((entry) => {
    const key = `${entry['Marke_Make_EN'].toLowerCase()} ${entry['Modell_Model_EN'].toLowerCase()} ${normalizeEngineParams(entry['Motor_Engine_EN'])}`;
    KTYPESMAP.set(key, entry['K-Type'])
});

// console.log(KTYPESMAP)


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

function removeZyl(str) {
    return str.replace(/,\s*\d+\s*Zyl\./i, '');
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
            'Product Name',
            'product_ean',
            'product_sku',
            'product_manufacturer_name',
            'KFZTEILE NAME',
            'Beschreibung',
            'OENummer Hersteller',
            'K-Types',
            'Document Links',
            'Price',
            'UVP',
            'Image URLs',
            'Manufacturer Logo',
            'Hilfreiche Artikel',
            'Breadcrumb'
        ]);

        const row2 = worksheet2.addRow([
            'Product Name',
            'product_ean',
            'product_sku',
            'product_manufacturer_name',
            'KFZTEILE NAME',
            'Beschreibung'
        ]);

        const row3 = worksheet3.addRow([
            'Product Name',
            'product_ean',
            'product_sku',
            'product_manufacturer_name',
            'KFZTEILE NAME',
            'OENummer Hersteller'
        ]);

        row.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
        row2.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
        row3.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
    }

    worksheet.addRow([
        returnValid(data.product_name),
        returnValid(data.product_ean),
        returnValid(data.product_sku),
        returnValid(data.product_manufacturer_name),
        returnValid(data.productName),
        returnValid(data.joinedDetailContent),
        returnValid(data.joinedBoxRefNums),
        returnValid(data.prodKtypes),
        returnValid(data.pdfLinks),
        `${returnValid(data.price)} €`,
        `${returnValid(data.uvp)} €`,
        returnValid(data.imageUrls),
        returnValid(data.logo),
        returnValid(data.articles),
        returnValid(data.breadCrumb)
    ]);


    returnValid(data.splittedDetailContent, true).forEach((sdc) => {
        worksheet2.addRow([
            returnValid(data.product_name),
            returnValid(data.product_ean),
            returnValid(data.product_sku),
            returnValid(data.product_manufacturer_name),
            returnValid(data.productName),
            sdc
        ]);
    });

    returnValid(data.joinedBoxRefNums).split(',').forEach((brn) => {
        worksheet3.addRow([
            returnValid(data.product_name),
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

    // if (prodName === '-' || prodName === null) {
    //     console.log('skipped')
    //     return;
    // }

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

            const fakeHoverEvent = new MouseEvent('mouseover', {
                bubbles: true,
                cancelable: true,
                view: window
            });

            [...document.querySelectorAll('.pdfLink')].forEach((link) => link.dispatchEvent(fakeHoverEvent))

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


            let imageUrls = [...document.querySelectorAll('#art-thumbnail-container img')]?.map(img => img?.src)?.join(' , ');

            if (!imageUrls || imageUrls.length === 0) {
                imageUrls = document.querySelector('.art-thumbnail-img')?.src;
            }

            const logo = document.querySelector('.art-logo img')?.src;
            const price = document.querySelector('.preis .priceTypeGross')?.textContent;
            const uvp = document.querySelector('.art-uvp .priceTypeGross')?.textContent;
            const breadCrumb = [...document.querySelectorAll('.breadcrumb li a span')]?.map(bc => bc?.textContent?.trim())?.join(' > ');
            const articles = [...document.querySelectorAll('.articleContainer .articleDetails')].map((art) => {
                const title = art.querySelector('a')?.textContent?.trim();
                const subtitle = art.querySelector('span')?.textContent?.trim();
                return `${title} ${subtitle}`
            })?.join('; ');


            return {
                productName,
                pdfLinks,
                joinedBoxRefNums,
                joinedDetailContent,
                splittedDetailContent,
                imageUrls,
                logo,
                price,
                uvp,
                breadCrumb,
                articles
            }
        });



        let isArtInfoFound = await page.evaluate(() => {
            const artInfoTabs = [...document.querySelectorAll('.artInfoTab')];
            const artInfoBoxBtn = artInfoTabs.find((ait) => ait.querySelector('span.noneWrap')?.textContent.trim() === 'Fahrzeugtypen' && !ait.classList.contains('active'));
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
                const ktype = KTYPESMAP.get(`${carModel.toLowerCase()} ${removeZyl(aid.carEngineParams)}`);
                if (ktype) {
                    kTypesFromScrapedProds.push(ktype);
                }

            })
        }

        return { ...productDetails, prodKtypes: kTypesFromScrapedProds?.join(', ') };
    } catch (error) {
        console.log('Error while scraping the page', error)

        return;
    }

}

const main = async () => {
    const PRODUCTS = readExcelFile('./Line_200001-to-250000.xlsx');
    let browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ]
    });


    for (let i = 0; i < 10000; i++) {
        try {
            if (i % 50 === 0) {

                await browser.close();
                browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                    ]
                });
            }
            const { product_ean, product_sku, product_manufacturer_name, product_name } = PRODUCTS[i];
            if (!product_ean || product_ean?.length === 0) {
                continue;
            }
            // const prodName = PRODUCTS[i]['Product Name'];
            // const prodDet = PRODUCTS[i]['Beschreibung'];
            // const prodModels = PRODUCTS[i]['OENummer Hersteller'];
            // const prodKtypes = PRODUCTS[i]['K-Types'];
            // const prodPDF = PRODUCTS[i]['Document Links'];
            // const pageUrl = `https://www.kfzteile24.de/artikelsuche?search=${product_ean}&searchType=artnrOenr`;
            const pageUrl = `https://www.kfzteile24.de/artikelsuche?search=${product_ean}&searchType=artnrOenr`;
            const page = await browser.newPage();

            await page.setDefaultTimeout(10000);

            await page.goto(pageUrl);

            const prodDetails = await scrapeProductDetail(page);

            let filePath = `final_products_${Math.ceil((i + 1) / 500)}.xlsx`

            await importDataToExcel({
                product_ean,
                product_sku,
                product_manufacturer_name,
                product_name,
                ...prodDetails
            }, filePath);
            console.log(i);

            await page.close();
        } catch (error) {
            console.log(`Error while scraping page ${i}`, error)
        }
    }


    await browser.close();

}



main();
