import Image from "next/image"


export default function HeroBanner(){


    return( 
      <div className='w-full h-[420px] overflow-hidden'>
        <Image
          src="/telenorHeroimg.webp"
          alt='Hero banner'
          fill
          quality={50}
          sizes="01"
          className='w-full h-full object-cover'
          priority
        />
      </div>
    )
    
}