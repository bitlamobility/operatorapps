function doGet(req) {
    var empid = req.parameter.empid;  // Employee ID from request
    var authtoken = req.parameter.authtoken;  // Employee ID from request

    var sheet = fetchAppSheet();
    if (sheet == -1) {
      return createErrorResponse("Sheet 'APPLISTS' not found.",true);
    }
    
    var response = isValidToken(authtoken, empid);
    if (response.code === 200) {

        var logSheet = logSheet();
        if (sheet == -1) {
            return createErrorResponse("Sheet 'LogSheet' not found.",true);
        }else{
            logRequest(logSheet, empid, req);
        }
        
        var build_required_param = req.parameter.build_required;
        var is_increment_vcode = req.parameter.is_increment_vcode === 'true';
        var is_json = req.parameter.is_json === 'true';
        var is_post = req.parameter.is_post === 'true';
        var is_update = req.parameter.is_update === 'true';

        if(is_update){
            var response = fetchDataForUpdate(req,sheet);
            return response;
        }else{
            if(is_post){
                var response = handlePost(req,sheet);
                return response;
            }else{
                var values = sheet.getDataRange().getValues();
                var filteredRows;
        
                if (build_required_param) {
                    filteredRows = values.slice(1).filter(row => row[0].toString().trim() === build_required_param.toString().trim());
        
                    if (filteredRows.length > 0 && is_increment_vcode) {
                        filteredRows.forEach((row) => {
                            var version = parseFloat(row[1]);
                            var versionCode = parseInt(row[2]);
                            var subDomain = row[3].toString().trim();
                            var originalRowIndex = findRowBySubdomain(subDomain, values);
                
                            sheet.getRange(originalRowIndex, 2).setValue((version + 0.1).toFixed(1));
                            sheet.getRange(originalRowIndex, 3).setValue(versionCode + 1);
                        });
                    }
                } else {
                    filteredRows = values.slice(1).filter(row => row[5]); 
                }
        
                if (filteredRows.length === 0) {
                  return createErrorResponse("No rows found",true);
                }
        
                if (build_required_param && is_increment_vcode) {
                    values = sheet.getDataRange().getValues();
                    filteredRows = values.slice(1).filter(row => row[0].toString().trim() === build_required_param.toString().trim());
                }
        
                if (is_json) {
                    var responseObject = {
                        code: 200,
                        message: "Active App Lists",
                        app_lists: filteredRows.map(function(row) {
                            return {
                            build_required: row[0],
                            version: row[1],
                            version_code: row[2],
                            sub_domain: row[3].toString().trim(),
                            key_file_name: row[4].toString(),
                            alias_name: row[5].toString(),
                            password: row[6].toString().trim(),
                            android_package_name: row[7].toString(),
                            operator_name: row[8].toString(),
                            base_url: row[9].toString().trim(),
                            country_name: row[10].toString().trim(),
                            developer_name: row[11] ? row[11].toString().trim() : "-",
                            last_app_published_date: row[12] ? row[12].toString().trim() : "-",
                            playstore_link: row[13] ? row[13].toString().trim() : "-",
                            region: row[14] ? row[14].toString().trim() : "-",
                            analytics_email: row[15] ? row[15].toString().trim() : "-",
                            analytics_property: row[16] ? row[16].toString().trim() : "-"
                            };
                        })
                    };
                    return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
                } else {
                    var output = filteredRows.map(row => [
                        row[0],   // build_required
                        row[1],   // version
                        row[2],   // version_code
                        row[3].toString().trim(),   // sub_domain
                        row[4].toString(),           // key_file_name
                        row[5].toString(),           // alias_name
                        row[6].toString().trim(),    // password
                        row[7].toString(),           // android_package_name
                        row[8].toString(),           // operator_name
                        row[9].toString().trim(),    // base_url
                        row[10].toString().trim()    // country_name
                    ].join(",")).join("\n");
            
                    return ContentService.createTextOutput(output+ "\n").setMimeType(ContentService.MimeType.TEXT);
                }
            }
        }
    } else {
        PrintLogger("Token validation failed: " + response.message);
        return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
    }
}

