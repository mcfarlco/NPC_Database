const mysql = require('./dbcon');
var async = require('asyncawait/async');
var await = require('asyncawait/await');

// Array of all tables
const tableArray = ["locations", "creature_types", "traits", "item_types", "npcs", "npc_traits", "items", "npc_items"]

// Starting data arrays
const locationsArray = [
  [undefined, "City", 100000],
  [undefined, "Town", 1000],
  [undefined, "Village", 100]
]
const creature_typesArray = [
  [undefined, "Human"],
  [undefined, "Elf"],
  [undefined, "Dwarf"],
  [undefined, "Orc"],
  [undefined, "Gnome"],
  [undefined, "Goblin"]
]
const traitsArray = [
  [undefined, "Aggressive"],
  [undefined, "Funny"],
  [undefined, "Calm"],
  [undefined, "Nervous"],
  [undefined, "Cowardly"],
  [undefined, "Liar"],
  [undefined, "Honest"],
  [undefined, "Loud"],
  [undefined, "Quiet"]
]
const item_typesArray = [
  [undefined, "Weapon"],
  [undefined, "Armor"],
  [undefined, "Consumable"],
  [undefined, "Art and Valuables"]
]
const npcsArray = [
  [undefined, "John", "Wick", 1, 1, 45, 0],
  [undefined, "Elrond", undefined, 1, 2, 345, 1],
  [undefined, "Ghazgkull", "Thraka", 1, 4, 25, 0]
]
const npc_traitsArray = [
  [1, 3, 7, 9, undefined, undefined],
  [2, 3, 4, 7, 9, undefined],
  [3, 1, 2, 7, 8, undefined]
]
const itemsArray = [
  [undefined, "Sword", 1, 100, 0],
  [undefined, "Shield", 2, 50, 0],
  [undefined, "Ghazgkull's Claw", 1, 9001, 1]
]
const npc_itemsArray = [
  [1, 1, 10],
  [2, 2, 1],
  [3, 3, 2]
]

// Array of starting data arrays
const starterDataArray = [locationsArray, creature_typesArray, traitsArray, item_typesArray, npcsArray, npc_traitsArray, itemsArray, npc_itemsArray]

// Queries to drop, select, or insert data
const vForeignConstraintOff = "SET FOREIGN_KEY_CHECKS=0;"
const vForeignConstraintOn = "SET FOREIGN_KEY_CHECKS=1;"
const vSelectQuery = "SELECT * FROM ";
const vDropTableQuery = "DROP TABLE IF EXISTS ";
const vInsertQuery = "INSERT INTO "
const vInsertQueryValues = " VALUES (?)";

// Queries to generate new tables
const locationsTableQuery = `CREATE TABLE IF NOT EXISTS locations(
                        location_id INT AUTO_INCREMENT NOT NULL,
                        location_name VARCHAR(255) NOT NULL,
                        population INT,
                        PRIMARY KEY (location_id));`;

const creature_typesTableQuery = `CREATE TABLE IF NOT EXISTS creature_types(
                        creature_type_id INT AUTO_INCREMENT NOT NULL,
                        creature_type_name VARCHAR(255) NOT NULL,
                        PRIMARY KEY (creature_type_id));`;

const traitsTableQuery = `CREATE TABLE IF NOT EXISTS traits(
                        trait_id INT AUTO_INCREMENT NOT NULL,
                        trait_name VARCHAR(255) NOT NULL,
                        PRIMARY KEY (trait_id));`;

const item_typesTableQuery = `CREATE TABLE IF NOT EXISTS item_types(
                        item_type_id INT AUTO_INCREMENT,
                        item_type_name VARCHAR(255) NOT NULL,
                        PRIMARY KEY (item_type_id));`;

const npcsTableQuery = `CREATE TABLE IF NOT EXISTS npcs(
                        npc_id INT AUTO_INCREMENT NOT NULL,
                        first_name VARCHAR(255) NOT NULL,
                        last_name VARCHAR(255),
                        location_id INT,
                        creature_type_id INT,
                        age INT,
                        vendor BOOLEAN DEFAULT 0,
                        PRIMARY KEY (npc_id),
                        CONSTRAINT npcs_ibfk_1 FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
                        CONSTRAINT npcs_ibfk_2 FOREIGN KEY (creature_type_id) REFERENCES creature_types(creature_type_id) ON DELETE SET NULL);`;

