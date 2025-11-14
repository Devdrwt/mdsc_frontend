"use client"
import { useEffect, useState } from "react"
import CourseCard from "./CourseCard"
import { GraduationCap, Loader2 } from "lucide-react"

export default function CourseCatalogue() {
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/courses")

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des cours")
        }

        const data = await response.json()

        // Si vos cours sont dans data.courses, utilisez data.courses
        // Si vos cours sont directement dans data, utilisez data
        setCourses(data.courses || data)
        setIsLoading(false)
      } catch (err) {
        setError("Impossible de charger les cours")
        setIsLoading(false)
        console.error("[v0] Erreur chargement cours:", err)
      }
    }

    fetchCourses()
  }, [])

  return (
    <div className="space-y-6">
      {/* Bannière Mes Cours */}
      <div className="bg-gradient-to-r from-[#547D8C] to-[#0B5A7A] rounded-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold">Mes Cours</h1>
          <GraduationCap className="h-8 w-8" />
        </div>
        <p className="text-white/90 text-lg">
          Gérez vos cours, suivez votre progression et accédez à vos contenus d'apprentissage.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#547D8C]" />
          <span className="ml-3 text-gray-600">Chargement des cours...</span>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      {!isLoading && !error && (
        <>
          <div>
            <p className="text-gray-700 font-medium">
              {courses.length} formation{courses.length > 1 ? "s" : ""} trouvée{courses.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} showEnrollButton={true} />
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun cours disponible pour le moment.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
