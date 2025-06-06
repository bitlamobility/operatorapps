// Global Configuration
const SHEET_ID = "1knNG4KInzBRq0VlUZUjhU_DLX0peZtzZUZTA5wg6SJY";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cached Sheet Management
let APP_LISTS_SHEET = null;
let CREDENTIALS_SHEET = null;
let APP_LISTS_CACHE = null;
let CREDENTIALS_CACHE = null;

// Safe Execution Wrapper
function safeExecute(fn) {
    try {
        return fn();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return createJsonResponse(`Execution error: ${error.message}`, true, 500);
    }
}

// Efficient Sheet Fetching
function fetchAppSheet() {
    if (!APP_LISTS_SHEET) {
        const doc = SpreadsheetApp.openById(SHEET_ID);
        APP_LISTS_SHEET = doc.getSheetByName('APPLISTS');
    }
    return APP_LISTS_SHEET || -1;
}

function credentialsSheet() {
    if (!CREDENTIALS_SHEET) {
        const credentialsdoc = SpreadsheetApp.openById(SHEET_ID);
        CREDENTIALS_SHEET = credentialsdoc.getSheetByName('credentials');
    }
    return CREDENTIALS_SHEET || -1;
}

// Cached Data Range
function cacheDataRange(sheet) {
    return {
        values: sheet.getDataRange().getValues(),
        timestamp: new Date().getTime()
    };
}

// Main Entry Point
function doGet(req) {
    return safeExecute(() => {
        const {
            empid = '', emppass = '', authtoken = '', 
            subdomains = '', subdomain = '', newPass = '', 
            build_number = '', is_from_script = false,
            update_entry = false, create_entry = false,
            fetch_entry = false, fetch_only_subdomain = false,
            forgetpass = false, emplogin = false,
            datahash = '',isFetchToken = false
        } = req.parameter;

        // empid = '', emppass = '', authtoken = '', 
        //     subdomains = '', subdomain = '', newPass = '', 
        //     build_number = '', is_from_script = false,
        //     update_entry = false, create_entry = false,
        //     fetch_entry = false, fetch_only_subdomain = false,
        //     forgetpass = false, emplogin = false,
        //     datahash = '',isFetchToken = true

        const appListsSheet = fetchAppSheet();
        const credentialSheet = credentialsSheet();

        if (is_from_script) {
            if (build_number && subdomain && update_entry) {
                return buildNumberRevert(appListsSheet, build_number, subdomain);
            } else if (build_number && fetch_entry) {
                return fetchScriptAppLists(appListsSheet, build_number);
            }
        }

        if (forgetpass) {
            if (empid && newPass && authtoken) {
                return forgetPasswordTwo(credentialSheet, empid, authtoken, newPass);
            } else if (empid) {
                return forgetPasswordOne(credentialSheet, empid);
            }
        }

        if (emplogin && empid && emppass) {
            return employeelogin(credentialSheet, empid, emppass);
        }

        if (authtoken && empid) {
            const response = isValidToken(credentialSheet, authtoken, empid);
            if (response.code === 200) {
                if (fetch_only_subdomain && subdomain) {
                    return fetchOnlySubdomain(appListsSheet, subdomain);
                }

                if (update_entry && subdomain && datahash) {
                    return updateOperatorEntry(appListsSheet, subdomain, datahash, empid);
                }

                if (create_entry && datahash) {
                    return newOperatorEntry(appListsSheet, datahash);
                }

                if (authtoken && fetch_entry) {
                    return fetchAppLists(appListsSheet);
                } else if (authtoken && subdomains) {
                    return buildNumberGeneration(appListsSheet, subdomains);
                }
            }
            return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
        }

        if(isFetchToken){
          return fetchToken(credentialSheet);
        }

        return createJsonResponse("No matching requests!", true);
    });
}

// Utility Functions
function createJsonResponse(message, is_json_Return = false, code = 400) {
    const response = {
        code: code,
        message: message
    };
    
    return is_json_Return
        ? ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)
        : response;
}