const npc_traitsTableQuery = `CREATE TABLE IF NOT EXISTS npc_traits(
                        npc_id INT,
                        trait1_id INT,
                        trait2_id INT,
                        trait3_id INT,
                        trait4_id INT DEFAULT NULL,
                        trait5_id INT DEFAULT NULL,
                        CONSTRAINT npc_traits_ibfk_1 FOREIGN KEY (npc_id) REFERENCES npcs(npc_id) ON DELETE CASCADE,
                        CONSTRAINT npc_traits_ibfk_2 FOREIGN KEY (trait1_id) REFERENCES traits(trait_id) ON DELETE SET NULL,
                        CONSTRAINT npc_traits_ibfk_3 FOREIGN KEY (trait2_id) REFERENCES traits(trait_id) ON DELETE SET NULL,
                        CONSTRAINT npc_traits_ibfk_4 FOREIGN KEY (trait3_id) REFERENCES traits(trait_id) ON DELETE SET NULL,
                        CONSTRAINT npc_traits_ibfk_5 FOREIGN KEY (trait4_id) REFERENCES traits(trait_id) ON DELETE SET NULL,
                        CONSTRAINT npc_traits_ibfk_6 FOREIGN KEY (trait5_id) REFERENCES traits(trait_id) ON DELETE SET NULL);`;


const itemsTableQuery = `CREATE TABLE IF NOT EXISTS items(
                        item_id INT AUTO_INCREMENT NOT NULL,
                        item_name VARCHAR(255) NOT NULL,
                        item_type_id INT,
                        item_price INT NOT NULL,
                        drop_only BOOLEAN DEFAULT 0,
                        PRIMARY KEY (item_id),
                        CONSTRAINT items_ibfk_1 FOREIGN KEY (item_type_id) REFERENCES item_types(item_type_id) ON DELETE SET NULL);`;


const npc_itemsTableQuery = `CREATE TABLE IF NOT EXISTS npc_items(
                        npc_id INT,
                        item_id INT,
                        item_quantity INT NOT NULL,
                        CONSTRAINT npc_items_ibfk_1 FOREIGN KEY (npc_id) REFERENCES npcs(npc_id) ON DELETE CASCADE,
                        CONSTRAINT npc_items_ibfk_2 FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE);`;

// Array of the queries to create all tables
const createTableArray = [locationsTableQuery, creature_typesTableQuery, traitsTableQuery, item_typesTableQuery, npcsTableQuery, npc_traitsTableQuery, itemsTableQuery, npc_itemsTableQuery]

// Funciion to perform query
function mysqlQuery(query, values) {
  return new Promise(resolve => {
    mysql.pool.query(query, values, (err, result) => {
       if (err) {
         console.log(err);
         return;
       };
       console.log("====Query====");
       console.log(query);
       console.log("===============");
       resolve();
     });
  });
};

// Function to delete all tables
var dropTables = async (function () {
  return new Promise(async (resolve => {
    for (table in tableArray) {

      await (mysqlQuery(vForeignConstraintOff))
      await (mysqlQuery(vDropTableQuery + tableArray[table]))
      await (mysqlQuery(vForeignConstraintOn))

    };
    resolve();
  }));
});

// Function to create tables after deleting old ones
var makeTables = async (function () {
  await (dropTables())

  return new Promise(async (resolve => {
    for (table in createTableArray) {

      await (mysqlQuery(createTableArray[table]))

    };
    resolve();
  }));
});

// function to insert starting data after reseting tables
var insertStarterData = async (function()  {
  await (makeTables())

  for (var i = 0; i < tableArray.length; i++) {
    console.log(starterDataArray[i]);
    console.log(tableArray[i]);
    for (var j = 0; j < starterDataArray[i].length; j++) {
      var aValues = starterDataArray[i][j];
      console.log(aValues);
      await (mysqlQuery(vInsertQuery + tableArray[i] + vInsertQueryValues, [aValues]))
    };
  };
});

// Function to call reset on execute
insertStarterData()
