const express = require('express')
const app = express()
require('./src/utils/dailyTipSender')
// Import the guardian notification route
const notifyGuardianRoute = require('./src/routes/notifyGuardian')
const educationRoutes = require('./src/routes/educationRoutes')
app.use('/api/education-tips', educationRoutes)
app.use(express.json())
app.use('/api', notifyGuardianRoute)

const PORT = 3000
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})
