import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex bg-neutral-950">
      <div className="hidden md:flex flex-col w-3/5 bg-neutral-950 items-center justify-center p-10">
        <Image src="/images/euspl-logo.png" alt="Logo" width={400} height={400} style={{ width: 'auto', height: 'auto' }} loading="eager" priority />
        <p className="text-white text-2xl font-bold ml-6 mt-5">Engineering UND Solutionz Pvt. Ltd.</p>
      </div>

      <div className="w-full md:w-2/5 bg-white flex justify-center flex-col px-10 py-12 overflow-y-auto rounded-l-[58px] my-1">
        {children}
      </div>
    </div>
  );
}