function fetchDataForUpdate(req,sheet) {
  
    var subdomainParam = req.parameter.subdomain;    
    var values = sheet.getDataRange().getValues(); // Get all the data from the sheet

    var originalRowIndex = findRowBySubdomain(subdomainParam, values);
    PrintLogger("originalRowIndex => "+originalRowIndex)
    if(originalRowIndex==-1){
        return createErrorResponse("Now data found!",true);
    }
    var response = getRowByIndex(sheet, originalRowIndex);
    return response;
}

function getRowByIndex(sheet, rowIndex) {
    var row = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0]; // Get the specific row by index (1-based)  
    if (!row || row.length === 0) {
        return createErrorResponse("Now data found!",true);
    }
    // Format the response
    var responseObject = {
        code: 200,
        message: "Data found",
        app_lists: {
        build_required: parseInt(row[0]),
        version: parseFloat(row[1]),
        version_code: parseInt(row[2]),
        sub_domain: row[3].toString().trim(),
        key_file_name: row[4].toString(),
        alias_name: row[5].toString(),
        password: row[6].toString().trim(),
        android_package_name: row[7].toString(),
        operator_name: row[8].toString(),
        base_url: row[9].toString().trim(),
        country_name: row[10].toString().trim(),
        developer_name: row[11] ? row[11].toString().trim() : "-",
        last_app_published_date: row[12] ? row[12].toString().trim() : "-",
        playstore_link: row[13] ? row[13].toString().trim() : "-",
        region: row[14] ? row[14].toString().trim() : "-",
        analytics_email: row[15] ? row[15].toString().trim() : "-",
        analytics_property: row[16] ? row[16].toString().trim() : "-"
        }
    };
    PrintLogger(responseObject);
    return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
}

function handlePost(req,sheet) {
    var subdomainsParam = req.parameter.subdomains;
    var buildReqParam = req.parameter.build_required;
    var subdomainParam = req.parameter.subdomain;

    var subdomainPresent = true;
    var buildParamPresent = true;
  
    var values = sheet.getDataRange().getValues(); // Get all the data from the sheet

    if (!subdomainsParam) {
        subdomainPresent = false;
    }

    if (!buildReqParam && !subdomainParam) {
        buildParamPresent = false;
    }

    if(subdomainPresent === true){
        var subdomainsList = subdomainsParam.split(',').map(function(subdomain) {
            return subdomain.trim();
        });
        var matchingRows = values.slice(1).filter(function(row) {
            return subdomainsList.includes(row[3].toString().trim()); // Check if sub_domain matches
        });
        // If no rows were found matching the subdomains, return a message
        if (matchingRows.length === 0) {
            return createErrorResponse("No matching subdomain's found!",true);
        }
        var newBuildRequired = generateRandomNumber(); 
        matchingRows.forEach(function(row) {
            var rowIndex = values.indexOf(row);  // Get the row index (1-based)
            // Update the build_required column (column 1)
            sheet.getRange(rowIndex + 1, 1).setValue(newBuildRequired);
        });
        var responseObject = {
            build_required: newBuildRequired,
            app_lists: matchingRows.map(function(row) {
                return {
                    build_required: newBuildRequired,
                    version: (parseFloat(row[1]) + 0.1).toFixed(1),
                    version_code: parseInt(row[2]) + 1,
                    sub_domain: row[3].toString().trim(),
                    key_file_name: row[4].toString(),
                    alias_name: row[5].toString(),
                    password: row[6].toString().trim(),
                    android_package_name: row[7].toString(),
                    operator_name: row[8].toString(),
                    base_url: row[9].toString().trim(),
                    country_name: row[10].toString().trim(),
                    developer_name: row[11] ? row[11].toString().trim() : "-",
                    last_app_published_date: row[12] ? row[12].toString().trim() : "-",
                    playstore_link: row[13] ? row[13].toString().trim() : "-",
                    region: row[14] ? row[14].toString().trim() : "-",
                    analytics_email: row[15] ? row[15].toString().trim() : "-",
                    analytics_property: row[16] ? row[16].toString().trim() : "-"
                };
            })
        };
        PrintLogger(responseObject);
        return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
    }

    if(buildParamPresent === true){
        var matchingRows = values.slice(1).filter(function(row) {
            return row[0] == buildReqParam && subdomainParam == row[3].toString().trim();
        });
    
        if (matchingRows.length === 0) {
            return createErrorResponse("No matching Build Generation Number found.",true);
        }
        // Update the build_required to 200 for all matching rows
        matchingRows.forEach(function(row) {
            var rowIndex = values.indexOf(row); // Get the row index (1-based)
            // Update the build_required column (column 1) to 200
            sheet.getRange(rowIndex + 1, 1).setValue(200); // Set build_required (column 1)
        });

        // Create the response object
        var responseObject = {
            code: 200,
            message: "Build generation updated successfully",
        };
        PrintLogger(responseObject);
        return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
    }
    return createErrorResponse("An error occured.",true);  
}

