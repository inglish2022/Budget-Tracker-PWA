
let db;
const request = indexedDB.open("budget", 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_pizza`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('pending', { autoIncrement: true });
  };

  // upon a successful 
request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run uploadPizza() function to send all local db data to api
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions 
  const transaction = db.transaction("pending", "readwrite");

  // access the object store for `new_pizza`
  const store = transaction.objectStore("pending");

  // add record to your store with add method
  store.add(record);

  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
        fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then(() => {
                // if successful, open a transaction on your pending db
                const transaction = db.transaction("pending", "readwrite");

                // access your pending object store
                const store = transaction.objectStore("pending");

                // clear all items in your store
                store.clear();
            });
    }
};
}
window.addEventListener("online", checkDatabase);