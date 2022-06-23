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
 * Gets object that column index and folder name are associated.
 * @param {Object} folderIdObj
 * @return {Object}
 */
function getFolderNameObj(folderIdObj){
  let folderId;
  let folder;
  let folderNameObj = {};
  const keys = Object.keys(folderIdObj);
  for(let i = 0; i < keys.length; i++){
    folderId = folderIdObj[keys[i]];
    folder = DriveApp.getFolderById(folderId);
    folderNameObj[keys[i]] = [folder.getName()];
  }
  return folderNameObj;
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
 * Gets object that column index and prefix are associated.
 * @return {Object}
 */
function getPreffixObj(){
  const prefixObj = getInfoObj(SHEET_NAME_MAIN, ROW_INDEX_OF_FILE_NAME_PREFFIX);
  return prefixObj;
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
    fileNames = [];
    for(let j = 0; j < fileIds.length; j++){
      fileId = fileIds[j];
      file = DriveApp.getFileById(fileId);
      fileNames.push(file.getName());
    }
    fileNamesObj[keys[i]] = fileNames;
  }
  return fileNamesObj;
}

/**
 * Gets object deduplicated by number of letters of prefix.
 * @param {Object} fileNamesObj
 * @param {Object} preffixObj
 * @return {Object}
 */
function deduplicateArrayByPreffix(fileNamesObj, preffixObj){
  let deduplicatedArray = [];
  let deduplicatedObj = {};
  let numberOfTargetLetters = 0;
  let targetLetters = "";
  const keys = Object.keys(fileNamesObj);
  for(let i = 0; i < keys.length; i++){
    deduplicatedArray = [];
    fileNames = fileNamesObj[keys[i]];
    for(let j = 0; j < fileNames.length; j++){
      numberOfTargetLetters = preffixObj[keys[i]].length;
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
 * @param {string} sheetName
 * @param {number} startRowIndex
 * @param {Object} obj
 * @return {bool}
 */
function writeObjByKey(sheetName, startRowIndex, obj){
  let arrayToWrite = [];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  let range;
  const keys = Object.keys(obj);
  for(let i = 0; i < keys.length; i++){
    arrayToWrite = obj[keys[i]];
    range = sheet.getRange(startRowIndex, keys[i], arrayToWrite.length, arrayToWrite[0].length);
    range.setValues(arrayToWrite);
  }
  return true;
}

function main() {
  const folderIdObj = getFolderIdObj();
  const folderNameObj = getFolderNameObj(folderIdObj);
  const objToWrite1 = setValuesObjOrientingColumn(folderNameObj);
  console.log("objToWrite1");
  console.log(objToWrite1)
  const writtenFlag1 = writeObjByKey(SHEET_NAME_MAIN, ROW_INDEX_OF_FOLDER_NAME, objToWrite1);
  const fileIdsObj = getFileIdsObj(folderIdObj);
  const preffixObj = getPreffixObj();
  const fileNamesObj = getFileNamesObj(fileIdsObj);
  const fileNamesObjDeduplicated = deduplicateArrayByPreffix(fileNamesObj, preffixObj);
  // console.log("fileNamesObjDeduplicated");
  // console.log(fileNamesObjDeduplicated);
  const objToWrite2 = setValuesObjOrientingColumn(fileNamesObjDeduplicated);
  console.log("objToWrite2");
  console.log(objToWrite2);
  const writtenFlag2 = writeObjByKey(SHEET_NAME_MAIN, ROW_INDEX_OF_START_OF_PREFIXES, objToWrite2);
}
