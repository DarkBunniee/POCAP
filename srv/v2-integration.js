const cds = require('@sap/cds');

module.exports = async function () {

  const v2 = await cds.connect.to('V2Service');

  this.on('READ', 'Products', req => {
    return v2.run(req.query);
  });

};
