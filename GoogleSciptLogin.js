function doPost(req) {
    try {
        var doc = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = doc.getSheetByName('credentials');
        values = sheet.getDataRange().getValues();
    
        console.log("Values",values);
    
        // var jsonData = JSON.parse(req.postData.contents);
        var empid = "BS1614"; //jsonData.empid;
        var empemail = ""; //jsonData.empemail;
        var emppassword = "";
    
        // Generate and validate token
        var token = generateAccessToken(empid);
        console.log("token=> ", token);
    
        var isValid = validateAccessToken(token, empid);
        console.log("Token is valid: " + isValid);
    
        return employeelogin(empid,empemail,emppassword,values,token,sheet);

    }catch (error) {
        var errorResponse = {
            code: 400,
            message: "Error: " + error.message
        };
        console.log(errorResponse);
        return ContentService.createTextOutput(JSON.stringify(errorResponse)).setMimeType(ContentService.MimeType.JSON);    
    }
}
  
function findRowIndex(empId,empEmail, empPass, svalues) {
    for (let i = 1; i < svalues.length; i++) {
        if (svalues[i][0].toString().trim() === empId && svalues[i][1].toString().trim() === empEmail && svalues[i][2].toString().trim() === empPass) {
          return i + 1;  // Return 1-based index
        }
    }
    return -1;  // Not found
}
  
function employeelogin(empId,empEmail, empPass, svalues,empToken,sheet){
    var encrytppass = encryptPassword(empPass.toString().trim())
    originalRowIndex = findRowIndex(empId,empEmail, encrytppass, svalues);
    console.log("originalRowIndex",originalRowIndex);
    sheet.getRange(originalRowIndex, 4).setValue(empToken);
    sheet.getRange(originalRowIndex, 5).setValue(getFormattedDate());
    
    filteredRows = svalues.slice(1).filter(row => row[0].toString().trim()==empId.toString().trim() && row[1].toString().trim()==empEmail.toString().trim() && row[2].toString().trim()==encrytppass );
    console.log("filteredRows Values",filteredRows);
    if (filteredRows.length > 0){
        var responseObject = {
            code: 200,
        message: "Logged In Successfully",
        data: {
            empid: empId.toString().trim(),
            empemail: empEmail.toString().trim(),
            empToken: empToken,
            }
        };
        console.log(responseObject);responseObject
        return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
    }else{
        var errorResponse = {
            code: 400,
            message: "Credentials are wrong"
        };
        console.log(errorResponse);
        return ContentService.createTextOutput(JSON.stringify(errorResponse)).setMimeType(ContentService.MimeType.JSON);
    }
    
}
  
function encryptPassword(password) {
    return Utilities.base64Encode(Utilities.newBlob(password).getBytes());
}
  
function decryptPassword(encodedPassword) {
    return Utilities.newBlob(Utilities.base64Decode(encodedPassword)).getDataAsString();
}
  
function generateAccessToken(secret) {
    // Use timestamp + random number for uniqueness
    var timestamp = new Date().getTime().toString();
    var randomValue = Math.floor(Math.random() * 1000000).toString();

    // Combine secret, timestamp, and random value
    var token = secret + ":" + timestamp + ":" + randomValue;

    // Base64 encode without padding '='
    var accessToken = Utilities.base64EncodeWebSafe(token).replace(/=+$/, '');
    Logger.log("Generated Access Token: " + accessToken);
    return accessToken;
}
  
function validateAccessToken(token, secret) {
    
}

function getFormattedDate() {
    var currentDate = new Date();  // Current date and time
    currentDate.setDate(currentDate.getDate() + 2);  // Add 2 days

    var timestamp = currentDate.getTime();  // Convert to timestamp
    Logger.log("Updated Timestamp: " + timestamp);
    return timestamp;
}
  
function checkTimestampDifference(savedTimestamp, token, secret) {

    var isValid = false;

    try {
        var padding = '='.repeat((4 - (token.length % 4)) % 4);
        var decodedToken = Utilities.newBlob(
            Utilities.base64DecodeWebSafe(token + padding)
        ).getDataAsString();
    
        var [decodedSecret, timestamp, randomValue] = decodedToken.split(":");
    
        if (decodedSecret === secret) {
            Logger.log("Access Token Valid!");
            isValid = true;
        } else {
            Logger.log("Access Token Invalid!");
            isValid = false;
        }
    } catch (error) {
        Logger.log("Error: " + error.message);
        isValid = false;
    }

    if(isValid){
        var currentTimestamp = new Date().getTime();
        var differenceInSeconds = Math.floor((savedTimestamp - currentTimestamp) / 1000);
        if (differenceInSeconds <= 0) {
            return -1;
        }
        return differenceInSeconds;
    }else{
        return -1;
    }
    
}