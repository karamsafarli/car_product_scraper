const puppeteer = require('puppeteer-extra');
const { setTimeout } = require('node:timers')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())



async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.querySelector('.jobs-search-results-list').scrollHeight;
                document.querySelector('.jobs-search-results-list').scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - document.querySelector('.jobs-search-results-list').clientHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 10);
        });
    });
}


const getPaginationData = async (page, browser) => {
    const jobsData = [];
    await page.waitForSelector('.jobs-search-results-list');
    await autoScroll(page);

    const len = await page.evaluate(() => document.querySelectorAll('.job-card-list__title--link').length);

    for (let i = 0; i < len; i++) {
        const title = await page.evaluate(async (idx) => {
            document.querySelectorAll('.job-card-list__title--link')[idx]?.click();
            await setTimeout(200)
            return document.querySelector('.job-details-jobs-unified-top-card__job-title h1 a')?.textContent?.trim();
        }, i);

        const isExternalLink = await page.evaluate(() => {
            const btnText = document.querySelectorAll(".jobs-apply-button span")[0].textContent?.trim()?.toLowerCase();
            if (btnText.includes('easy')) {
                return false;
            } else {
                return true;
            }
        });

        let siteLink = '';

        if (isExternalLink) {
            await page.click('.jobs-apply-button');
            setTimeout(500);
            const pages = await browser.pages();
            const newPage = pages[1];
            await newPage.waitForNavigation();
            siteLink = await newPage.url();
            await newPage.close();
        }

        jobsData.push({ title, siteLink });

    }


    return jobsData

}


const main = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setDefaultTimeout(60000)

    await page.goto('https://www.linkedin.com/login?fromSignIn=true&trk=guest_homepage-basic_nav-header-signin');

    // // LOGIN
    await page.type('#username', 'qhaciyev26@gmail.com');
    await page.type('#password', 'Salamqurban212.');
    await page.keyboard.press("Enter");


    // SCRAPING
    await page.goto('https://www.linkedin.com/jobs/search/?currentJobId=4015916174&f_TPR=r2592000&f_WT=2&geoId=92000000&keywords=devops&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true');

    const data = await getPaginationData(page, browser);
    console.log(data);
    console.log(data.length);

}



main();