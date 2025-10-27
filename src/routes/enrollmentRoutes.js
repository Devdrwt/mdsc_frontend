const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');

// Routes pour les inscriptions
router.get('/my-courses', enrollmentController.getMyCourses);
router.get('/my-enrollments', enrollmentController.getMyEnrollments);
router.post('/', enrollmentController.enrollInCourse);
router.get('/:courseId/progress', enrollmentController.getCourseProgress);
router.put('/:courseId/lesson/:lessonId/progress', enrollmentController.updateLessonProgress);

module.exports = router;