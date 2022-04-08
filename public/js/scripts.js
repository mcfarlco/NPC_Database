const baseUrl = "http://flip3.engr.oregonstate.edu:4462";
// const baseUrl = "localhost:4462";

// Function to prevent editing inputs of a provided row
const disableRow = (rowEle) => {
  for (var element in rowEle) {
    if (rowEle[element].localName == "td") {
      rowEle[element].firstElementChild.setAttribute("readonly", "");
    };
  };
};

// Function to enable editing inputs of a provided row
const enableRow = (rowEle) => {
  for (var element in rowEle) {
    if (rowEle[element].localName == "td") {
      rowEle[element].firstElementChild.removeAttribute("readonly");
    };
  };
};

// Function to change button based on whether input is editable
const toggleUpdateButton = (rowEle) => {
  for (i = 0; i < rowEle.length; i++) {
    if (rowEle[i].nodeName == "TD") {
      console.log(rowEle[i].firstElementChild.name);
      if (rowEle[i].firstElementChild.name == "update-row") {
        rowEle[i].firstElementChild.name = "edit-done";
        rowEle[i].firstElementChild.textContent = "Done";

      } else if (rowEle[i].firstElementChild.name == "delete-row") {
        rowEle[i].firstElementChild.name = "cancel-row";
        rowEle[i].firstElementChild.textContent = "Cancel";
        console.log(rowEle);
        enableRow(rowEle);
      } else if (rowEle[i].firstElementChild.name == "edit-done") {
        rowEle[i].firstElementChild.name = "update-row";
        rowEle[i].firstElementChild.type = "button";
        rowEle[i].firstElementChild.textContent = "Update";
      } else if (rowEle[i].firstElementChild.name == "cancel-row") {
        rowEle[i].firstElementChild.name = "delete-row";
        rowEle[i].firstElementChild.textContent = "Delete";
        disableRow(rowEle);
      }
    }
  }
};

if (document.getElementById("databaseTable")) {
  console.log("Table Loaded");
  var table = document.getElementById("databaseTable");

  document.querySelector('#databaseTable').onclick = async (event) => {
    let target = event.target;
    console.log(target.tagName);
    if (target.tagName == "BUTTON") {
      var row = target.parentElement.parentElement.childNodes;
      var headerRow = target.parentElement.parentElement.parentElement.firstChild.childNodes;

      if (target.name == "update-row") {
        toggleUpdateButton(row);
        console.log("Toggle to edit");
        return;
      };

      if (target.name == "cancel-row") {
        toggleUpdateButton(row);
        console.log("Edit cancelled");
        return;
      };

      if (target.name == "edit-done") {
        var payload = {table: new URLSearchParams(window.location.search).get('table')}

        console.log(headerRow);
        console.log(row);

        for (i=0; i < headerRow.length; i++){
          if (headerRow[i].nodeName == "TH"){
            tableKey = headerRow[i].firstChild.data
            payload[tableKey] = row[i].firstElementChild.value
          }
        }

        console.log(payload);
        req.open('POST', baseUrl + "/update");
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify(payload));
        req.addEventListener("load", function() {
          if (req.status >= 200 && req.status < 400) {
            var response = JSON.parse(req.responseText);
            deleteTable();
            makeTable(response.results);
          } else {
            console.log("Error in network request: " + req.statusText);
          }
        });
      };

      if (target.name == "delete-row") {
        req.open('POST', baseUrl);
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify(payload));
        req.addEventListener("load", function() {
          if (req.status >= 200 && req.status < 400) {
            var response = JSON.parse(req.responseText);
            deleteTable();
            makeTable(response.results);
          } else {
            console.log("Error in network request: " + req.statusText);
          }
        });
      };
    };
  };
};
