const express = require('express');
const router = express.Router({ mergeParams: true });
const { addPlayers, getPlayers, deletePlayer, uploadPlayerImage } = require('../controllers/playerController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');

router.post('/', protect, roleCheck('ADMIN'), addPlayers);
router.get('/', protect, getPlayers);
router.delete('/:playerId', protect, roleCheck('ADMIN'), deletePlayer);
router.post('/upload-image', protect, roleCheck('ADMIN'), upload.single('image'), uploadPlayerImage);

module.exports = router;
