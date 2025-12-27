const axios = require('axios');

module.exports = function () {

  this.on('READ', 'Countries', async () => {

    const response = await axios.get(
      'https://restcountries.com/v3.1/all?fields=cca3,name,capital,region,population'
    );

    return response.data.map(c => ({
      cca3: c.cca3,
      name: c.name?.common,
      capital: c.capital?.[0],
      region: c.region,
      population: c.population
    }));
  });

};
