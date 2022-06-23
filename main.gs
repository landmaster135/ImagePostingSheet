/**
 * Gets object by row index.
 * @param {string} sheetName
 * @param {number} rowIndex
 * @return {Object}
 */
function getInfoObj(sheetName, rowIndex){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getSheetValues(rowIndex, 1, 1, sheet.getLastColumn());
  const infoObj = getObjIndexToValue(values[0], 1);
  return infoObj;
}

/**
 * Gets object that array index and value are associated.
 * @param {string[]} values
 * @param {number} offset
 * @return {Object}
 */
function getObjIndexToValue(values, offset=0){
  let obj = {};
  for(let i = 0; i < values.length; i++){
    if(i === 0){
      continue;
    }
    if(values[i] !== ""){
      obj[i + offset] = values[i];
    }
  }
  return obj;
}

/**
 * Gets object that column index and folder id are associated.
 * @return {Object}
 */
function getFolderIdObj(){
  const folderIdObj = getInfoObj(SHEET_NAME_MAIN, ROW_INDEX_OF_FOLDER_ID);
  return folderIdObj;
}

/**
 * Gets object that column index and file id array are associated.
 * @param {Object} folderIdObj
 * @return {Object}
 */
function getFileIdsObj(folderIdObj){
  let folderId;
  let folder;
  let file;
  let fileIds = [];
  let fileIdsObj = {};
  const keys = Object.keys(folderIdObj);
  for(let i = 0; i < keys.length; i++){
    folderId = folderIdObj[keys[i]];
    console.log(folderId);
    folder = DriveApp.getFolderById(folderId);
    fileIds = [];
    files = folder.getFiles();
    while (files.hasNext()) {
      file = files.next()
      fileIds.push(file.getId());
    }
    fileIdsObj[keys[i]] = fileIds;
  }
  return fileIdsObj;
}

/**
 * Gets object that column index and suffix are associated.
 * @return {Object}
 */
function getSuffixObj(){
  const suffixObj = getInfoObj(SHEET_NAME_MAIN, ROW_INDEX_OF_FILE_NAME_SUFFIX);
  return suffixObj;
}

/**
 * Gets object that column index and file name array are associated.
 * @param {Object} fileIdsObj
 * @return {Object}
 */
function getFileNamesObj(fileIdsObj){
  let fileIds;
  let fileId;
  let file;
  let fileNames = [];
  let fileNamesObj = {};
  const keys = Object.keys(fileIdsObj);
  for(let i = 0; i < keys.length; i++){
    fileIds = fileIdsObj[keys[i]];
    console.log(fileIds);
    fileNames = [];
    for(let j = 0; j < fileIds.length; j++){
      fileId = fileIds[j];
      file = DriveApp.getFileById(fileId);
      fileNames.push(file.getName());
    }
    
    
    // files = file.getFiles();
    // while (files.hasNext()) {
    //   file = files.next()
    //   fileNames.push(file.getId());
    // }
    fileNamesObj[keys[i]] = fileNames;
  }
  return fileNamesObj;
}

/**
 * Gets object deduplicated by number of letters of suffix.
 * @param {Object} fileNamesObj
 * @param {Object} suffixObj
 * @return {Object}
 */
function deduplicateArrayBySuffix(fileNamesObj, suffixObj){
  let deduplicatedArray = [];
  let deduplicatedObj = {};
  let numberOfTargetLetters = 0;
  let targetLetters = "";
  const keys = Object.keys(fileNamesObj);
  for(let i = 0; i < keys.length; i++){
    deduplicatedArray = [];
    fileNames = fileNamesObj[keys[i]];
    for(let j = 0; j < fileNames.length; j++){
      numberOfTargetLetters = suffixObj[keys[i]].length;
      targetLetters = fileNames[j].substring(0, numberOfTargetLetters);
      // console.log(targetLetters);
      if(!(deduplicatedArray.includes(targetLetters))){
        deduplicatedArray.push(targetLetters);
      }
    }
    deduplicatedArray = LandmasterLibraryGas.sortArrayAscend(deduplicatedArray);
    deduplicatedObj[keys[i]] = deduplicatedArray;
  }
  return deduplicatedObj;
}

/**
 * Sets values from 1 direction array to spreadsheet oriented column.
 * @param {string[]} array
 * @return {bool}
 */
function setValuesOrientingColumn(array){
  let values = [];
  for(let i = 0; i < array.length; i++){
    values.push([array[i]]);
  }
  return values;
}

/**
 * Sets object that values orient a column.
 * @param {Object} srcObj
 * @return {Object}
 */
function setValuesObjOrientingColumn(srcObj){
  let obj = {};
  const keys = Object.keys(srcObj);
  for(let i = 0; i < keys.length; i++){
    obj[keys[i]] = setValuesOrientingColumn(srcObj[keys[i]]);
  }
  return obj;
}
/**
 * Writes values from 1 direction array to spreadsheet orienting column.
 * @param {string} fileNasheetNamemesObj
 * @param {Object} obj
 * @return {bool}
 */
function writeObjByKey(sheetName, obj){
  // const arrayToWrite = setValuesOrientingColumn(array);
  // const flag = writeValuesToSheet(arrayToWrite);
  let arrayToWrite = [];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  let range;
  const keys = Object.keys(obj);
  for(let i = 0; i < keys.length; i++){
    arrayToWrite = obj[keys[i]];
    range = sheet.getRange(START_ROW_INDEX, keys[i], arrayToWrite.length - 1, 1);
    range.setValues(arrayToWrite);
  }
  return true;
}

function main() {
  const folderIdObj = getFolderIdObj();
  const fileIdsObj = getFileIdsObj(folderIdObj);
  const suffixObj = getSuffixObj();
  const fileNamesObj = getFileNamesObj(fileIdsObj);
  const fileNamesObjDeduplicated = deduplicateArrayBySuffix(fileNamesObj, suffixObj);
  console.log(fileNamesObjDeduplicated)
  const objToWrite = setValuesObjOrientingColumn(fileNamesObjDeduplicated);
  const writtenFlag = writeObjByKey(SHEET_NAME_MAIN, objToWrite);

  // const a = "20220623_satisfactory_01"
  // const b = ["20220623_satisfactory_01"]
  // console.log(a in b)
}
