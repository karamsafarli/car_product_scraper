const fs = require('fs');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const { readExcelFile } = require('./data');

const getRecruitFormLink = async (page, url) => {
    try {
        await page.goto(`${url}/sports/softball`);

        

        const recruitFormLinks = await page.evaluate(() => {
            const links = [...document.querySelectorAll('a')];
            const possibleLinks = [];
            for (let i = 0; i < links.length; i++) {
                if (
                    links[i]?.textContent.toLowerCase().includes('recruit') ||
                    links[i]?.textContent.toLowerCase().includes('recruit questionnaire') ||
                    links[i]?.textContent.toLowerCase().includes('recruiting questionnaire') ||
                    links[i]?.textContent.toLowerCase().includes('prospective student-athletes') 
                ) {
                    possibleLinks.push(links[i]?.href)
                }
            }


            if (possibleLinks.length === 1) {
                return possibleLinks[0]
            }
            else {
                for (let i = 0; i < possibleLinks.length; i++) {
                    if (
                        possibleLinks[i].includes('questionnaires.armssoftware') ||
                        possibleLinks[i].includes('armssoftware')
                    ) {
                        return possibleLinks[i]
                    }
                }
            }

        });

        return recruitFormLinks;
    } catch (error) {
        return;
    }
}

const importDataToExcel = async (data, filePath) => {
    let workbook;
    let worksheet;

    if (fs.existsSync(filePath)) {
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet('Softball');
    } else {
        workbook = new ExcelJS.Workbook();
        worksheet = workbook.addWorksheet('Softball');
        const row = worksheet.addRow([
            'School',
            'Athletic Websites',
            '2024-25 Roster URL',
            '2024-25 Coaches URL',
            'Softball Recruitment Form'
        ]);



        row.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
    }

    worksheet.addRow([
        data.school,
        data.website,
        data.rosterUrl,
        data.coachesUrl,
        data.recruitForm
    ]);


    await workbook.xlsx.writeFile(filePath);
}


const main = async () => {
    const softballExcelData = readExcelFile('./sports.xlsx');
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    let requestCount = 0;
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const resourceType = request.resourceType();

        if (['image', 'stylesheet', 'font'].includes(resourceType)) {
            request.abort();
        } else {
            request.continue();
        }
    });

    for (let i = 0; i < softballExcelData.length; i++) {
        const school = softballExcelData[i]['School'];
        const website = softballExcelData[i]['Athletic Websites'];
        const rosterUrl = softballExcelData[i]['2024-25 Roster URL'];
        const coachesUrl = softballExcelData[i]['2024-25 Coaches URL'];
        let recruitForm = softballExcelData[i]['Softball Recruitment Form'];

        if (!recruitForm) {
            recruitForm = await getRecruitFormLink(page, website) || '';
        }

        await importDataToExcel({
            school,
            website,
            rosterUrl,
            coachesUrl,
            recruitForm
        }, './sports_data.xlsx')

        console.log(`${i} ${school}`)
    }



    await browser.close();
}

main();

// Skip Permanently
// Continue to Softball Home