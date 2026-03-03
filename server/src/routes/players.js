const express = require('express');
const router = express.Router({ mergeParams: true });
const { addPlayers, getPlayers, deletePlayer } = require('../controllers/playerController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.post('/', protect, roleCheck('ADMIN'), addPlayers);
router.get('/', protect, getPlayers);
router.delete('/:playerId', protect, roleCheck('ADMIN'), deletePlayer);

module.exports = router;
