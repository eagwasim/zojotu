import Image from "next/image";
import { BrandMark } from "@/components/site/brand";
import { photos, PHOTO_CREDIT } from "@/components/site/photos";

/** Sign in, register and password pages: form on the left, a photograph on the right (desktop only). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <BrandMark />
        <main className="flex flex-1 items-center justify-center py-10">{children}</main>
        <p className="text-xs text-muted-foreground lg:hidden">Hobbyist watch servicing in the Netherlands.</p>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src={photos.movement.src}
          alt={photos.movement.alt}
          placeholder="blur"
          priority
          sizes="55vw"
          className="h-full w-full object-cover"
        />
        <p className="absolute bottom-4 right-5 text-xs text-white/70">{PHOTO_CREDIT}</p>
      </div>
    </div>
  );
}
