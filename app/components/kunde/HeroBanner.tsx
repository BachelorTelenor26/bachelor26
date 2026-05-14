import Image from "next/image"


export default function HeroBanner(){


    return( 
      <div style={{ position: 'relative', width: '100%', height: '400px', overflow: 'hidden'}}>
        <Image
          src="/heroBannerImg.png"
          alt='Hero banner'
          fill
          quality={75}
          className='w-full h-full object-cover brightness-30 '
          priority
        />
      </div>
    )
    
}