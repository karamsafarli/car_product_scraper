const fs = require('fs');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');
const { readExclFile2, readExcelFile } = require('./data');

const websiteUrls = [];

const getRecruitFormLink = async (page, url, idx) => {
    try {
        await page.goto(url);

        // const title = await page.title();

        // websiteUrls.push(`${idx}. ${title} - ${url}`)

        await page.waitForSelector('h1');

        const isNotFound = await page.evaluate(() => {
            const notFoundElement = [...document.querySelectorAll('h1')].find(el => el?.textContent.trim().toLowerCase().includes('page not found'));

            if (notFoundElement) return true;

            return false;
        });


        if (isNotFound) {
            return { recruitFormLinks: '', isCorrectUrl: true };
        }



        // const isSkip = await page.evaluate(() => {
        //     const link = [...document.querySelectorAll('a')].find((l) => l?.textContent.trim().toLowerCase() === 'continue to baseball home');

        //     if (link) {
        //         link.click();
        //         return true
        //     }

        //     return false
        // });

        // if (isSkip) {
        //     await page.waitForNavigation();
        // }

        await page.waitForSelector('nav');

        const recruitFormLinks = await page.evaluate(() => {
            let nav = [...document.querySelectorAll('nav')];
            nav = nav[nav.length - 1];

            const links = [...nav?.querySelectorAll('a')];

            for (let i = links.length - 1; i >= 0; i--) {
                if (
                    (
                        links[i]?.textContent.trim().toLowerCase() === 'recruit questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruit questionnaires' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruit questionnaire form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruiting questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruitment questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruits' ||
                        links[i]?.textContent.trim().toLowerCase() === 'questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'athletic questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'baseball recruiting questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'baseball recruiting questionnaire form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'baseball recruit questionnaire form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'baseball recruitment form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'baseball recruitment questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'baseball recruit form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'baseball recruiting form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'baseball recruitment' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruiting questionnaire form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruiting' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruiting form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruit form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruitment form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruit' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student-athletes' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student-athlete' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student athlete' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student-athlete questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective player questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospect questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student-athlete questionnaire form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student-athlete recruitment form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student athlete recruitment form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'psa questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective athlete' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective athletes' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective athlete form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student-athlete form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student athlete form' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective students' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student athlete' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student athletes' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruit me' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruit me!' ||
                        links[i]?.textContent.trim().toLowerCase() === 'get recruited' ||
                        links[i]?.textContent.trim().toLowerCase() === 'get recruited!' ||
                        links[i]?.textContent.trim().toLowerCase() === 'be recruited' ||
                        links[i]?.textContent.trim().toLowerCase() === 'be recruited!' ||
                        links[i]?.textContent.trim().toLowerCase() === 'prospective student athlete questionnaire' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruit information' ||
                        links[i]?.textContent.trim().toLowerCase() === 'recruitment information'
                    ) &&
                    links[i]?.href.includes('http')
                ) {
                    return links[i]?.href;
                }
            }

            return '';

            // const possibleLinks = [];
            // for (let i = 0; i < links.length; i++) {
            //     if (
            //         (
            //             links[i]?.textContent.toLowerCase().includes('recruit') ||
            //             links[i]?.textContent.toLowerCase().includes('questionnaire') ||
            //             links[i]?.textContent.toLowerCase().includes('recruit questionnaire') ||
            //             links[i]?.textContent.toLowerCase().includes('recruiting questionnaire') ||
            //             links[i]?.textContent.toLowerCase().includes('prospective student-athletes') ||
            //             links[i]?.textContent.toLowerCase().includes('prospective student-athlete questionnaire') ||
            //             links[i]?.textContent.toLowerCase().includes('prospective student athletes') ||
            //             links[i]?.textContent.toLowerCase().includes('prospect questionnaire')
            //         ) &&
            //         links[i]?.textContent.toLowerCase().includes('alumni questionnaire')
            //     ) {
            //         if (!possibleLinks.includes(links[i]?.href)) {
            //             possibleLinks.push(links[i]?.href)
            //         }
            //     }
            // }

            // let recruitingFormLink;

            // if (possibleLinks.length === 1) {
            //     recruitingFormLink = possibleLinks[0]
            // }
            // else {
            //     for (let i = 0; i < possibleLinks.length; i++) {
            //         if (
            //             possibleLinks[i].includes('questionnaires.armssoftware') ||
            //             possibleLinks[i].includes('armssoftware')
            //         ) {
            //             recruitingFormLink = possibleLinks[i]
            //         }
            //     }

            //     if (!recruitingFormLink) {
            //         for (let i = 0; i < possibleLinks.length; i++) {
            //             if (possibleLinks[i].includes('recruit') || possibleLinks[i].includes('questionnaire')) {
            //                 recruitingFormLink = possibleLinks[i]
            //             }
            //         }
            //     }
            // }

            // return recruitingFormLink

        });

        return { recruitFormLinks, isCorrectUrl: true };
    } catch (error) {
        console.log(error)
        return { recruitFormLinks: '', isCorrectUrl: true };
    }
}