function generateRandomNumber() {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number
}

function logRequest(logSheet, empid, req) {
  var currentTime = new Date();
  var lastRow = logSheet.getLastRow() + 1;

  // Add header row if the sheet is empty
  if (lastRow === 1) {
    logSheet.appendRow(["Serial Number", "Employee ID", "Time of Execution", "Request Data", "Source Info"]);
  }

  var requestData = JSON.stringify(req.parameters);
  var sourceInfo = req.parameter["user_agent"] || "Unknown";  // Extracting if passed manually

  logSheet.appendRow([lastRow - 1, empid, currentTime, requestData, sourceInfo]);
}

function findRowBySubdomain(subdomain, data) {
    const subdomainColumnIndex = 3;  // Subdomain column index (0-based)
    for (let i = 1; i < data.length; i++) {
      if (data[i][subdomainColumnIndex].toString().trim() === subdomain) {
        return i + 1;  // Return 1-based index
      }
    }
    return -1;  // Not found
}

function doPost(req) {
    try {
        var jsonData = JSON.parse(req.postData.contents);
        var is_login = jsonData.is_login === true || jsonData.is_login === 'true';
        
        // var is_login = true;

        if(is_login){
            try {
                
                var credentialSheet = credentialsSheet();
                
                if (!credentialSheet) {
                  return createErrorResponse("Sheet 'credentials' not found.",true);
                }

                var credentialSheetValues = credentialSheet.getDataRange().getValues();
                
                PrintLogger("credentialSheetValues => ",credentialSheetValues);
            
                var empid = jsonData.emp_id || null;
                var empemail = jsonData.emp_email || null;
                var emppassword = jsonData.emp_pass || null;

                if(!empid || !empemail || !emppassword){
                  return createErrorResponse("Mandatory fields are missing.",true);
                }
                
                return employeelogin(empid,empemail,emppassword,credentialSheetValues,credentialSheet);
        
            }catch (error) {
              return createErrorResponse("Error login: " + error.message,true);
            }
        }

        var empid = jsonData.empid;
        var authtoken = jsonData.authtoken;
        var response = isValidToken(authtoken, empid);
        if (response.code === 200) {
            var is_update = jsonData.is_update === true || jsonData.is_update === 'true';
            
            var sheet = fetchAppSheet();
            if (sheet == -1) {
            return createErrorResponse("Sheet 'APPLISTS' not found.",true);
            }

            var values = sheet.getDataRange().getValues();
            var originalRowIndex = findRowBySubdomain(jsonData.subDomain, values);
        
            var rowData = [
                jsonData.buildRequired,
                jsonData.version,
                jsonData.versionCode,
                jsonData.subDomain,
                jsonData.keyFile,
                jsonData.aliasName,	
                jsonData.password,
                jsonData.packageName,	
                jsonData.operatorName,	
                jsonData.baseUrl,
                jsonData.countrySelection,
                jsonData.developerName,
                jsonData.lastUpdatedOn,	
                jsonData.googlePlayStoreLink,
                jsonData.region,
                jsonData.analyticsEmailId,
                jsonData.analyticsPropertyName
            ];

            if(originalRowIndex==-1){
                sheet.appendRow(rowData);
                var successResponse = {
                    code: 200,
                    message: "Data inserted successfully."
                };
                return ContentService.createTextOutput(JSON.stringify(successResponse)).setMimeType(ContentService.MimeType.JSON);
            }else{
                if(is_update){
                    sheet.getRange(originalRowIndex, 1, 1, rowData.length).setValues([rowData]);
                    return ContentService.createTextOutput(JSON.stringify({
                        code: 200,
                        message: "Data updated successfully."
                    })).setMimeType(ContentService.MimeType.JSON);
                }else{
                return createErrorResponse("Subdomain is already presents. Kindly Update.",true);
                }    
            }
        } else {
            PrintLogger("Token validation failed: " + response.message);
            return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
        }
        
    } catch (error) {
      return createErrorResponse("Error: " + error.message,true);
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
  
function employeelogin(empId,empEmail, empPass, svalues,empsheet){
    
    var empToken = generateAccessToken(empId); // Token Generation
    var encrytppass = encryptPassword(empPass.toString().trim());
    originalRowIndex = findRowIndex(empId,empEmail, encrytppass, svalues);
    
    filteredRows = svalues.slice(1).filter(row => row[0].toString().trim()==empId.toString().trim() && row[1].toString().trim()==empEmail.toString().trim() && row[2].toString().trim()==encrytppass );
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
        empsheet.getRange(originalRowIndex, 4).setValue(empToken);
        empsheet.getRange(originalRowIndex, 5).setValue(getFormattedDate());
        return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
    }else{
      return createErrorResponse("Credentials are wrong",true);
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

function isValidToken(token, secretkey) {
    var sheetId = "1CwOPtJ-uCFyz683gruhlsAOm6WxbUXlymub4xLveeZI";
    var credentialsdoc = SpreadsheetApp.openById(sheetId);
    var credentialSheet = credentialsdoc.getSheetByName('credentials');

    if (!credentialSheet) {
        return createErrorResponse("Sheet 'credentials' not found.");
    }

    var credentialSheetValues = credentialSheet.getDataRange().getValues();
    var filteredRows = credentialSheetValues.slice(1).filter(row => row[3].toString().trim() === token);

    if (filteredRows.length === 0) {
        return createErrorResponse("Access Token Invalid!");
    }

    try {
        var savedTimestamp = filteredRows[0][4].toString().trim();
        var padding = '='.repeat((4 - (token.length % 4)) % 4);
        var decodedToken = Utilities.newBlob(
            Utilities.base64DecodeWebSafe(token + padding)
        ).getDataAsString();

        var [decodedSecret, timestamp, randomValue] = decodedToken.split(":");

        if (decodedSecret === secretkey) {
            var currentTimestamp = new Date().getTime();
            var differenceInSeconds = Math.floor((savedTimestamp - currentTimestamp) / 1000);

            if (differenceInSeconds <= 0) {
                return createErrorResponse("Access Token Expired!");
            }

            return {
                code: 200,
                message: "Access Token Valid!",
                differenceInSeconds: differenceInSeconds,
                employee_data: filteredRows.map(row => ({
                    emp_id: row[0],
                    emp_email: row[1]
                }))
            };
        } else {
            return createErrorResponse("Access Token Invalid!");
        }
    } catch (error) {
        return createErrorResponse("Access Token Invalid! " + error.message);
    }
}

function createErrorResponse(message,is_json_Return=false) {
    var errorResponse = {
      code: 400,
      message: message
    };
    console.log(errorResponse);
    if(is_json_Return){
      return ContentService.createTextOutput(JSON.stringify(errorResponse)).setMimeType(ContentService.MimeType.JSON);
    }else{
      return errorResponse;
    } 
}

function fetchAppSheet(){
    var sheetId = "1_rqv6H1fKyt2TbvfHP9UyDkr0DRSvpTSJdOAFruIsw4";
    var doc = SpreadsheetApp.openById(sheetId);
    var sheet = doc.getSheetByName('APPLISTS');

    if (!sheet) {
      return -1;
    }

    return sheet;
}

function logSheet(){
    var sheetId = "1_rqv6H1fKyt2TbvfHP9UyDkr0DRSvpTSJdOAFruIsw4";
    var doc = SpreadsheetApp.openById(sheetId);
    var logSheet = doc.getSheetByName('LOGSHEET') || doc.insertSheet('LOGSHEET');

    if (!logSheet) {
      return -1;
    }

    return logSheet;
}

function credentialsSheet(){
    var sheetId = "1CwOPtJ-uCFyz683gruhlsAOm6WxbUXlymub4xLveeZI";
    var credentialsdoc = SpreadsheetApp.openById(sheetId);
    var credentialSheet = credentialsdoc.getSheetByName('credentials');
    return credentialSheet;
}

function PrintLogger(logdata){
    console.log(logdata);
}