function findRowBySubdomain(subdomain, data) {
    const subdomainColumnIndex = 3;
    return data.findIndex((row, index) => 
        index > 0 && row[subdomainColumnIndex].toString().trim() === subdomain
    ) + 1;
}

function findRowIndex(empId, empPass, svalues, onlyempId = false) {
    return svalues.findIndex((row, index) => 
        index > 0 && 
        (onlyempId 
            ? row[0].toString().trim() === empId
            : row[0].toString().trim() === empId && row[2].toString().trim() === empPass)
    ) + 1;
}

function generateAccessToken(secret, options = {}) {
    const { 
        setdays = true, 
        dvalue = 2, 
        setmin = false, 
        fgetotp = "" 
    } = options;

    const timestamp = getFormattedDate(setdays, dvalue, setmin);
    const randomValue = Math.floor(Math.random() * 1000000).toString();
    
    const token = fgetotp 
        ? `${secret}:${timestamp}:${randomValue}k${fgetotp}`
        : `${secret}:${timestamp}:${randomValue}`;
    
    return Utilities.base64EncodeWebSafe(token).replace(/=+$/, '');
}

function SixDigitOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
}

function decodeAccessToken(encodedToken) {
    const base64String = encodedToken
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const decodedBytes = Utilities.base64Decode(base64String);
    return Utilities.newBlob(decodedBytes).getDataAsString();
}

function encryptPassword(password) {
    return Utilities.base64Encode(Utilities.newBlob(password).getBytes());
}

function isValidToken(credentialSheet, token, secretkey) {
    const credentialSheetValues = credentialSheet.getDataRange().getValues();
    const filteredRows = credentialSheetValues.slice(1).filter(row => row[3].toString().trim() === token);

    if (filteredRows.length === 0) {
        return createJsonResponse("Access Token Invalid!-1");
    }

    try {
        const savedTimestamp = filteredRows[0][4].toString().trim();
        const decodedToken = decodeAccessToken(token);

        const [decodedSecret, timestamp, randomValue] = decodedToken.split(":");

        if (decodedSecret === secretkey) {
            const currentTimestamp = new Date().getTime();
            const differenceInSeconds = Math.floor((savedTimestamp - currentTimestamp) / 1000);

            if (differenceInSeconds <= 0) {
                return createJsonResponse("Access Token Expired!");
            }

            return {
                code: 200,
                message: "Access Token Valid!",
                differenceInSeconds: differenceInSeconds,
                employee_data: filteredRows.map(row => ({
                    emp_id: row[0],
                    emp_email: row[1],
                    emp_role: row[6]
                }))
            };
        } else {
            return createJsonResponse("Access Token Invalid!-2");
        }
    } catch (error) {
        return createJsonResponse("Access Token Invalid!-3 " + error.message);
    }
}

function decryptPassword(base64String) {
    let standardBase64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
    
    let padding = standardBase64.length % 4;
    if (padding > 0) {
      standardBase64 += '='.repeat(4 - padding);
    }
    
    const decodedBytes = Utilities.base64Decode(standardBase64);
    return Utilities.newBlob(decodedBytes).getDataAsString();
}

function getFormattedDate(setdays = true, dvalue = 2, setmin = false) {
    const currentDate = new Date();
    if (setdays) {
        currentDate.setDate(currentDate.getDate() + dvalue);
    }
    if (setmin) {
        currentDate.setMinutes(currentDate.getMinutes() + dvalue);
    }
    return currentDate.getTime();
}


function sendOtpEmail(recipient,otp,updateEmail=false,update_subject="",oldData="",newData="",empID="") {

    if(updateEmail){
        var subject = update_subject;
        var body = createComparisonTable(oldData, newData,empID);
        console.log(body);
    }else{
        var subject = "Your One-Time Password (OTP) for Account Verification";  // Email subject
        
        // Email body with OTP
        var body = `
        <p>Dear User,</p>
        <p>We received a request to verify your account. Please use the following One-Time Password (OTP) to complete the process:</p>
        <p><strong>OTP: ${otp}</strong></p>
        <p>This OTP is valid for 10 minutes only and can only be used once.</p>
        <p>If you did not request this OTP, please ignore this email or contact support immediately.</p>
        <p>Thank you,<br>The Support Team</p>
        `;  // HTML email body
    }
    // Send the OTP email
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: body,  // Plain text version of the body
      htmlBody: body,  // HTML version of the body
      name: "Bitla Software Pvt. Ltd",
      from: "bitlatsapp@bitlasoft.com"
    });
  
    // Logger.log("OTP email sent successfully to " + recipient);
}

