const express = require('express');
const hbrs = require('handlebars');
const handlebars = require('express-handlebars').create({
  defaultLayout: 'main'
});
const request = require('request');
const mysql = require('./dbcon');
const cors = require('cors');
const app = express();
var async = require('asyncawait/async');
var await = require('asyncawait/await');

app.use(express.urlencoded({
  extended: false
}));
app.use(express.json());
app.use(cors());
app.use(express.static('public'));
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 4462);


// Security checks
const tableArray = ["locations", "creature_types", "traits", "item_types", "npcs", "npc_traits", "items", "npc_items"]
const idKeyArray = ["npc_id", "item_id", "item_type_id", "location_id", "creature_type_id", "trait_id"]

// Function for SQL queries
let query = function(sql, values) {
  console.log(sql)
  return new Promise((resolve, reject) => {
    mysql.pool.getConnection(function(err, connection) {
      if (err) {
        console.log(err)
        resolve(err)
      } else {
        connection.query(sql, values, (err, rows) => {
          connection.release()
          if (err) {
            console.log(err)
            reject(err)
          } else {
            resolve(rows)
          }
        })
      }
    })
  })
};

// Handlebars helper to determine if value equals one of required three arguments
hbrs.registerHelper('ifEquals', function(arg1, arg2, arg3, arg4, options) {
  if (arg1 == arg2) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  } else if (arg1 == arg3) {
    return (arg1 == arg3) ? options.fn(this) : options.inverse(this);
  } else if (arg1 == arg4) {
    return (arg1 == arg4) ? options.fn(this) : options.inverse(this);
  } else {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
  };
});

// Handlebars helper to determine if value does not equal the provided argument
hbrs.registerHelper('ifNotEquals', function(arg1, arg2, options) {
  return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
});

// Handlebars helper to determine if value does not equal the provided argument
hbrs.registerHelper('ifInDo', function(arg1, arg2, options) {
  return (arg2.includes(arg1)) ? options.fn(this) : options.inverse(this);
});

// Handlebars helper to determine if value does not equal the provided argument
hbrs.registerHelper('ifInDont', function(arg1, arg2, options) {
  return (arg2.includes(arg1) == false) ? options.fn(this) : options.inverse(this);
});

// Render homepage
app.get("/", (req, res, next) => {
  console.log("Get request received");
  console.log(req.query);
  console.log("=====");
  var context = {};
  res.render("home", context);
});

// Render table
app.get("/table", (req, res, next) => {
  console.log("Table request received");
  console.log(req.query);
  console.log("=====");
  var context = {
    table: req.query.table,
    view: req.query.view
  };

  // Check if table is valid
  var s_check = tableArray.includes(context.table);
  if (s_check == false) {
    res.render("table", context);
    return
  }

  // Query and assignment for dropdown menu on items table
  if (context.table == "items") {
    const itemDropdownQuery = "SELECT item_type_id, item_type_name FROM item_types"

    mysql.pool.query(itemDropdownQuery, (err, rows, fields) => {
      if (err) {
        next(err);
        return;
      };

      // For each item in rows, save only the values
      var rowArray = []
      for (const key of Object.keys(rows)) {
        var value = rows[key];
        rowArray.push(Object.keys(value).map(function(e) {

          if (value[e] == null) {
            return ""
          } else {
            return value[e]
          };
        }));
      };

      // Assign array for handlebars
      context.item_types = rowArray;
    });


  }

  // Query to generate table
  const selectQuery = "SELECT * FROM ";

  mysql.pool.query(selectQuery + context.table, (err, rows, fields) => {
    if (err) {
      next(err);
      return;
    };

    var rowArray = []

    // Assign headers to first item of array
    var headerArray = []
    for (const key of Object.keys(fields)) {
      var header = fields[key];
      headerArray.push(header.name)
    };
    rowArray.push(headerArray);

    // For each item in rows, add only the values to array
    for (const key of Object.keys(rows)) {
      var value = rows[key];
      rowArray.push(Object.keys(value).map(function(e) {

        if (value[e] == null) {
          return ""
        } else {
          return value[e]
        };
      }));
    };

    // Assign for handlebars
    context.rows = rowArray;
    context.fields = fields;
    context.idKey = rowArray[0][0]

    res.render("table", context);
  });
});

