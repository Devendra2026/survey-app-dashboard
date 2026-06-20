import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-linear-to-br from-background via-secondary/40 to-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image src="/sdv-logo.png" alt="SDV" width={132} height={40} priority className="drop-shadow-sm" />
        </div>
        {children}
      </div>
    </div>
  );
}