function createComparisonTable(oldData, newData, empID) {
    var headers = [
        "Build Required", "Version", "Version Code", "Sub Domain", "Key File", 
        "Alias Name", "Password", "Package Name", "Operator Name", "Base Url", 
        "Country selection", "Developer Name", "Last Updated On", "Google Play Store Link", 
        "Region", "Analytics Email id", "Analytics Property Name"
    ];
    
    var table = '<table border="1" style="border-collapse:collapse; width:100%;border: 2px solid #000;">';
    table += '<tr><th style="background-color:#d9d9d9;border: 2px solid black;padding-left:5px;">Field</th><th style="padding-left:5px;background-color:#d9d9d9;border: 2px solid black;"><b>Old Data</th><th style="padding-left:5px;background-color:#d9d9d9;border: 2px solid black;">New Data</th></tr>';

    for (var i = 0; i < headers.length; i++) {
        const oldValue = oldData[i] || 'N/A';
        const newValue = newData[i] || 'N/A';
        //const isChanged = oldValue !== newValue;
        const isChanged = String(oldValue).trim() !== String(newValue).trim();

        table += `<tr>
                    <td style="border: 2px solid black;padding-left:5px;">${headers[i]}</td>
                    <td style="border: 2px solid black;padding-left:5px;">${oldValue}</td>
                    <td style="${isChanged ? 'background-color: red; color: white;' : ''} border: 2px solid black;padding-left:5px;">${newValue}</td>
                  </tr>`;
    }

    table += '</table>';
    return `<div>
                <p>Dear Team,</p>
                <p>The following data has been updated:</p>
                ${table}
                <p>Updated by Employee ID: <strong>${empID}</strong></p>
                <p>Updates on: <strong>${formatDate(new Date())}</strong></p>
                <p>Best regards,</p>
                <p>Bitla Software</p>
            </div>`;
}
  
// Function to generate a random 6-digit OTP
function generateOtp() {
    var otp = Math.floor(100000 + Math.random() * 900000);  // Generates a 6-digit number
    return otp.toString();  // Returns OTP as a string
}
  

//  API Functions
function buildNumberRevert(appListsSheet, build_number,subdomain){

    var values = appListsSheet.getDataRange().getValues();

    var matchingRows = values.slice(1).filter(function(row) {
        return row[0] == build_number && subdomain == row[3].toString().trim();
    });

    if (matchingRows.length === 0) {
        return createJsonResponse("No matching Build Number found.",true);
    }
    matchingRows.forEach(function(row) {
        var rowIndex = values.indexOf(row);
        appListsSheet.getRange(rowIndex + 1, 1).setValue(200); 
    });
    return createJsonResponse("Build Number updated successfully",true,200);
}

