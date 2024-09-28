const ExcelJS = require('exceljs');
const fs = require('fs');

const BASE_URL = 'https://laylagrayce.com';
const API_URL = 'https://laylagrayce.com/search/api/';

const categories = [
    {
        id: 770,
        category: 'sofa'
    },
    {
        id: 773,
        category: 'chair',
    },
    {
        id: 775,
        category: 'bench',
    },
    {
        id: 776,
        category: 'coffee_table',
    },
    {
        id: 782,
        category: 'dining_table',
    },
    {
        id: 783,
        category: 'dining_chair',
    },
    {
        id: 787,
        category: 'bed',
    },
    {
        id: 788,
        category: 'dresser',
    },
    {
        id: 789,
        category: 'nightstand',
    },
    {
        id: 804,
        category: 'lamp',
    },
]

const colors = [
    {
        name: "white",
        searchParam: 'White'
    },
    {
        name: "yellow / gold",
        searchParam: 'Yellow%2FGold'
    },
    {
        name: "brown / tan",
        searchParam: 'Brown%2FTan'
    },
    {
        name: "gray / silver",
        searchParam: 'Gray%2FSilver'
    },
    {
        name: "blue",
        searchParam: 'Blue'
    },
    {
        name: "black",
        searchParam: 'Black'
    },
    {
        name: "green",
        searchParam: 'Green'
    },
    {
        name: "ivory / beige",
        searchParam: 'Ivory%2FBeige'
    },

]


const importDataToExcel = async (data) => {
    try {
        let workbook;
        let worksheet;
        if (fs.existsSync('./furnitures.xlsx')) {
            workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile('./furnitures.xlsx');
            worksheet = workbook.getWorksheet('Furnitures');
        }

        else {
            workbook = new ExcelJS.Workbook();
            worksheet = workbook.addWorksheet('Furnitures');

            const row = worksheet.addRow([
                'Category',
                'Color',
                'Title',
                'Photo',
                'URL'
            ]);

            row.font = { color: { argb: 'FF305496' }, bold: true, size: 12 };
        }

        data.forEach((d) => {
            worksheet.addRow([
                d.category,
                d.color,
                d.title,
                d.photo,
                d.url
            ]);
        });



        await workbook.xlsx.writeFile('./furnitures.xlsx');
    } catch (err) {
        console.log(err)
    }

}


const fetchData = async (category, categoryId, color, colorId) => {
    try {
        const url = `${API_URL}?category_id=${categoryId}&color=${colorId}`;
        const res = await fetch(url);
        const data = await res.json();

        const filteredData = data.results.map((d) => {
            return {
                category,
                color,
                title: d.title,
                photo: d.photo,
                url: `${BASE_URL}${d.url}`
            }
        });

        return filteredData
    } catch (error) {
        console.log(error)
        return;
    }
}

const main = async () => {
    for (const { category, id } of categories) {
        for (const { name, searchParam } of colors) {
            const data = await fetchData(category, id, name, searchParam);
            if (!data) continue;

            await importDataToExcel(data);
            console.log(category, name);
        }
    }
}

main();