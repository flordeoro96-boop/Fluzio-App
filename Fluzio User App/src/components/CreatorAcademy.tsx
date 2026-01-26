import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, Download, PlayCircle, FileText, CheckCircle, TrendingUp } from 'lucide-react';
import {
  getPublishedCourses,
  getUserEnrolledCourses,
  getCourseById,
  enrollInCourse,
  markLessonCompleted,
  getUserCourseProgress,
  getAcademyResources,
  trackResourceDownload,
  type Course,
  type Resource,
  type UserProgress,
  type CourseCategory,
  type CourseDifficulty,
} from '../services/creatorAcademyService';

interface CreatorAcademyProps {
  creatorId: string;
}

const CreatorAcademy: React.FC<CreatorAcademyProps> = ({ creatorId }) => {
  const [view, setView] = useState<'courses' | 'enrolled' | 'resources'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Array<Course & { progressId: string; progress: number }>>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseProgress, setCourseProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory | 'all'>('all');

  useEffect(() => {
    loadData();
  }, [view, categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (view === 'courses') {
        const filter = categoryFilter === 'all' ? undefined : categoryFilter;
        const allCourses = await getPublishedCourses(filter);
        setCourses(allCourses);
      } else if (view === 'enrolled') {
        const enrolled = await getUserEnrolledCourses(creatorId);
        setEnrolledCourses(enrolled);
      } else if (view === 'resources') {
        const filter = categoryFilter === 'all' ? undefined : categoryFilter;
        const allResources = await getAcademyResources(filter);
        setResources(allResources);
      }
    } catch (error) {
      console.error('Error loading academy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollInCourse(creatorId, courseId);
      alert('Successfully enrolled in course!');
      loadData();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in course');
    }
  };

  const handleViewCourse = async (course: Course) => {
    setSelectedCourse(course);
    const progress = await getUserCourseProgress(creatorId, course.id);
    setCourseProgress(progress);
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!selectedCourse || !courseProgress) return;

    try {
      await markLessonCompleted(courseProgress.id, lessonId, selectedCourse.lessons.length);
      const updatedProgress = await getUserCourseProgress(creatorId, selectedCourse.id);
      setCourseProgress(updatedProgress);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const handleDownloadResource = async (resource: Resource) => {
    try {
      await trackResourceDownload(resource.id);
      // Create downloadable file
      const blob = new Blob([resource.content || ''], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resource.title}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const getDifficultyColor = (difficulty: CourseDifficulty): string => {
    return difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
           difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
           'bg-red-100 text-red-700';
  };

  const getCategoryIcon = (category: CourseCategory) => {
    switch (category) {
      case 'pricing': return <TrendingUp className="w-5 h-5" />;
      case 'marketing': return <TrendingUp className="w-5 h-5" />;
      case 'content': return <FileText className="w-5 h-5" />;
      case 'business': return <BookOpen className="w-5 h-5" />;
      case 'legal': return <FileText className="w-5 h-5" />;
      case 'technical': return <BookOpen className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  if (selectedCourse) {
    return (
      <div className="creator-academy-viewer bg-white rounded-xl p-6">
        <button onClick={() => setSelectedCourse(null)} className="text-blue-600 mb-4 hover:underline">
          ← Back to Courses
        </button>

        <h1 className="text-3xl font-bold mb-2">{selectedCourse.title}</h1>
        <p className="text-gray-600 mb-4">{selectedCourse.description}</p>

        {courseProgress && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress: {courseProgress.progress}%</span>
              <span className="text-sm text-gray-500">
                {courseProgress.completedLessons.length} / {selectedCourse.lessons.length} lessons
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${courseProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {selectedCourse.lessons.map((lesson) => {
            const isCompleted = courseProgress?.completedLessons.includes(lesson.id) || false;

            return (
              <div key={lesson.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {lesson.type === 'video' && <PlayCircle className="w-5 h-5" />}
                      {lesson.type === 'article' && <FileText className="w-5 h-5" />}
                      {lesson.type === 'quiz' && <Award className="w-5 h-5" />}
                      {lesson.type === 'resource' && <Download className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{lesson.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{lesson.duration} min</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {lesson.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleLessonComplete(lesson.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="creator-academy bg-white rounded-xl p-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setView('courses')}
          className={`pb-3 px-4 font-medium transition-colors ${
            view === 'courses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
        >
          <BookOpen className="w-5 h-5 inline mr-2" />
          All Courses
        </button>
        <button
          onClick={() => setView('enrolled')}
          className={`pb-3 px-4 font-medium transition-colors ${
            view === 'enrolled' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
        >
          <Award className="w-5 h-5 inline mr-2" />
          My Learning
        </button>
        <button
          onClick={() => setView('resources')}
          className={`pb-3 px-4 font-medium transition-colors ${
            view === 'resources' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
          }`}
        >
          <Download className="w-5 h-5 inline mr-2" />
          Resources
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pricing', 'marketing', 'content', 'business', 'legal', 'technical'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {/* Courses View */}
          {view === 'courses' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="border rounded-xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg text-white">
                      {getCategoryIcon(course.category)}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {course.lessons.length} lessons
                    </span>
                  </div>

                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Enroll Now
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Enrolled Courses View */}
          {view === 'enrolled' && (
            <div className="grid md:grid-cols-2 gap-6">
              {enrolledCourses.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No enrolled courses yet</p>
                  <button
                    onClick={() => setView('courses')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Browse Courses
                  </button>
                </div>
              ) : (
                enrolledCourses.map((course) => (
                  <div key={course.id} className="border rounded-xl p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg flex-1">{course.title}</h3>
                      <span className="text-sm font-medium text-blue-600">{course.progress}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{course.description}</p>

                    <button
                      onClick={() => handleViewCourse(course)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Continue Learning
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Resources View */}
          {view === 'resources' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <div key={resource.id} className="border rounded-xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <Download className="w-5 h-5" />
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {resource.type}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg mb-2">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{resource.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{resource.downloadCount} downloads</span>
                    <button
                      onClick={() => handleDownloadResource(resource)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreatorAcademy;
