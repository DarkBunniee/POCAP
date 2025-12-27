const cds = require('@sap/cds');

module.exports = async function () {

  const northwind = await cds.connect.to('Northwind');

  this.on('READ', 'Products', req => {
    return northwind.run(req.query);
  });

  this.on('READ', 'Customers', req => {
    return northwind.run(req.query);
  });

};