// Render NPC details
app.get("/detail", (req, res, next) => {
  console.log("Detail request received");
  console.log(req.query);
  console.log("=====");
  var context = {
    view: req.query.view,
    id: req.query.id
  };

  var dropdowns = async (function() {
    return new Promise(async (resolve => {
      // Query for dropdown items related to location
      const locationDropdownQuery = "SELECT location_id, location_name FROM locations"

      mysql.pool.query(locationDropdownQuery, (err, rows, fields) => {
        if (err) {
          next(err);
          return;
        };

        // For each row, save only the values to the array
        var rowArray = []
        for (const key of Object.keys(rows)) {
          var value = rows[key];
          rowArray.push(Object.keys(value).map(function(e) {

            if (value[e] == null) {
              return ""
            } else {
              return value[e]
            };
          }));
        };

        // Assign locations array for handlebars
        context.locations = rowArray;

        // Query for dropdown items related to creature types
        const creatureTypesDropdownQuery = "SELECT creature_type_id, creature_type_name FROM creature_types"

        mysql.pool.query(creatureTypesDropdownQuery, (err, rows, fields) => {
          if (err) {
            next(err);
            return;
          };

          // For each row, save only the values to the array
          var rowArray = []
          for (const key of Object.keys(rows)) {
            var value = rows[key];
            rowArray.push(Object.keys(value).map(function(e) {

              if (value[e] == null) {
                return ""
              } else {
                return value[e]
              };
            }));
          };
          // Assign creature types array for handlebars
          context.creature_types = rowArray;

          // Query for dropdown items related to traits
          const traitsDropdownQuery = "SELECT trait_id, trait_name FROM traits"

          mysql.pool.query(traitsDropdownQuery, (err, rows, fields) => {
            if (err) {
              next(err);
              return;
            };

            // For each row, save only the values to the array
            var rowArray = []
            for (const key of Object.keys(rows)) {
              var value = rows[key];
              rowArray.push(Object.keys(value).map(function(e) {

                if (value[e] == null) {
                  return ""
                } else {
                  return value[e]
                };
              }));
            };

            // Assign traits array for handlebars
            context.trait_list = rowArray;

            // Query for dropdown items related to items
            const itemsDropdownQuery = "SELECT item_id, item_name FROM items"

            mysql.pool.query(itemsDropdownQuery, (err, rows, fields) => {
              if (err) {
                next(err);
                return;
              };

              // For each row, save only values to the array
              var rowArray = []
              for (const key of Object.keys(rows)) {
                var value = rows[key];
                rowArray.push(Object.keys(value).map(function(e) {

                  if (value[e] == null) {
                    return ""
                  } else {
                    return value[e]
                  };
                }));
              };

              // Assign items array for handlebars
              context.items_list = rowArray;
              resolve();
            });
          });
        });
      });
    }));
  });

  // Check if the detail is for a specific NPC then query that NPC's info
  var genPage = async (function() {
    await (dropdowns())

    if (context.id != null) {

      // Query to populate from NPC table and assign for handlebars
      mysql.pool.query("SELECT * FROM npcs WHERE npc_id = ?", context.id, (err, rows, fields) => {
        if (err) {
          next(err);
          return;
        };
        context.npcs = rows[0];
        context.npcs_fields = fields;
        npc_name = context.npcs.first_name + " " + context.npcs.last_name

        // Then query to populate from npc_traits table and assign for handlebars
        mysql.pool.query("SELECT * FROM npc_traits WHERE npc_id = ?", context.id, (err, rows, fields) => {
          if (err) {
            next(err);
            return;
          };
          context.traits = rows[0];
          context.traits_fields = fields;

          // Then query to populate from npc_items table and assign for handlebars
          mysql.pool.query("SELECT * FROM npc_items WHERE npc_id = ?", context.id, (err, rows, fields) => {
            if (err) {
              next(err);
              return;
            };
            context.items = rows;
            context.items_fields = fields;
            context.title = npc_name.toUpperCase()

            res.render("detail", context);
          });
        });
      });

      // Otherwise load page to add a new NPC
    } else {

      context.title = "Add a new NPC";
      res.render("detail", context);

    };
  });

  genPage();

});