function fetchScriptAppLists(appListsSheet,build_number){
    var values = appListsSheet.getDataRange().getValues();
    var filteredRows = values.slice(1).filter(row => row[0].toString().trim() === build_number.toString().trim());    
    if (filteredRows.length > 0) {
        filteredRows.forEach((row) => {
            var version = parseFloat(row[1]);
            var versionCode = parseInt(row[2]);
            var subDomain = row[3].toString().trim();
            var originalRowIndex = findRowBySubdomain(subDomain, values);

            appListsSheet.getRange(originalRowIndex, 2).setValue((version + 0.1).toFixed(1));
            appListsSheet.getRange(originalRowIndex, 3).setValue(versionCode + 1);
        });
    }
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

function employeelogin(credentialSheet,empId,empPass){
    var svalues = credentialSheet.getDataRange().getValues();
    var empToken = generateAccessToken(empId);
    var encrytppass = encryptPassword(empPass.toString().trim());
    originalRowIndex = findRowIndex(empId, encrytppass, svalues);
    
    filteredRows = svalues.slice(1).filter(row => row[0].toString().trim()==empId.toString().trim() && row[2].toString().trim()==encrytppass );
    if (filteredRows.length > 0){
        var responseObject = {
            code: 200,
            message: "Logged In Successfully",
            data: filteredRows.length > 0 ? {
                      empid: filteredRows[0][0],
                      empEmail: filteredRows[0][1],
                      empRole: filteredRows[0][6],
                      empToken: empToken
            } : {} // In case filteredRows is empty, set data to null
        };
        /*
        data: {
                empid: empId.toString().trim(),
                empToken: empToken,
                emp_role: row[6]
            },
        */
        credentialSheet.getRange(originalRowIndex, 4).setValue(empToken);
        credentialSheet.getRange(originalRowIndex, 5).setValue(getFormattedDate());
        // console.log(responseObject);
        return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
    }else{
      return createJsonResponse("Wrong Credentials!",true);
    }
}

function forgetPasswordOne(credentialSheet,empId){
    var svalues = credentialSheet.getDataRange().getValues();
    fgetotp = SixDigitOTP();
    var forgetpasstoken = generateAccessToken(empId,{
                            setdays: false,
                            dvalue: 30,
                            setmin: true,
                            fgetotp: fgetotp
                          });
    originalRowIndex = findRowIndex(empId, "", svalues,true);
    
    filteredRows = svalues.slice(1).filter(row => row[0].toString().trim()==empId.toString().trim() && row[1].toString().trim()!= "" );
    if (filteredRows.length > 0){
        // fetch emp email from row[1]
        var empEmail = filteredRows[0][1];
        // console.log(empEmail);
        // console.log(forgetpasstoken);
        // console.log(fgetotp);
        sendOtpEmail(empEmail,fgetotp);

        var responseObject = {
            code: 200,
            message: "OTP sent Successfully",
            data: {
                fgetToken: forgetpasstoken
            }
        };
        credentialSheet.getRange(originalRowIndex, 6).setValue(forgetpasstoken);
        // console.log(responseObject);
        return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
    }else{
        return createJsonResponse("Wrong Credentials!",true);
    }
}

function forgetPasswordTwo(credentialSheet,empId,token, newPass){
    var svalues = credentialSheet.getDataRange().getValues();
    originalRowIndex = findRowIndex(empId, "", svalues,true);
    //console.log("sadwww",token);
    filteredRows = svalues.slice(1).filter(row => row[0].toString().trim()==empId.toString().trim() && row[5].toString().trim()==token );
    if (filteredRows.length > 0){
       // console.log("sadwww");
        var encrypt_pass = encryptPassword(newPass);

        var responseObject = {
            code: 200,
            message: "Password Updated Successfully"
        };
        credentialSheet.getRange(originalRowIndex, 3).setValue(encrypt_pass);
        credentialSheet.getRange(originalRowIndex, 6).setValue("");
        // console.log(responseObject);
        return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
    }else{
      //console.log("sad");
      return createJsonResponse("Wrong Credentials!",true);
    }
}

function fetchAppLists(appListsSheet){
    var values = appListsSheet.getDataRange().getValues();
    var filteredRows = values.slice(1).filter(row => row[7]);
    
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
            analytics_property: row[16] ? row[16].toString().trim() : "-",
            travel_code: row[17] ? row[17].toString().trim() : "-",
            website_link: row[18] ? row[18].toString().trim() : "-",
            video_splash: row[19] ? row[19].toString() : "N"
            };
        })
    };
    console.log(responseObject);
    return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
}

