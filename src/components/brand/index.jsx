import Image from "next/image";
import Link from "next/link";
const Brand = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex justify-center items-center max-w-[300px]">
        <Image src="/icons/ies_brand.svg" alt="logo" width={43} height={46} />
        <p className="text-lg font-bold ml-2">Fargʻona IEM</p>
      </div>
    </Link>
  );
};

export default Brand;
