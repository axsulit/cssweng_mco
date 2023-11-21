import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Router from 'next/router'
import { auth, firestore, googleAuthProvider } from '../lib/firebase'
import toast from 'react-hot-toast'

export default function Login() {

    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const router = Router;

    const handleLogin = () => {
        if (email === '' || password === '') {
            toast.error('Please fill out all fields')
            return
        }

        auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                toast.error('Please verify your email before logging in');
                return;
            } 

            return user;
        })
        .then((user) => {
            // Fetch the username from Firestore
            const ref = firestore.collection('users').doc(user.uid);

            ref.get().then((doc) => {
                const username = doc.data()?.username;

                if (!username) {
                    // If email is verified but no username, redirect to AccountSetup
                    toast('Let`s set up your account!', {
                        icon: '👏',
                    });
                    router.push('/AccountSetup');
                } else {
                    // If old user (email verified and has username), redirect to Home

                    // Clear fields
                    setEmail('');
                    setPassword('');

                    toast('Welcome back', {
                        icon: '👏',
                    });
                    // Redirect to Home page
                    router.push('/Home');
                }
            });
        })
        .catch((error) => {
            const errorCode = error.code
            const errorMessage = error.message
            console.log(errorCode)
            console.log(errorMessage)

            if (errorCode === 'auth/invalid-login-credentials') {
                toast.error('Wrong email or password!')
                return
            } else if (errorCode === 'auth/too-many-requests') {
                toast.error('Too many attempts. Try again later or reset your password.')
                return
            }
            toast.error('Wrong email or password!')
        })  
    }

    async function handleGooglePopUp() {
        await auth.signInWithPopup(googleAuthProvider).then((result) => {
            // Signed in 
            const user = result.user;

            // Check if email is verified
            if (!user.emailVerified) {
                toast.error('Please verify your email before logging in');
                return;
            } 
            
            return user;
        }).then((user) => {
            // Fetch the username from Firestore
            const ref = firestore.collection('users').doc(user.uid);

            ref.get().then((doc) => {
                const username = doc.data()?.username;

                if (!username) {
                    // If email is verified but no username, redirect to AccountSetup
                    toast('Let`s set up your account!', {
                        icon: '👏',
                    });
                    router.push('/AccountSetup');
                } else {
                    // If old user (email verified and has username), redirect to Home

                    toast('Welcome back', {
                        icon: '👏',
                    });
                    // Redirect to Home page
                    router.push('/Home');
                }
            });
        })
        .catch((error) => {
            const errorCode = error.code

            if (errorCode === 'auth/invalid-login-credentials') {
                toast.error('Wrong email or password!')
                return
            }
        })
    }

    const handleForgotPassword = () => {
        if(email === '') {
            toast.error("Please enter an email address");
            return;
        }
    
        auth.sendPasswordResetEmail(email)
        .then(() => {
            // Password reset email sent!
            toast.success("A password reset email has been sent!");
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;

            // Handle the different types of errors
            if (errorCode === 'auth/invalid-email') {
                toast.error('Invalid email address.');
            } else {
                toast.error(errorMessage);
            }
        });
    }
            
    return (
        <div className='h-screen bg-gradient-to-tl from-jasmine via-citron to-[#7DD184] flex flex-col justify-center items-center 
                    lg:flex-row lg:gap-32
                    max-md:gap-20 
                    max-sm:gap-5 max-sm:p-4'>

            <div id="login" className='bg-jasmine drop-shadow-md max-w-[500px] h-[500px] rounded-3xl flex px-12 max-sm:px-8 flex-col justify-center items-center'>

                <h1 className='text-6xl font-bold font-shining mb-3 text-grass max-sm:text-4xl'>BantayBuddy</h1>
                
                <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    placeholder='Email Address'
                    className='bg-light_yellow rounded-xl mt-3 p-4 w-full h-12 text-lg font-semibold outline-none' />
                
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value.trim())}
                    placeholder='Password'
                    className='bg-light_yellow rounded-xl mt-3 mb-3 p-4 w-full h-12 text-lg font-semibold outline-none ' />
                
                <p 
                    onClick={handleForgotPassword}
                    className='text-sm mt-3 font-semibold cursor-pointer text-gray-600 hover:text-black mb-3'>
                    Forgot Password?
                </p>

                <button 
                    onClick={handleLogin}
                    className='bg-xanthous rounded-xl mt-3 mb-3 w-full h-12 text-lg font-bold  outline-none hover:bg-light_yellow transition-all'>
                    Log In
                </button>
                
                <span className='w-full'>
                    {/* google */}
                    <button 
                        onClick={handleGooglePopUp}
                        className='bg-snow rounded-xl mb-3 w-full h-12 text-lg font-bold text-center flex items-center justify-center gap-2 hover:bg-light_yellow transition-all'>
                        <p>Continue with </p>
                        <Image src='/images/google.ico' alt='Google Logo' width={20} height={20} />
                    </button>
                </span>

                <div className='text-sm'>
                    Don`t have an account?
                    <Link href={'/Register'} className='font-bold hover:text-gray-600 text-black'> Register</Link>
                </div>
            </div>            

            <div id="showcase" className=" hidden w-fit h-fit rounded-lg drop-shadow-md lg:flex md:space-x-5" >
                <PostShowcase />
            </div>
        </div>
    )
}

function PostShowcase() {

    const authorDisplayName = 'Barker';
    const authorUsername = 'barknplay';
    const authorPhotoURL = '/images/user1-image.png';
    const postDate = '23/9/6 at 16:30';
    const postBody = 'Chaos and cuddles with this dynamic quartet! 🐾🐾🐾🐾 Our two pups and two kitties bring a whole lot of joy and a touch of mayhem to our everyday life. 🐶🐱🐶🐱 They may be different species, but they share a bond thats truly heartwarming.';
    const imageUrls = ['/images/post1-image.png'];

    return (
        <div className='shadow-sm hover:shadow-lg bg-snow max-w-[650px] max-h-[500px] rounded-3xl p-6 flex flex-col'>
            {/* Header */}
            <div id="post-header" className='flex flex-row'>

              <div className='flex flex-row'>
                {/* User Image */}
                <div id="user-image">
                  <Image width={50} height={50} src={authorPhotoURL} alt="user image" className='rounded-full shadow-md'/>
                </div>

                <div id='post-meta' className='ml-4 h-full items-center justify-center'>
                    <div id='user-meta' className='flex flex-row gap-2 '>
                      {/* Display Name */}
                      <div id='display-name' className='font-bold'>
                        <p>{authorDisplayName}</p>
                      </div>

                      <div className='font-bold'>
                        ·
                      </div>

                      {/* Username */}
                      <Link href={'/user/' + authorUsername} id='display-name' className='hover:text-grass hover:font-semibold transition-all'>
                        <p>@{authorUsername}</p>
                      </Link>
                    </div>
      
                    {/* Publish Date */}
                    <div id='publish-date'>
                      <p>{postDate}</p>
                    </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div id='post-body' className='mt-4 flex flex-col'>
              <div id='post-text'>
                <p className='whitespace-pre-line line-clamp-1 overflow-hidden'>{postBody}</p>
              </div>
              
              {/* Image Carousel */}
              <div id="post-image" className='mt-4 h-[310px] w-auto flex items-center justify-center relative'>
                <Image src={imageUrls[0]} alt="post image" 
                  layout='fill'
                  objectFit='contain'
                  className='rounded-lg'
                  />
              </div>
            </div>

            {/* Footer */}
            <div id='post-footer' className='mt-4 flex flex-row w-full justify-between relative'>
              
              <div id="left" className='flex flex-row gap-4'>
                <div id='post-reaction-control' className='flex flex-row justify-center items-center gap-2'>
                  <i className="fa-solid fa-heart hover:text-grass hover:scale- hover:cursor-pointer" 
                  ></i>
                  <p>0</p>
                </div>
                
                <div id="comment-control" className='flex flex-row justify-center items-center gap-2'>
                  <i className="fa-solid fa-comment hover:text-grass hover:scale- hover:cursor-pointer"></i>
                  <p>0</p>
                </div>

                <div id="share-control">
                  <i className="fa-solid fa-share-nodes hover:text-grass hover:scale- hover:cursor-pointer"></i>
                </div>
              </div>

              <div id="right" className='flex flex-row gap-4'>
                <div id='bookmark-control'>
                  <i className="fa-solid fa-bookmark hover:text-grass hover:scale- hover:cursor-pointer"></i>
                </div>
            </div>
          </div>
        </div>
    )
}