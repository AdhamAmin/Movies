// 1. Go to https://sheets.google.com/ and create a NEW Sheet.
// 2. Name it "Waitlist Data" (or whatever you like).
// 3. Click "Extensions" > "Apps Script" in the top menu.
// 4. Paste this code into the editor (replace existing code).
// 5. Save the project (File > Save).
// 6. Click "Deploy" > "New deployment".
// 7. Select type: "Web app".
// 8. Description: "Waitlist API".
// 9. Execute as: "Me".
// 10. Who has access: "Anyone" (Critical step!).
// 11. Click "Deploy".
// 12. Copy the "Web App URL" and paste it into d:/WaitList/script.js.

function doPost(e) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Parse data
    var data;
    try {
        data = JSON.parse(e.postData.contents);
    } catch (error) {
        // If simple form post
        data = e.parameter;
    }

    var name = data.name;
    var email = data.email;
    // Determine the next row. Start at row 7 if sheet is empty or below row 7.
    var lastRow = sheet.getLastRow();
    var targetRow = Math.max(lastRow + 1, 7);

    // Set values in specific columns:
    // Column B (2) = Name
    // Column C (3) = Email
    sheet.getRange(targetRow, 2).setValue(name);
    sheet.getRange(targetRow, 3).setValue(email);

    // Return success
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
        .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
    return ContentService.createTextOutput("Waitlist API is running.");
}
