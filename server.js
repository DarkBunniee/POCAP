// const cds = require('@sap/cds');
// const express = require('express');
// const { createODataV2Adapter } = require('@cap-js-community/odata-v2-adapter');

// cds.on('bootstrap', app => {
//   app.use('/odata/v2', createODataV2Adapter());
// });

// module.exports = cds.server;


const cds = require('@sap/cds');
const v2adapter = require('@cap-js-community/odata-v2-adapter');

cds.on('bootstrap', app => {
  app.use(v2adapter());
});

module.exports = cds.server;
