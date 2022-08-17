const express = require('express');
const path = require('path');

const app = express();
const publicPath = path.resolve(__dirname, 'src/public');
const router = require('./src/routers/index');

app.use('/', express.static(publicPath));
app.use('/api', router);

app.listen(3000, () => {
    console.log('server is up');
})