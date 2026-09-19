const express = require('express');
const router = express.Router();
const trainController = require('../controllers/trainController');

router.get('/stations', trainController.getAllStations);
router.get('/searchByTrain', trainController.searchByTrain);
router.get('/search', trainController.searchTrains);
router.get('/detail/:id', trainController.getTrainDetails);
router.get('/live/:trainNumber', trainController.getLiveStatus);

module.exports = router;
