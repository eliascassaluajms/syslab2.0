const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: "Backend Operativo", microservice: "SysLab API" }));

app.listen(PORT, () => console.log(`[BACKEND] Servidor corriendo en puerto ${PORT}`));
