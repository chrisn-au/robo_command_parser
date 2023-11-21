const fs = require('fs');

const PROTOCOL_FOUR = '4';
const GET_PROP = 'get_prop';
const ELEMENT_101 = '101';
const ELEMENT_102 = '102';

function parseRoborockFile(filePath) {
    const data = [];

    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    let jsonStr;
    lines.forEach(line => {
        try {
            const protocolStart = line.indexOf("protocol=");
            const protocol = line.substring(protocolStart+9, protocolStart+10);
            
            const start = line.indexOf("payload=b'") + 10;
            const end = line.lastIndexOf("}'");

            if (start > 9 && end > -1) {
                jsonStr = line.substring(start, end + 1);
                jsonStr = jsonStr.replace(/:"\{/g, ':{');
                jsonStr = jsonStr.replace(/\\/g, "");  
                jsonStr = jsonStr.replace(/\}"}/g, '}}');

                const parsedJson = JSON.parse(jsonStr);
                const obj = {
                    protocol: protocol,
                    payload: parsedJson
                }
                data.push(obj);
            }
        } catch (error) {
            console.error("Error decoding JSON in line:", jsonStr);
        }
    });

    return data;
}


function filterMethod(data, method) {
        return data.filter(item => item.protocol === method);
}


function filterGetProp(data, method) {
    return data.filter(item => ELEMENT_101 in item.payload.dps && item.payload.dps[ELEMENT_101].method != method);
}

function main(){

    const parsedData = parseRoborockFile('capture_21-11_11_20.txt');
    const filteredData = filterMethod(parsedData, PROTOCOL_FOUR);
    const reducedData = filterGetProp(filteredData, GET_PROP);

    let calls = []
    for (let i = 0; i < reducedData.length; i++) {
        let obj = {}
        let call = {}
        call.method = reducedData[i].payload.dps[ELEMENT_101].method; 
        call.params = reducedData[i].payload.dps[ELEMENT_101].params ? reducedData[i].payload.dps[ELEMENT_101].params : null;

        let response = {}
        response = filteredData.find(item => ELEMENT_102 in item.payload.dps && item.payload.dps[ELEMENT_102].id == reducedData[i].payload.dps[ELEMENT_101].id);
        if (response != undefined)
            response = response.payload.dps[ELEMENT_102].result;

        obj.call = call;
        obj.response = response;

        calls.push(obj);
    }
    console.log(calls);
    generateFile(calls);
}


function generateFile(data) {
    let fileContent = '';
    data.forEach(item => {
        fileContent += JSON.stringify(item) + '\n';
    });
    fs.writeFileSync('calls.txt', fileContent);
}

main();