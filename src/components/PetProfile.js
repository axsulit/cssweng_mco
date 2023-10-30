import React, { useEffect, useState } from 'react';
import { STATE_CHANGED, firestore, storage} from '@/src/lib/firebase';
import { useRouter } from 'next/router';
import { useUserData, getUserIDfromUsername } from '@/src/lib/hooks'; // Import the useUser hook
import { formatDateWithWords } from '../lib/formats';
import Image from 'next/image';
import Modal from 'react-modal'; // Import the Modal component  
import toast from 'react-hot-toast'
import { basicModalStyle } from '../lib/modalstyle';
import NavBar from '@/src/components/NavBar';
import Post from "@/src/components/Post";
import CoverPhoto from './CoverPhoto';
import RoundIcon from './RoundIcon';

export default function PetProfile() {

    // variables for getting pet's information through current/profileIDs
    const router = useRouter();
    const { profileUsername, petId } = router.query;
    const profileUserID = getUserIDfromUsername(profileUsername);
    const currentUser = useUserData(); // Get the logged-in user
    const currentUserID = getUserIDfromUsername(currentUser.username);

    // variables for pet profile
    const [pet, setPet] = useState(null);
    const [petName, setPetName] = useState(null);
    const [about, setAbout] = useState(null);
    const [followers, setFollowers] = useState(null);
    const [following, setFollowing] = useState(null);
    const [sex, setSex] = useState(null);
    const [breed, setBreed] = useState(null);
    const [birthdate, setBirthdate] = useState(null);
    const [birthplace, setBirthplace] = useState(null);
    const [petPhotoURL, setPetPhotoURL] = useState(null);
    
    const [activeTab, setActiveTab] = useState('Tagged Posts');
    const [modalIsOpen, setModalIsOpen] = useState(false);

    useEffect(() => {
        let unsubscribe;

        if (petId && profileUserID) {
        const petRef = firestore.collection('users').doc(profileUserID).collection('pets').doc(petId);
        unsubscribe = petRef.onSnapshot((doc) => {
            if (doc.exists) {
              setPet({
                  id: doc.id,
                  ...doc.data()
              });
              setPetName(doc.data().petname);
              setAbout(doc.data().about);
              setFollowers(doc.data().followers);
              setFollowing(doc.data().following);
              setSex(doc.data().sex);
              setBreed(doc.data().breed);

              setPetPhotoURL(doc.data().photoURL);

              setBirthdate(doc.data()?.birthdate);
              setBirthplace(doc.data()?.birthplace);
            } else {
              setPet(null);
            }
        });
        } else {
          setPet(null);
        }

        return unsubscribe;
    }, [petId, profileUserID]);
    
    const openEdit = () => {
        if (currentUser && currentUserID === profileUserID) { // Check if the logged-in user is the owner of the pet
          setModalIsOpen(true); // Open the modal when editing starts
        }
    };

    const handleSave = async (e) => {
      e.preventDefault();
        const petRef = firestore.collection('users').doc(profileUserID).collection('pets').doc(petId);
        const batch = firestore.batch();
      
        try {
          const updateData = {
            petname: petName,
            about: about,
            photoURL: petPhotoURL
          };
      
          batch.update(petRef, updateData);
      
          await batch.commit();
          setModalIsOpen(false);
          toast.success( petName + '`s profile updated successfully!');
        } catch (error) {
          console.error('Error saving pet:', error);
        }
    };

    const uploadPetProfilePictureFile = async (e) => {
        const file = Array.from(e.target.files)[0];
        const ref = storage.ref(`petProfilePictures/${petId}/profilePic`);
        const task = ref.put(file);

        task.on(STATE_CHANGED, (snapshot) => {
            task
            .then((d) => ref.getDownloadURL())
            .then((url) => {
                setPetPhotoURL(url);

                const petRef = firestore.collection('users').doc(profileUserID).collection('pets').doc(petId);
                petRef.update({photoURL: url}); 
            })
        })
    }
  
    const handleFollow = () => {
        const isFollowing = pet.followers && pet.followers.includes(currentUserID);
      
        const updatedFollowers = isFollowing
          ? pet.followers.filter(id => id !== currentUserID) // Remove currentUserID if already following
          : [...pet.followers, currentUserID]; // Add currentUserID if not already following
      
        firestore.collection('users').doc(profileUserID).collection('pets').doc(petId).update({
          followers: updatedFollowers
        })
        .then(() => {
          setPet(prevPet => ({
            ...prevPet,
            followers: updatedFollowers
          }));
          toast.success('Followed successfully!');
        })
        .catch(error => {
          console.error('Error updating followers:', error);
        });
    };

    const handleTabEvent = (tabName) => {
        setActiveTab(tabName);
    };

    if (!pet) {
        return <div>Loading...</div>;
    }

    return (
        <div className = "flex">
        <NavBar />
        {pet && currentUser && 

            <div className="flex-1 h-screen">
                <div id='header-container' className='h-1/5 border-l border-neutral-300'>
                    <CoverPhoto src={"/../../images/coverPhotoHolder.png"} alt={petName + " cover photo"} />
                </div>

                <div id='content-container' className='h-4/5 flex flex-row'>
                    {/* Left Panel */}
                    <div className="fixed flex flex-col w-80 h-screen bg-snow border border-neutral-300 justify-start items-center">

                        <div className="flex justify-center w-48 h-48 absolute -translate-y-24"> 
                            {petPhotoURL && <RoundIcon src={petPhotoURL} alt={petName + " profile picture"}/>}
                        </div>

                        {/* petName */} 
                        <div className="text-center mt-32 w-80">
                            <div className="text-2xl font-bold text-raisin_black ">{petName}
                            </div>
                            <div className="text-sm text-raisin_black ">{breed}
                            </div>
                        </div>

                        { currentUserID === profileUserID ? ( 
                            // Edit pet profile button
                            <button 
                            onClick={openEdit}
                            className="text-center mt-4 w-20 h-8 bg-citron hover:bg-xanthous shadow-lg text-snow font-bold rounded-lg border-none"
                            >Edit</button>
                        ) :  
                            // Follow button
                            <button 
                                onClick={handleFollow}
                                className="text-center mt-4 w-32 h-8 bg-citron hover:bg-xanthous shadow-lg text-snow font-bold rounded-lg border-none"
                            >
                            {followers.includes(currentUserID) ? 'Following' : 'Follow'}
                            </button>
                        }

                        {/* Profile Edit Pop-up */}
                        {modalIsOpen && (
                            <Modal
                            isOpen={modalIsOpen}
                            onRequestClose={() => setModalIsOpen(false)}
                            style={basicModalStyle}
                            >
                            <div>
                                <form
                                onSubmit={handleSave}
                                className="bg-snow rounded-md p-8 pb-5 w-full"
                                >
                                <h1 className="font-bold">Edit Profile</h1>

                                {/* Username */}
                                <div className="mb-4">
                                    <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-gray-700 pt-5"
                                    >
                                    <span>Pet Name</span>
                                    </label>
                                    <input
                                    type="text"
                                    id="display-name"
                                    className="mt-1 p-2 border rounded-md w-full"
                                    placeholder={pet.petname}
                                    maxLength="20"
                                    value={petName}
                                    onChange={(e) => setPetName(e.target.value)}
                                    />
                                </div>

                                {/* profile picture */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                    Change Profile Picture
                                    </label>
                                    <div id="img-preview">
                                        <Image src={pet.photoURL} alt='pet profile picture' height={200} width={200} className='cursor-pointer hover:opacity-50'/>
                                    </div>
                                    
                                    <input
                                    type="file"
                                    className="mt-1 p-2 border rounded-md w-full"
                                    accept="image/*"
                                    onChange={uploadPetProfilePictureFile}
                                    />
                                    
                                    <p className="text-sm text-gray-500 mt-1">
                                    Upload a profile picture (JPG, PNG, or GIF).
                                    </p>
                                </div>

                                {/* bio */}
                                <div className="mb-4">
                                    <label
                                    htmlFor="bio"
                                    className="block text-sm font-medium text-gray-700"
                                    >
                                    Bio
                                    </label>
                                    <textarea
                                    id="bio"
                                    className="mt-1 p-2 border rounded-md w-full resize-none"
                                    rows="4"
                                    placeholder={pet.about}
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    />
                                </div>

                                {/* buttons */}
                                <div className="flex justify-end">
                                    <button
                                    type="submit"
                                    className="bg-pistachio text-white py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 active:scale-100"
                                    >
                                    Save
                                    </button>

                                    <button
                                    type="button"
                                    onClick={() => setModalIsOpen(false)}
                                    className="bg-red-500 text-white py-2 px-4 rounded-md ml-5 transition duration-300 ease-in-out transform hover:scale-105 active:scale-100"
                                    >
                                    Cancel
                                    </button>
                                </div>
                                </form>
                            </div>
                            {/* </div> */}

                            </Modal>
                        )}
                    
                        {/* Followers and Following */}
                        <div className="text-center mt-8 flex flex-row gap-10 w-80 items-center justify-center">
                            <div className="flex flex-col items-center">
                                <span className="text-raisin_black text-xl font-bold"> {pet.followers ? pet.followers.length : 0}</span>
                                <span className="text-grass font-bold text-sm">Followers</span>
                            </div>
                            {/* <div className="flex flex-col items-center">
                                <span className="text-raisin_black text-lg font-bold">69</span>
                                <span className="text-gray-500 text-sm">Following</span>
                            </div> */}
                        </div>

                        {/* About */}
                        <div className="text-center mt-10 ">
                            <span className="text-lg font-bold text-raisin_black">About</span>
                            <span className="text-base text-raisin_black">
                                <p className="mt-5">
                                    {about}
                                </p>
                            </span>
                        </div>
                    </div>

                    <div id='main-content-container' className='flex flex-col translate-x-80 w-[calc(100%-20rem)]'>

                        <div id="tab-actions" className='flex flex-row bg-snow divide-x divide-neutral-300 border-b border-t border-neutral-300'>
                            <button 
                                className={`px-14 py-2 text-raisin_black hover:bg-citron hover:text-white focus:outline-none ${
                                            activeTab === 'Tagged Posts' ? 'bg-citron text-white' : ''
                                            }`}
                                onClick={() => handleTabEvent('Tagged Posts')}>
                                Tagged Posts
                            </button>
                            
                            <button 
                                className={`px-14 py-2 text-raisin_black hover:bg-citron hover:text-white focus:outline-none ${
                                            activeTab === 'Milestones' ? 'bg-citron text-white' : ''
                                            }`}
                                onClick={() => handleTabEvent('Milestones')}>
                                Milestones
                            </button>

                            <button 
                                className={`px-14 py-2 text-raisin_black hover:bg-citron hover:text-white focus:outline-none ${
                                            activeTab === 'Media' ? 'bg-citron text-white' : ''
                                            }`}
                                onClick={() => handleTabEvent('Media')}>
                                Media
                            </button>
                        </div>

                        <div id="tab-container" className='overflow-y-scroll'>
                            
                            {/* Tagged Posts */}
                            {activeTab === 'Tagged Posts' && (
                                <div 
                                id="showcase" 
                                className="flex justify-center w-full"
                                >
                                <div className="flex mt-10 flex-col gap-10">
                                    <Post 
                                        username={petName} 
                                        publish_date='Sept 6 at 4:30 PM'    
                                        desc='Chaos and cuddles with this dynamic quartet! 🐾🐾🐾🐾 
                                            Our two pups and two kitties bring a whole lot of joy and a touch of mayhem to our everyday life. 
                                            🐶🐱🐶🐱 They may be different species, but they share a bond thats truly heartwarming.'
                                        user_img_src={'/images/post1-image.png'}
                                        post_img_src='/images/post1-image.png'
                                    />
                                </div>
                                </div>
                            )}

                            {/* Milestones */}
                            {activeTab === 'Milestones' && (
                                <div className="w-full p-14 pl-16">
                                
                                {/* if no media... */}
                                <div className='flex flex-col items-center justify-center h-full w-full'>
                                    <i className="fa-solid fa-hippo text-8xl text-grass"></i>
                                    <div className='mt-2 font-bold text-grass'>Nothing to see here yet...</div>
                                </div>

                                {/* if w/ media */}
                                {/* <div className="grid grid-cols-8">
                                    <div className="w-36 h-36 rounded-xl bg-pale_yellow"></div>
                                    <div className="w-36 h-36 rounded-xl bg-pale_yellow"></div>
                                    <div className="w-36 h-36 rounded-xl bg-pale_yellow"></div>
                                </div> */}
                                </div>
                            )}
                            
                            {/* Media */}
                            {activeTab === 'Media' && (
                                <div className="w-full p-14 pl-16">
                                
                                {/* if no media... */}
                                <div className='flex flex-col items-center justify-center h-full w-full'>
                                    <i className="fa-solid fa-hippo text-8xl text-grass"></i>
                                    <div className='mt-2 font-bold text-grass'>Nothing to see here yet...</div>
                                </div>

                                {/* if w/ media */}
                                {/* <div className="grid grid-cols-8">
                                    <div className="w-36 h-36 rounded-xl bg-pale_yellow"></div>
                                    <div className="w-36 h-36 rounded-xl bg-pale_yellow"></div>
                                    <div className="w-36 h-36 rounded-xl bg-pale_yellow"></div>
                                </div> */}
                                </div>
                            )}
                            
                        </div>
                    </div>
                </div>
            </div>
        }
    </div>
                        
    );
}
