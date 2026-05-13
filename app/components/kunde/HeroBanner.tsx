import Image from "next/image"


export default function HeroBanner(){


    return( 
      <div style={{ position: 'relative', width: '100%', height: '400px', overflow: 'hidden'}}>
        <Image
          src="/telenorBuilding.jpg"
          alt='Hero banner'
          fill
          quality={75}
       
          className='w-full h-full object-cover'
          priority
        />
      </div>
    )
    
}