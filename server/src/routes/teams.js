const express = require('express');
const router = express.Router({ mergeParams: true });
const { createTeam, getTeams, requestTeam, approveTeam, rejectTeam, getMyTeam, addBudget } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// Tournament-scoped
router.post('/', protect, roleCheck('ADMIN'), createTeam);
router.get('/', protect, getTeams);
router.get('/myteam', protect, getMyTeam);

// Team-specific
router.post('/:id/request', protect, roleCheck('TEAM_OWNER'), requestTeam);
router.put('/:id/approve', protect, roleCheck('ADMIN'), approveTeam);
router.put('/:id/reject', protect, roleCheck('ADMIN'), rejectTeam);
router.put('/:id/budget', protect, roleCheck('ADMIN'), addBudget);

module.exports = router;
