const express = require('express');
const router = express.Router();
const { createTournament, getTournaments, getTournament, updateTournament } = require('../controllers/tournamentController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.post('/', protect, roleCheck('ADMIN'), createTournament);
router.get('/', protect, getTournaments);
router.get('/:id', protect, getTournament);
router.put('/:id', protect, roleCheck('ADMIN'), updateTournament);

module.exports = router;
