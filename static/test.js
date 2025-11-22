Office.onReady((info) => {
  // Check that we loaded into Excel
  if (info.host === Office.HostType.Excel) {
    document.getElementById("helloButton").onclick = sayHello;
  } else {
    document.getElementById("helloButton").onclick = sayHelloInConsole;
  }
});

function sayHello() {
  Excel.run((context) => {
    // Insert text 'Hello world!' into cell A1.
    context.workbook.worksheets.getActiveWorksheet().getRange("A1").values = [
      ["Hello world!"],
    ];

    // sync the context to run the previous API call, and return.
    return context.sync();
  });
}

function sayHelloInConsole() {
  console.log("Hello world!");
}