// Render filtered table
app.post("/filter", (req, res, next) => {
  console.log("Filter request received")
  console.log(req.body);
  console.log("=====");

  var context = {
    table: req.body.table_name,
    view: "filter",
    filter: req.body.filter_table,
    filter_key: req.body.filter_key
  };

  console.log(context);

  // Check if table is valid
  var s_check = tableArray.includes(context.table);
  if (s_check == false) {
    res.render("table", context);
    return
  }

  // Check if filter button not was provided
  if (context.filter === undefined) {
    var tableRedirect = "/table?table=" + context.table + "&view=filter"
    res.redirect(tableRedirect);

    // Filter if button was provided
  } else {

    // Query data based on user provided constraints
    mysql.pool.query("SELECT * FROM " + context.table + " WHERE " + context.filter + " = ?", context.filter_key, (err, rows, fields) => {
      if (err) {
        next(err);
        return;
      };

      var rowArray = []

      // Assign headers to first item of array
      var headerArray = []
      for (const key of Object.keys(fields)) {
        var header = fields[key];
        headerArray.push(header.name)
      };
      rowArray.push(headerArray);

      // For each item in rows, add only the values to array
      for (const key of Object.keys(rows)) {
        var value = rows[key];
        rowArray.push(Object.keys(value).map(function(e) {

          if (value[e] == null) {
            return ""
          } else {
            return value[e]
          };
        }));
      };

      // Assign for handlebars
      context.rows = rowArray;
      context.fields = fields;
      context.idKey = rowArray[0][0]

      res.render("table", context);
    });
  };
});

