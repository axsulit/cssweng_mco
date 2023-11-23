import React from 'react'

import Loader from '../components/Loader'

export default function TestLoading() {
  return (
    <div className='min-h-screen min-w-full'>
        <Loader show={true} />
        <div className="bg-gradient-to-br from-jasmine via-citron to-[#7DD184] min-w-full min-h-screen flex justify-center items-center">
          <div class="wheel-and-hamster mx-auto mt-10 relative">
            <div class="wheel w-32 h-32 animate-spin-slow bg-gray-300 rounded-full"></div>
            <div className="spoke flex items-center animate-spin-slow"></div>
            <div class="hamster animate-hamster absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div class="hamster__head bg-yellow-500 rounded-xl">
                <div class="hamster__ear bg-yellow-400 rounded-full"></div>
                <div class="hamster__eye bg-black rounded-full"></div>
                <div class="hamster__nose bg-pink-300 rounded-full"></div>
              </div>
              <div class="hamster__body bg-gray-300 rounded-full">
                <div class="hamster__limb--fr bg-yellow-500"></div>
                <div class="hamster__limb--fl bg-yellow-500"></div>
                <div class="hamster__limb--br bg-yellow-500"></div>
                <div class="hamster__limb--bl bg-yellow-500"></div>
              </div>
              <div class="hamster__tail bg-yellow-500 w-4 h-10 absolute -right-2 top-1/2 transform -translate-y-1/2 rotate-20"></div>
            </div>
          </div>
        </div>
    </div>
  )
}
