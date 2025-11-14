import Image from "next/image"
import Link from "next/link"

export default function RoleSelection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-200">
      {/* Apprenant Card */}
      {/* <Link href="/apprenant" className="relative group overflow-hidden">  bg-orange-400/40 */}
      <div className="relative group overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/apprenants.png" alt="Apprenant" fill  priority />
          <div className="absolute inset-0 " />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-center  h-full px-8 md:px-16 lg:px-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-2">Apprenant</h2>
          <p className="text-xl md:text-2xl lg:text-3xl text-white font-light">Je souhaite suivre des formations</p>
        </div>
      {/* </Link> */}
        </div>
        <div className="relative group overflow-hidden">
      {/* Formateur Card */}
      {/* <Link href="/formateur" className="relative group overflow-hidden"> className="object-cover"  bg-blue-500/40*/}
        <div className="absolute inset-0">
          <Image src="/formateur.png" alt="Formateur" fill  priority />
          <div className="absolute inset-0 " />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center text-center  h-full px-8 md:px-16 lg:px-24">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white mb-2">Formateur</h2>
          <p className="text-xl md:text-2xl lg:text-3xl text-white font-light">
            Je souhaite créer et animer des formations
          </p>
        </div>
      {/* </Link> */}
      </div>
    </div>
  )
}