const importDataToExcel = async (data, filePath) => {
    let workbook;
    let worksheet;

    if (fs.existsSync(filePath)) {
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet('Baseball');
    } else {
        workbook = new ExcelJS.Workbook();
        worksheet = workbook.addWorksheet('Baseball');
        const row = worksheet.addRow([
            'School',
            'Nickname',
            'City',
            'State',
            'School Website',
            'Athletic Websites',
            '2024-25 Roster URL',
            '2024-25 Coaches URL',
            'Staff Directory',
            'Baseball Recruitment Form'
        ]);



        row.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
    }

    worksheet.addRow([
        data.school,
        data.nickname,
        data.city,
        data.state,
        data.schoolWebsite,
        data.athleticWebsite,
        data.rosterUrl,
        data.coachesUrl,
        data.staffDir,
        data.recruitForm
    ]);

    await workbook.xlsx.writeFile(filePath);
}


const main = async () => {
    const baseballExcelData = readExcelFile('./baseball_data.xlsx');
    const browser = await puppeteer.launch({
        headless: true,
        // args: [
        //     '--no-sandbox',
        //     '--disable-setuid-sandbox',
        // ]
    });
    const page = await browser.newPage();

    await page.setViewport({
        width: 1280,
        height: 800
    });

    await page.setDefaultTimeout(15000);

    // let requestCount = 0;
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const resourceType = request.resourceType();

        if (['image', 'stylesheet', 'font'].includes(resourceType)) {
            request.abort();
        } else {
            request.continue();
        }
    });

    for (let i = 0; i < baseballExcelData.length; i++) {
        const school = baseballExcelData[i]['School'];
        const nickname = baseballExcelData[i]['Nickname'];
        const city = baseballExcelData[i]['City'];
        const state = baseballExcelData[i]['State'];
        const schoolWebsite = baseballExcelData[i]['School Website'];
        const athleticWebsite = baseballExcelData[i]['Athletic Websites'];
        const staffDir = baseballExcelData[i]['Staff Directory'];
        let rosterUrl = '',
            coachesUrl = '',
            recruitForm = baseballExcelData[i]['Baseball Recruitment Form'];

        if (athleticWebsite && !recruitForm) {
            rosterUrl = athleticWebsite.includes('https') ? `${athleticWebsite}/sports/baseball/roster` : `https://${athleticWebsite}/sports/baseball/roster`;
            coachesUrl = athleticWebsite.includes('https') ? `${athleticWebsite}/sports/baseball/coaches` : `https://${athleticWebsite}/sports/baseball/coaches`;
            const { recruitFormLinks, isCorrectUrl } = await getRecruitFormLink(page, rosterUrl, i);

            recruitForm = recruitFormLinks;

            if (!isCorrectUrl) {
                rosterUrl = athleticWebsite.includes('https') ? `${athleticWebsite}/sports/bsb/2024-25/roster` : `https://${athleticWebsite}/sports/bsb/2024-25/roster`;
                coachesUrl = athleticWebsite.includes('https') ? `${athleticWebsite}/sports/bsb/coaches/index` : `https://${athleticWebsite}/sports/bsb/coaches/index`;
            }
        }

        await importDataToExcel({
            school,
            nickname,
            city,
            state,
            schoolWebsite,
            athleticWebsite,
            rosterUrl,
            coachesUrl,
            staffDir,
            recruitForm
        }, './baseball_data_2.xlsx')

        console.log(`${i}. ${school} - ${recruitForm}`)
    }


    fs.writeFileSync('./baseball_urls.txt', websiteUrls.join('\n'), 'utf8');


    await browser.close();
}

main();

