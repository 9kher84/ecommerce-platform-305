const axios = require('axios');
axios.get('http://localhost:5000/api/internal/fix-sector?email=buyer2@testdata.com&sectorId=1&secret=S1U9D8}0)]*d(u!s')
  .then(r => console.log(r.data))
  .catch(e => console.log(e.response?.data || e.message));
