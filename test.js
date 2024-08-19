const { readExcelFile } = require('./data');

const sports = readExcelFile('./sports.xlsx');

console.log(sports.slice(0,10))


// function removeZyl(str) {
//     return str.replace(/,\s*\d+\s*Zyl\./i, '');
// }


// const input = '1996cm3, 4 Zyl., 100kW/136PS';
// const result = removeZyl(input);
// console.log(result);

// console.log()