// Add new entry and redirect
app.post("/add", (req, res, next) => {
  console.log("Add request received")
  console.log(req.body);
  console.log("=====");

  var dataArray = JSON.parse(JSON.stringify(req.body))
  var context = {
    table: req.body.table_name,
    view: "add",
    input: Object.keys(dataArray).map(function(e) {
      return dataArray[e]
    }).slice(0, -1),
    keys: Object.keys(dataArray).slice(0, -1)
  };

  // Check table is valid
  var s_check = tableArray.includes(context.table);
  if (s_check == false) {
    res.render("table", context);
    return
  };

  // Create an array of "?" based on the number of columns provided
  var queryValues = []
  for (var i = 0; i < context.input.length; i++) {
    queryValues.push("?");

    if (parseInt(context.input[i]) >= 0) {
      context.input[i] = parseInt(context.input[i])
    } else {
      context.input[i].replace(/'/g, '"');
    };
  };

  // Build query with variable columns (context.keys) and number of values (queryValues)
  var addQuery = "INSERT INTO " + context.table + " (" + context.keys.join(", ") + ")" + " VALUES (" + queryValues.join(", ") + ");";
  console.log(addQuery);

  // Send query with input provided
  mysql.pool.query(addQuery, context.input, (err, rows, fields) => {
    if (err) {
      console.log(err);
      return;
    };

    context.alert = "Successfully added."

    // If a new NPC, add new relationship tables
    if (context.table == "npcs") {
      var npc_id = rows.insertId
      var addQuery = "INSERT INTO npc_traits (npc_id) VALUES (" + npc_id + ");"
      mysql.pool.query(addQuery, context.input, (err, rows, fields) => {
        if (err) {
          console.log(err);
          return;
        };
      });
    };

    if (context.table == "npc_items" || context.table == "npc_items"){
      var npc_id = context.input[0];
    }

    var detailTables = ["npcs", "npc_items", "npc_traits"]

    // Check if table added to was sent from the details page
    if (detailTables.includes(context.table) == true) {

      // Redirect to details page if true
      var detailsRedirect = "/detail?table=npcs&view=details&id=" + npc_id;
      res.redirect(detailsRedirect);

      // Otherwise redirect to the tables page
    } else {
      var tableRedirect = "/table?table=" + context.table + "&view=filter"
      res.redirect(tableRedirect);
    };
  });
});

// Update entry and redirect
app.post("/update", (req, res, next) => {
  console.log("Update request received")
  console.log(req.body);
  console.log("=====");

  var dataArray = JSON.parse(JSON.stringify(req.body))
  var context = {
    table: req.body.table_name,
    view: "filter",
    input: Object.keys(dataArray).map(function(e) {
      return dataArray[e]
    }).slice(0, -1).slice(1),
    keys: Object.keys(dataArray).slice(0, -1).slice(1)
  };

  context.input.push(context.input[0]);

  // Check table is valid
  var s_check = tableArray.includes(context.table);
  if (s_check == false) {
    res.render("table", context);
    return
  };

  // Check if table is a M:M relationship table to add additional WHERE clause
  if (req.body.table_name == "npc_items") {
    context.input.push(context.input[1])
  };

  // Create an array of "?" based on the number of columns provided
  var queryValues = []
  for (var i = 0; i < context.input.length; i++) {
    queryValues.push("?");

    if (parseInt(context.input[i]) >= 0) {
      context.input[i] = parseInt(context.input[i])
    } else {
      context.input[i].replace(/'/g, '"');
    };
  };

  // Formating for update to npc_traits
  if (context.table == "npc_traits") {
    if (context.input[1] == "") {
      context.input[1] = null
    };
  };

  console.log(context.input)
  // Build query with variable columns (context.keys) and number of values (queryValues)
  var updateQuery = "UPDATE " + context.table + " SET " + context.keys.join(" = ?, ") + " = ? WHERE " + context.keys[0] + " = ?";

  // Add WHERE clause if npc_items
  if (context.table == "npc_items") {
    updateQuery += " AND item_id = ?"
  };

  updateQuery += ";"
  console.log(updateQuery);

  // Send query
  mysql.pool.query(updateQuery, context.input, (err, rows, fields) => {
    if (err) {
      console.log(err);
      return;
    };

    console.log("Successfully updated.")

    var detailTables = ["npcs", "npc_items", "npc_traits"]

    // Check if redirect should be to details page
    if (detailTables.includes(context.table) == true) {
      var detailsRedirect = "/detail?table=npcs&view=details&id=" + context.input[0];
      res.redirect(detailsRedirect);

      // Otherwise redirect to tables page
    } else {
      var tableRedirect = "/table?table=" + context.table + "&view=filter"
      res.redirect(tableRedirect);
    };
  });
});

// Delete entry and redirect
app.get("/delete", (req, res, next) => {
  console.log("Delete request received")
  console.log(req.body);
  console.log("=====");
  var context = {
    table: req.query.table,
    idKey: req.query.idKey,
    id: req.query.id
  };

  // Check arrays and keys are valid
  var s_check = tableArray.includes(context.table);
  if (s_check == false) {
    res.render("table", context);
    return
  };

  var s_check = idKeyArray.includes(context.idKey);
  if (s_check == false) {
    res.render("table", context);
    return
  };

  // Build query
  const deleteQuery = "DELETE FROM " + context.table + " WHERE " + context.idKey + " = ?;";

  mysql.pool.query(deleteQuery, context.id, (err, rows, fields) => {
    if (err) {
      next(err);
      return;
    };

    context.alert = "Successfully deleted."

    // Redirect after delete
    var tableRedirect = "/table?table=" + context.table + "&view=filter"
    res.redirect(tableRedirect);
  });
});

// Delete M:M entry and redirect
app.get("/dmm", (req, res, next) => {
  console.log("Delete M:M request received")
  console.log(req.query);
  console.log("=====");
  var context = {
    table: req.query.table,
    idKey1: req.query.idKey1,
    id: [req.query.id1, req.query.id2],
    idKey2: req.query.idKey2,
  };

  // Check if keys and tables are valid
  var s_check = tableArray.includes(context.table);
  if (s_check == false) {
    res.render("table", context);
    return
  };

  var s_check = idKeyArray.includes(context.idKey1);
  if (s_check == false) {
    res.render("table", context);
    return
  };

  var s_check = idKeyArray.includes(context.idKey2);
  if (s_check == false) {
    res.render("table", context);
    return
  };

  // Build query
  const deleteQuery = "DELETE FROM " + context.table + " WHERE " + context.idKey1 + " = ? AND " + context.idKey2 + " = ?;";

  mysql.pool.query(deleteQuery, context.id, (err, rows, fields) => {
    if (err) {
      next(err);
      return;
    };

    // Redirect back to original NPC
    var detailsRedirect = "/detail?table=npcs&view=details&id=" + context.id[0]
    res.redirect(detailsRedirect);
  });
});

// 404
app.use(function(req, res) {
  res.status(404);
  res.render('404');
});

// 500
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

// Server Startup
app.listen(app.get('port'), () => {
  console.log(
    `Server is running at http://${process.env.HOSTNAME}:${app.get('port')}`
  );
});
