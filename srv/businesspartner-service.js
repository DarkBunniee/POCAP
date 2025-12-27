const cds = require('@sap/cds');

module.exports = async function () {

  const bpApi = await cds.connect.to('PackagingBP');

  this.on('READ', 'BusinessPartners', async req => {
    return bpApi.run(req.query);
  });

};
