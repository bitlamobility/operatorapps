function doGet(req) {
    var empid = req.parameter.empid;
    var emppass = req.parameter.emppass;
    var authtoken = req.parameter.authtoken;
    var subdomains = req.parameter.subdomains;
    var subdomain = req.parameter.subdomain;
    var newPass = req.parameter.newPass;
    var build_number = req.parameter.build_number;
    var is_from_script = req.parameter.is_from_script === 'true';
    var update_entry = req.parameter.update_entry === 'true';
    var create_entry = req.parameter.create_entry === 'true';
    var fetch_entry = req.parameter.fetch_entry === 'true';
    var fetch_only_subdomain = req.parameter.fetch_only_subdomain === 'true';
    var forgetpass = req.parameter.forgetpass === 'true';
    var emplogin = req.parameter.emplogin === 'true';
    var datahash = req.parameter.datahash;

    // var authtoken = "QlMxNjE0OjE3MzU5MTc0ODA4NjI6MjAwNjkw";
    // var empid = "BS1614";
    // var is_from_script = false;
    // var emppass = "";
    // var subdomains = "";
    // var subdomain = "aadi";
    // var build_number = "";
    // var update_entry = true;
    // var create_entry = false;
    // var fetch_entry = false;
    // var forgetpass = false;
    // var fetch_only_subdomain = false;
    // var emplogin = false;
    // var datahash = "eyJzdWJEb21haW4iOiJhYWRpIiwia2V5RmlsZSI6ImFhZGlzaGFrdGl0cmF2ZWxzLmprcyIsImFsaWFzTmFtZSI6ImFhZGlzaGFrdGl0cmF2ZWxzIiwicGFzc3dvcmQiOiJhbmRyb2lkMTIzIiwicGFja2FnZU5hbWUiOiJjb20uYml0bGEubWJhLmFhZGlzaGFrdGl0cmF2ZWxzIiwib3BlcmF0b3JOYW1lIjoiQWFkaXNoYWt0aSBUcmF2ZWxzZCIsImJhc2VVcmwiOiJodHRwczovL2FhZGkudGlja2V0c2ltcGx5LmNvbSIsImNvdW50cnkiOiJOIiwiZGV2ZWxvcGVyTmFtZSI6IkFhZGlzaGFrdGkgVHJhdmVscyIsInBsYXlTdG9yZUxpbmsiOiJodHRwczovL3BsYXkuZ29vZ2xlLmNvbS9zdG9yZS9hcHBzL2RldGFpbHM%2FaWQ9Y29tLmJpdGxhLm1iYS5hYWRpc2hha3RpdHJhdmVscyIsInJlZ2lvbiI6IlV0dGFyIFByYWRlc2giLCJhbmFseXRpY3NFbWFpbCI6ImJpdGxhbWJhYW5hbHl0aWNzMkBnbWFpbC5jb20iLCJhbmFseXRpY3NQcm9wZXJ0eSI6IkN1c3RvbWVyIEFwcCBHcm91cC1jIiwidmVyc2lvbl9uYW1lIjoiMTUuMiIsInZlcnNpb25fY29kZSI6IjE1MSIsInBsYXlzdG9yZV91cGxvYWRfZGF0ZSI6IjIwMjMtMDgtMTcifQ%3D%3D";
    // var newPass = ""


    var appListsSheet = fetchAppSheet();
    if (appListsSheet == -1) {
      return createJsonResponse("Sheet 'APPLISTS' not found.",true);
    }

    // var logSheet = logSheet();
    // if (logSheet == -1) {
    //     return createJsonResponse("Sheet 'LogSheet' not found.",true);
    // }

    var credentialSheet = credentialsSheet();
    if (credentialSheet == -1) {
      return createJsonResponse("Sheet 'credentials' not found.",true);
    }

    if(is_from_script){
        if(build_number!="" && subdomain!="" && update_entry){
            // Change Auto generated Build Number to 200 consider build generated
            return buildNumberRevert(appListsSheet,build_number,subdomain);

        }else if(build_number!="" && fetch_entry){
            // Fetch App list with respect of build number
            return fetchScriptAppLists(appListsSheet,build_number);

        }else{
            // Error File error
            return createJsonResponse("No matching requests!",true);
        }
    }
    if(forgetpass){
        //
        if (typeof empid === 'string' && empid.trim() !== "" && typeof newPass === 'string' && newPass.trim() !== "" && typeof authtoken === 'string' && authtoken.trim() !== "") {
            //console.log("daaa");
            //return createJsonResponse("No matching forget !",true);
            return forgetPasswordTwo(credentialSheet,empid, authtoken, newPass);
        }
        if(empid!=""){
            //return createJsonResponse("No matching forget 23!",true);
            //forget password
            // Step - 1: check empid valid or not
            // Step - 2: If valid check email id present or not? If email present sent email.
            // Step - 3: proceed next page with authtoken(valid for 30min) 
            // Step - 4: enter OTP(from email), newpass , confirmpass and token
            // Step - 5: Valid everything correct change password.
            return forgetPasswordOne(credentialSheet,empid);
        }
    }
    if(emplogin){
        //return createJsonResponse("No matching emplogin !",true);

        if(empid!="" && emppass!="") {
            return employeelogin(credentialSheet,empid,emppass);
        }
    }
    
    if(authtoken!="" && empid!=""){
        var response = isValidToken(credentialSheet,authtoken, empid);
        console.log("00"+JSON.stringify(response));
        if (response.code === 200) {
            if(fetch_only_subdomain && typeof subdomain === 'string' && subdomain.trim() !== ""){
                return fetchOnlySubdomain(appListsSheet,subdomain);
            }

            if(update_entry && typeof subdomain === 'string' && subdomain.trim() !== "" && typeof datahash === 'string' && datahash.trim() !== ""){
                // Consider update the entry with valid subdomain and also whatever data send only those data will update 
                // console.log("44");
                return updateOperatorEntry(appListsSheet,subdomain,datahash);

            }

            if(create_entry && typeof datahash === 'string' && datahash.trim() !== ""){
                // Consider this is new entry should append on the last row of excel
                console.log("33");
                return newOperatorEntry(appListsSheet,datahash);

            }

            if(authtoken!="" && fetch_entry){
                // Consider this is first fetch data to show in front UI
                console.log("11");
                return fetchAppLists(appListsSheet);
                
            }else if(authtoken!="" && subdomains!=""){
                // Consider this is required to generate Build Number
                console.log("22");
                return buildNumberGeneration(appListsSheet,subdomains);

            } else{
                console.log("55");
                // Throw error as there are no matching requests.
                return createJsonResponse("No matching requests!",true);
            }
        }else{
            console.log("66 Error => "+JSON.stringify(response));
            return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
        }
    }
       
    // Throw error as there are no matching requests.
    return createJsonResponse("No matching requests!",true);
    
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

function createJsonResponse(message,is_json_Return=false,code=400) {
    var response = {
      code: code,
      message: message
    };
    
    if(is_json_Return){
      return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
    }else{
      return response;
    } 
}

function findRowBySubdomain(subdomain, data) {
    const subdomainColumnIndex = 3;
    for (let i = 1; i < data.length; i++) {
      if (data[i][subdomainColumnIndex].toString().trim() === subdomain) {
        return i + 1;
      }
    }
    return -1;
}

function findRowIndex(empId, empPass, svalues,onlyempId=false) {
    for (let i = 1; i < svalues.length; i++) {
        if(onlyempId){
            if (svalues[i][0].toString().trim() === empId) {
                return i + 1;
            }
        }else{
            if (svalues[i][0].toString().trim() === empId && svalues[i][2].toString().trim() === empPass) {
                return i + 1;
            }
        }
       
    }
    return -1;
}

function generateAccessToken(secret,setdays=true,dvalue=2,setmin=false,fgetotp="") {
    //var timestamp = new Date().getTime().toString();
    var timestamp = getFormattedDate(setdays,dvalue,setmin)
    var randomValue = Math.floor(Math.random() * 1000000).toString();
    if(fgetotp!=""){
        var token = secret + ":" + timestamp + ":" + randomValue+"k"+fgetotp;
    }else{
        var token = secret + ":" + timestamp + ":" + randomValue;
    }
    var accessToken = Utilities.base64EncodeWebSafe(token).replace(/=+$/, '');
    //Logger.log("Generated Access Token: " + accessToken);
    return accessToken;
}

function SixDigitOTP(){
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

function decodeAccessToken(encodedToken) {
    // Convert URL-safe Base64 to standard Base64
    var base64String = encodedToken
        .replace(/-/g, '+')   // Replace `-` with `+`
        .replace(/_/g, '/');   // Replace `_` with `/`

    // Decode the Base64 string using Google Apps Script's Utilities.base64Decode
    var decodedBytes = Utilities.base64Decode(base64String);
    
    // Convert the bytes to a string (assuming UTF-8 encoding)
    var decodedString = Utilities.newBlob(decodedBytes).getDataAsString();
    
    return decodedString;
}

function encryptPassword(password) {
    return Utilities.base64Encode(Utilities.newBlob(password).getBytes());
}

function isValidToken(credentialSheet,token, secretkey) {

    var credentialSheetValues = credentialSheet.getDataRange().getValues();
    var filteredRows = credentialSheetValues.slice(1).filter(row => row[3].toString().trim() === token);

    if (filteredRows.length === 0) {
        return createJsonResponse("Access Token Invalid!-1");
    }

    try {
        var savedTimestamp = filteredRows[0][4].toString().trim();
        var decodedToken = decodeAccessToken(token);

        var [decodedSecret, timestamp, randomValue] = decodedToken.split(":");

        if (decodedSecret === secretkey) {
            var currentTimestamp = new Date().getTime();
            var differenceInSeconds = Math.floor((savedTimestamp - currentTimestamp) / 1000);

            if (differenceInSeconds <= 0) {
                return createJsonResponse("Access Token Expired!");
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
            return createJsonResponse("Access Token Invalid!-2");
        }
    } catch (error) {
        return createJsonResponse("Access Token Invalid!-3 " + error.message);
    }
}

function decryptPassword(base64String) {
    // Convert the URL-safe Base64 back to standard Base64
    let standardBase64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding ('=' characters) if necessary
    let padding = standardBase64.length % 4;
    if (padding > 0) {
      standardBase64 += '='.repeat(4 - padding);  // Add '=' to make length a multiple of 4
    }
    
    // Decode the Base64 string
    let decodedBytes = Utilities.base64Decode(standardBase64);
    
    // Convert bytes back to string
    let decodedString = Utilities.newBlob(decodedBytes).getDataAsString();
    
    return decodedString;
}

function getFormattedDate(setdays=true,dvalue=2,setmin=false) {
    var currentDate = new Date();  // Current date and time
    if(setdays){
        currentDate.setDate(currentDate.getDate() + dvalue);  // Add 2 days
    }
    if(setmin){
        currentDate.setMinutes(currentDate.getMinutes() + dvalue);
    }
    var timestamp = currentDate.getTime();  // Convert to timestamp
    // Logger.log("Updated Timestamp: " + timestamp);
    return timestamp;
}

function sendOtpEmail(recipient,otp,updateEmail=false,update_subject="",oldData="",newData="") {

    if(updateEmail){
        var subject = update_subject;
        var body = createComparisonTable(oldData, newData);
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
      htmlBody: body  // HTML version of the body
    });
  
    // Logger.log("OTP email sent successfully to " + recipient);
}

function createComparisonTable(oldData, newData) {
    var headers = [
        "Build Required", "Version", "Version Code", "Sub Domain", "Key File", 
        "Alias Name", "Password", "Package Name", "Operator Name", "Base Url", 
        "Country selection", "Developer Name", "Last Updated On", "Google Play Store Link", 
        "Region", "Analytics Email id", "Analytics Property Name"
    ];
    
    var table = '<table border="1" style="border-collapse:collapse; width:100%;">';
    table += '<tr><th>Field</th><th>Old Data</th><th>New Data</th></tr>';

    for (var i = 0; i < headers.length; i++) {
        const oldValue = oldData[i] || 'N/A';
        const newValue = newData[i] || 'N/A';
        const isChanged = oldValue !== newValue;
        
        table += `<tr>
                    <td>${headers[i]}</td>
                    <td>${oldValue}</td>
                    <td style="${isChanged ? 'background-color: red; color: white;' : ''}">${newValue}</td>
                  </tr>`;
    }

    table += '</table>';
    return `<div>
                <p>Dear Team,</p>
                <p>The following data has been updated:</p>
                ${table}
                <p>Best regards,</p>
                <p>Your System</p>
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
            data: {
                empid: empId.toString().trim(),
                empToken: empToken
            }
        };
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
    var forgetpasstoken = generateAccessToken(empId,false,30,true,fgetotp);
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
            analytics_property: row[16] ? row[16].toString().trim() : "-"
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
                analytics_property: row[16] ? row[16].toString().trim() : "-"
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
            analytics_property: row[16] ? row[16].toString().trim() : "-"
            };
        })
    };
    console.log(responseObject);
    return ContentService.createTextOutput(JSON.stringify(responseObject)).setMimeType(ContentService.MimeType.JSON);
}

function updateOperatorEntry(appListsSheet, oldsubdomain, datahash) {
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

        // Update the row in the sheet
        var range = appListsSheet.getRange(originalRowIndex, 1, 1, updatedRow.length);
        range.setValues([updatedRow]);
        console.log(oldData);
        console.log(updatedRow);
        sendOtpEmail("souvik.c@bitlasoft.com","",true,"App Lists (Excel): Data Update Notification",oldData,updatedRow)
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
                decryptedData.analyticsProperty || "" // Analytics Property Name
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
