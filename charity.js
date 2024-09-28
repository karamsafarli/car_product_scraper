const fs = require('fs');
const ExcelJS = require('exceljs')

// const getCombinedData = async (from) => {
//     try {
//         const res = await fetch(`https://ngo.hkcss.org.hk/api/v1/ngos/combine_search?search=&from=${from}`);
//         const data = await res.json();

//         return data.data.map((d) => {
//             return { id: d.id, type: d.m_type };
//         });

//     } catch (error) {
//         console.log(error)
//     }
// }

// const getAllData = async () => {
//     for (let i = 0; i < 5114; i += 18) {
//         const data = await getCombinedData(i);
//         console.log(i);
//         if (!data) continue;

//         if (fs.existsSync('./charity_data.txt')) {
//             let previousData = fs.readFileSync('./charity_data.txt', { encoding: 'utf-8' });

//             previousData = JSON.stringify([...JSON.parse(previousData), ...data]);

//             fs.writeFileSync('./charity_data.txt', previousData)
//         }

//         else {
//             fs.writeFileSync('./charity_data.txt', JSON.stringify(data));
//         }
//     }
// }


// getAllData();

const API_URL = 'https://ngo.hkcss.org.hk/api/v1';
const BASE_URL = "https://ngo.hkcss.org.hk";


const importDataToExcel = async (d) => {
    try {
        let workbook;
        let worksheet;
        if (fs.existsSync('./charities.xlsx')) {
            workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile('./charities.xlsx');
            worksheet = workbook.getWorksheet('Charities');
        }

        else {
            workbook = new ExcelJS.Workbook();
            worksheet = workbook.addWorksheet('Charities');

            const row = worksheet.addRow([
                "Category Name / Sector Name", "URL to full charity profile", "Charity Name", "Charity Description", "Charity Registration Number", "Charity Date of Registration", "Contact Person Name", "Contact email", "Contact Phone", "Contact Whatsapp", "Contact Fax", "Contact Address", "Contact Website URL", "Facebook URL", "Twitter URL", "Instagram URL", "Tiktok URL", "Other URL"
            ]);

            row.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
        }

        // data.forEach((d) => {
        worksheet.addRow([
            d.type,
            d.siteUrl,
            d.name,
            d.description,
            d.tel,
            d.date,
            d.personName,
            d.email,
            d.tel,
            d.wp,
            d.fax,
            d.address,
            d.website
        ]);
        // });



        await workbook.xlsx.writeFile('./charities.xlsx');
    } catch (err) {
        console.log(err)
    }

}

const getDetailData = async (id, type) => {
    try {
        let searchType = type === 'ngo' ? 'ngos' : (type === 'promo_info' ? 'projects' : 'ngos/centers');

        const url = `${API_URL}/${searchType}/${id}/details`;

        const res = await fetch(url);
        const resdata = await res.json();
        const data = resdata.details;
        // console.log(data)
        const urlType = type === 'promo_info' ? 'promotional_info' : (type === 'service_unit' ? 'service_units' : 'ngo');

        const siteUrl = `${BASE_URL}/${urlType}/${id}`;
        const name = data.name_en || data.unit_name_en || '';
        const description = data.summary_en || data['3_MISSION_OBJS_EN'] || data.service_introduction_en || data.service_provided || '';
        const tel = data.tel || data['1_TEL'] || '';
        const date = '';
        const personName = '';
        const email = data.email_addr || data['1_EMAIL'] || '';
        const wp = data.whatsapp || data['1_WHATSAPP'] || '';
        const fax = data.fax || data['1_FAX'] || '';
        const address = data.address_en || `${data['1_ADDRESS_EN_L1']} ${data['1_ADDRESS_EN_L2']} ${data['1_ADDRESS_EN_L3']}`;
        const website = data.website || data['1_WEBSITE'] || '';

        return {
            type,
            siteUrl,
            name,
            description,
            tel,
            date,
            personName,
            email,
            tel,
            wp,
            fax,
            address,
            website
        }
    } catch (error) {
        console.log(error)
        return;
    }
}

const getAllDetails = async () => {
    const textData = fs.readFileSync('./charity_data.txt', { encoding: 'utf-8' })
    const charityData = await JSON.parse(textData);

    for (let i = 0; i < charityData.length ; i++) {
        console.log(i)
        // const data = await Promise.all([
        //     getDetailData(charityData[i].id, charityData[i].type),
        //     getDetailData(charityData[i + 1].id, charityData[i + 1].type),
        //     getDetailData(charityData[i + 2].id, charityData[i + 2].type),
        //     getDetailData(charityData[i + 3].id, charityData[i + 3].type),
        //     getDetailData(charityData[i + 4].id, charityData[i + 4].type),
        //     getDetailData(charityData[i + 5].id, charityData[i + 5].type),
        //     getDetailData(charityData[i + 6].id, charityData[i + 6].type),
        //     getDetailData(charityData[i + 7].id, charityData[i + 7].type),
        //     getDetailData(charityData[i + 8].id, charityData[i + 8].type),
        //     getDetailData(charityData[i + 9].id, charityData[i + 9].type),
        // ]);

        const data = await getDetailData(charityData[i].id, charityData[i].type);
        
        console.log(data.name)
        if (!data) continue;

        await importDataToExcel(data);
    };

}

getAllDetails()