function buildNumberGeneration(appListsSheet,subdomains){
    var values = appListsSheet.getDataRange().getValues();
    var subdomainsList = subdomains.split(',').map(function(subdomain) {
        return subdomain.trim();
    })
    var matchingRows = values.slice(1).filter(function(row) {
        return subdomainsList.includes(row[3].toString().trim()); // Check if sub_domain matches
    });
    if (matchingRows.length === 0) {
        console.log("No matching subdomain's found!");
        return createJsonResponse("No matching subdomain's found!",true);
    }
    // var newBuildRequired = generateRandomNumber(); 
    var newBuildRequired = Math.floor(100000 + Math.random() * 900000);
    matchingRows.forEach(function(row) {
        var rowIndex = values.indexOf(row);  // Get the row index (1-based)
        // Update the build_required column (column 1)
        appListsSheet.getRange(rowIndex + 1, 1).setValue(newBuildRequired);
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
                analytics_property: row[16] ? row[16].toString().trim() : "-",
                travel_code: row[17] ? row[17].toString().trim() : "-",
                website_link: row[18] ? row[18].toString().trim() : "-",
                video_splash: row[19] ? row[19].toString() : "N"
            };
        })
    };   
    console.log(responseObject);
    return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
}

function fetchOnlySubdomain(appListsSheet,subdomain){
    var values = appListsSheet.getDataRange().getValues();
    var filteredRows = values.slice(1).filter(row => row[3]==subdomain);
    
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
            last_app_published_date: row[12] ? formatDate(row[12].toString().trim()) : "-",
            playstore_link: row[13] ? row[13].toString().trim() : "-",
            region: row[14] ? row[14].toString().trim() : "-",
            analytics_email: row[15] ? row[15].toString().trim() : "-",
            analytics_property: row[16] ? row[16].toString().trim() : "-",
            travel_code: row[17] ? row[17].toString().trim() : "-",
            website_link: row[18] ? row[18].toString().trim() : "-",
            video_splash: row[19] ? row[19].toString() : "N"
            };
        })
    };
    console.log(responseObject);
    return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
}

function updateOperatorEntry(appListsSheet, oldsubdomain, datahash, empid) {
    try {
        // Decrypt datahash (assumes Base64 encoded JSON string)
        var decodedBase64 = decodeURIComponent(datahash); // Step 1: Decode the URL-safe string
        var jsonString = Utilities.newBlob(Utilities.base64Decode(decodedBase64)).getDataAsString(); // Step 2: Base64 decode
        var decryptedData = JSON.parse(jsonString);
        //console.log(decryptedData);
        // Get all data from the sheet
        var values = appListsSheet.getDataRange().getValues();

        // console.log(values);

        // Find the original row index (adjusted for header)
        var originalRowIndex = findRowBySubdomain(oldsubdomain, values);
        if (originalRowIndex === -1) {
            return createJsonResponse("Subdomain not found!", false);
        }
        // console.log(originalRowIndex);
        var oldData = values[originalRowIndex-1];
        oldData[12] = formatDate(oldData[12]);
        // console.log("oldd=>",oldData);
        //Update the row with new data
        var updatedRow = [...oldData];
        // var updatedRow = values[originalRowIndex];
        // console.log("updatedRow=>",updatedRow);
        updatedRow[1] = decryptedData.version_name;    // Assuming column B is Version Name
        updatedRow[2] = decryptedData.version_code;    // Assuming column C is Version Code
        updatedRow[3] = decryptedData.subDomain;       // Assuming column D is Sub Domain
        updatedRow[4] = decryptedData.keyFile;        // Assuming column E is Key File Name
        updatedRow[5] = decryptedData.aliasName;      // Assuming column F is Alias Name
        updatedRow[6] = decryptedData.password;       // Assuming column G is Password
        updatedRow[7] = decryptedData.packageName;    // Assuming column H is Package Name
        updatedRow[8] = decryptedData.operatorName;   // Assuming column I is Operator Name
        updatedRow[9] = decryptedData.baseUrl;        // Assuming column J is Base URL
        updatedRow[10] = decryptedData.country;        // Assuming column K is Country
        updatedRow[11] = decryptedData.developerName;  // Assuming column L is Developer Name
        updatedRow[12] = formatDate(decryptedData.playstore_upload_date); // Assuming column M is Play Store Upload Date
        updatedRow[13] = decryptedData.playStoreLink;  // Assuming column N is Play Store Link
        updatedRow[14] = decryptedData.region;        // Assuming column O is Region
        updatedRow[15] = decryptedData.analyticsEmail; // Assuming column P is Analytics Email
        updatedRow[16] = decryptedData.analyticsProperty; // Assuming column Q is Analytics Property
        updatedRow[17] = decryptedData.travelCode; // Assuming column R is Travel Code

        // Update the row in the sheet
        var range = appListsSheet.getRange(originalRowIndex, 1, 1, updatedRow.length);
        range.setValues([updatedRow]);
        console.log(oldData);
        console.log(updatedRow);
        sendOtpEmail("mobileapp@bitlasoft.com","",true,"App Lists (Excel): Data Update Notification",oldData,updatedRow,empid)
        // Return success response
        return createJsonResponse("Update successful!", true,200);

    } catch (error) {
        console.log(error.message);
        return createJsonResponse(`Error updating data: ${error.message}`, false);
    }
}

