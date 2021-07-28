const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');

(async () => {
    const html = await getHTML();
    const professors = extractProfessors(html);
    await updateDB(professors);
})();

async function getHTML() {
    const url = 'https://www.ratemyprofessors.com/search/teachers?query=*&sid=971';

    const close_selector = '.CCPAModal__StyledCloseButton-sc-10x9kq-2';
    const show_more_selector = '.PaginationButton__StyledPaginationButton-txi1dr-1';
    const num_profs_selector = '.flHcYr';

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    console.log(`Navigating to ${url}...`);

    const close = await page.$(close_selector);
    const show_more = await page.$(show_more_selector);

    await close.click();

    const text_with_num_profs = await page.$eval(num_profs_selector, element => element.innerText);
    const num_profs = parseInt(text_with_num_profs.split(" ")[0]);
    const num_show_more_clicks = Math.ceil(num_profs / 8) - 1;
    for (let i = 0; i < num_show_more_clicks; i++) {
        await show_more.click();
        await page.screenshot({ path: `./screenshots/screenshot_before${i}.png` });
        await page.waitForFunction((show_more) => !show_more.hasAttribute('disabled'), {}, show_more);
        await page.waitForTimeout(Math.random() * 50);
        console.log(`(${i} / ${num_show_more_clicks}) Clicking show more...`);
        await page.screenshot({ path: `./screenshots/screenshot_after${i}.png` });
    }

    const results_selector = '.SearchResultsPage__SearchResultsWrapper-sc-1srop1v-1';
    const html = await page.$eval(results_selector, element => element.innerHTML);
    await browser.close();
    console.log('Returing HTML data...');
    return html;
}
function extractProfessors(HTML) {
    professors = {};
    professors['professors'] = {};

    const $ = cheerio.load(HTML, null, false);
    const teacher_info = '.TeacherCard__StyledTeacherCard-syjs0d-0';
    $(teacher_info).each((index, element) => {

        const prof_name_selector = '.cJdVEK';
        const rating_selector = '.bUneqk, .fJKuZx, .kMhQxZ';
        const difficulty_and_retake_selector = '.hroXqf';
        const num_ratings_selector = '.jMRwbg';

        const prof_name = $(element).find(prof_name_selector).first().text();
        const rating = $(element).find(rating_selector).first().text();
        const difficulty = $(element).find(difficulty_and_retake_selector).last().text();
        const would_take_again = $(element).find(difficulty_and_retake_selector).first().text();
        const num_ratings = $(element).find(num_ratings_selector).first().text().split(" ")[0];
        const href = $(element).attr('href').split("=")[1];

        professors['professors'][prof_name] = {
            rating,
            difficulty,
            would_take_again,
            num_ratings,
            href
        }
        professors['timestamp'] = new Date();
    });
    console.log('Extracting JS object...');
    return professors;
}
async function updateDB(professors) {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    await client.connect();

    const db = client.db('professors');
    const collection = db.collection('professors');

    await collection.deleteMany({});
    await collection.insertOne(professors);
    await client.close();
    console.log('Added document to database');
}