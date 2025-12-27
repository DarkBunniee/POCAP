const axios = require('axios');

module.exports = function () {

  /* ---------- GET ---------- */
  this.on('READ', 'Data', async () => {
    const res = await axios.get(
      'https://jsonplaceholder.typicode.com/users'
    );

    return res.data.map(u => ({
      id: u.id,
      name: u.name,
      value: u.email
    }));
  });

  /* ---------- POST ---------- */
  this.on('callPost', async req => {
    const res = await axios.post(
      'https://jsonplaceholder.typicode.com/posts',
      { title: req.data },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return JSON.stringify(res.data);
  });

};