function newOperatorEntry(appListsSheet, datahash) {
    try {
        // Decrypt datahash (assumes Base64 encoded JSON string)
        var decodedBase64 = decodeURIComponent(datahash); // Step 1: Decode the URL-safe string
        var jsonString = Utilities.newBlob(Utilities.base64Decode(decodedBase64)).getDataAsString(); // Step 2: Base64 decode
        var decryptedData = JSON.parse(jsonString);

        // Get all data from the sheet
        var values = appListsSheet.getDataRange().getValues();

        // Check if subDomain or packageName exists
        var rowIndex = findRowBySubdomainOrPackageName(decryptedData.subDomain, decryptedData.packageName, values);

        if (rowIndex === -1) {
            // Subdomain or packageName not found, insert a new row at the end
            var newRow = [
                200,                               // Build Required
                decryptedData.versionName || "", // Version
                decryptedData.versionCode || "", // Version Code
                decryptedData.subDomain || "",   // Sub Domain
                decryptedData.keyFile || "",     // Key File
                decryptedData.aliasName || "",   // Alias Name
                decryptedData.password || "",    // Password
                decryptedData.packageName || "", // Package Name
                decryptedData.operatorName || "", // Operator Name
                decryptedData.baseUrl || "",     // Base URL
                decryptedData.country || "",     // Country Selection
                decryptedData.developerName || "", // Developer Name
                formatDate(decryptedData.playStoreUploadDate|| new Date().toLocaleDateString()), // Last Updated On
                decryptedData.playStoreLink || "", // Google Play Store Link
                decryptedData.region || "",      // Region
                decryptedData.analyticsEmail || "", // Analytics Email ID
                decryptedData.analyticsProperty || "", // Analytics Property Name
                decryptedData.travelCode || "" // Travel Code
            ];

            // Append the new row
            appListsSheet.appendRow(newRow);

            // Return success response
            return createJsonResponse("New entry added successfully!", true, 200);
        } else {
           
            return createJsonResponse("Already Exists in the lists. Kindly cross check", true, 400);
        }
    } catch (error) {
        console.log(error.message);
        return createJsonResponse(`Error updating data: ${error.message}`, false);
    }
}

// Helper function to find row index by subDomain or packageName
function findRowBySubdomainOrPackageName(subDomain, packageName, values) {
    for (var i = 1; i < values.length; i++) { // Skip header row
        if (values[i][3] === subDomain || values[i][7] === packageName) { // Assuming columns D and H
            return i; // Return row index
        }
    }
    return -1; // Not found
}

function formatDate(inputDate) {
    const date = new Date(inputDate); // Convert the input string to a Date object
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function fetchToken(credentialSheet){
  var svalues = credentialSheet.getDataRange().getValues();
  var responseObject = {
      code: 200,
      message: "Token fetch Successfully",
      data: {
          token: svalues[1][7]
      }
  };
  // console.log(responseObject);
  return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
}
