import React, { useEffect, useState } from 'react';
import { STATE_CHANGED, firestore, storage } from '@/src/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, startAfter, getDocs, where } from 'firebase/firestore';

import { useRouter } from 'next/router';
import { useUserData, useUserIDfromUsername } from '@/src/lib/hooks'; // Import the useUser hook
import { formatDateWithWords } from '../../../lib/formats';
import { editPetProfileStyle } from '../../../lib/modalstyle';

import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast'
import Modal from 'react-modal'; // Import the Modal component  

import NavBar from '@/src/components/NavBar';
import ExpandedNavBar from '@/src/components/ExpandedNavBar';
import Loader from '@/src/components/Loader';
import CoverPhoto from '@/src/components/CoverPhoto';
import RoundIcon from '@/src/components/RoundIcon';
import PostSnippet from '@/src/components/PostSnippet';
import withAuth from '@/src/components/withAuth';

function PetProfilePage() {

    useEffect(() => {
        if (document.getElementById('root')) {
            Modal.setAppElement('#root');
        }
    }, []);

    // variables for getting pet's information through current/profileIDs
    const router = useRouter();
    const { petID } = router.query;
    const currentUser = useUserData(); // Get the logged-in user
    const currentUserID = useUserIDfromUsername(currentUser.username);

    // variables for pet profile
    const [pet, setPet] = useState(null);
    const [petName, setPetName] = useState(null);
    const [about, setAbout] = useState(null);
    const [followers, setFollowers] = useState(null);
    // const [following, setFollowing] = useState(null);
    const [sex, setSex] = useState(null);
    const [breed, setBreed] = useState(null);
    const [birthdate, setBirthdate] = useState(null);
    const [birthplace, setBirthplace] = useState(null);
    const [favoriteFood, setFavoriteFood] = useState(null);
    const [hobbies, setHobbies] = useState(null);
    const [petPhotoURL, setPetPhotoURL] = useState(null);
    const [hidden, setHidden] = useState(null);

    const [activeTab, setActiveTab] = useState('Tagged Posts');
    const [modalIsOpen, setModalIsOpen] = useState(false);

    // variables for pet's owner profile
    const [petOwnerID, setPetOwnerID] = useState(null);
    const [petOwnerUsername, setPetOwnerUsername] = useState(null);
    const [petOwnerDisplayName, setPetOwnerDisplayName] = useState(null);
    const [petOwnerPhotoURL, setPetOwnerPhotoURL] = useState(null);
    const [petOwnerCoverPhotoURL, setPetOwnerCoverPhotoURL] = useState(null);

    // editing variables
    const [editedAbout, setEditedAbout] = useState(null);
    const [editedPetFavoriteFood, setEditedPetFavoriteFood] = useState(null);
    const [editedPetHobbies, setEditedPetHobbies] = useState(null);

    useEffect(() => {
        let unsubscribe;

        if (petID) {
            const petRef = firestore.collection('pets').doc(petID);
            unsubscribe = petRef.onSnapshot((doc) => {
                if (doc.exists) {
                    setPet({
                        id: doc.id,
                        ...doc.data()
                    });

                    setPetName(doc.data().petName);
                    setAbout(doc.data().about);
                    setFollowers(doc.data().followers);
                    setSex(doc.data().sex);
                    setBreed(doc.data().breed);
                    setPetPhotoURL(doc.data().photoURL);
                    setBirthdate(doc.data()?.birthdate);
                    setBirthplace(doc.data()?.birthplace);
                    setFavoriteFood(doc.data().favoriteFood);
                    setHobbies(doc.data().hobbies);
                    setHidden(doc.data()?.hidden);

                    setPetOwnerID(doc.data().petOwnerID);
                    setPetOwnerUsername(doc.data().petOwnerUsername);
                    setPetOwnerDisplayName(doc.data().petOwnerDisplayName);
                    setPetOwnerPhotoURL(doc.data().petOwnerPhotoURL);
                    setPetOwnerCoverPhotoURL(doc.data().petOwnerCoverPhotoURL);

                    setEditedPetName(doc.data().petName);
                    setEditedAbout(doc.data().about);
                    setEditedPetFavoriteFood(doc.data().favoriteFood);
                    setEditedPetHobbies(doc.data().hobbies);
                } else {
                    setPet(null);
                }
            });
        } else {
            setPet(null);
        }

        return unsubscribe;
    }, [petID]);

    const openEdit = () => {
        if (currentUser && currentUserID === petOwnerID) { // Check if the logged-in user is the owner of the pet
            setModalIsOpen(true); // Open the modal when editing starts
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const petRef = firestore.collection('pets').doc(petID);
        const batch = firestore.batch();

        try {
            const uploadFile = async (ref, file, field) => {
                const task = ref.put(file);
                task.on(
                    'state_changed',
                    (snapshot) => {
                       const progress = Math.round(
                           (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                       );
                    },
                    (error) => {
                       toast.error('Error uploading file.');
                    },
                    async () => {
                       toast.success('Photo uploaded successfully!');
                       let url = await task.snapshot.ref.getDownloadURL(); 
                       const petRef = firestore.doc(`pets/${petID}`);
                       petRef.update({ [field]: url });
                    }
                );
            };

            if (selectedProfileFile) {
                await uploadFile(storage.ref(`petProfilePictures/${petID}/profilePic`), selectedProfileFile, 'photoURL');
            }

            const updateData = {
                petName: editedPetName,
                about: editedAbout,
                favoriteFood: editedPetFavoriteFood,
                hobbies: editedPetHobbies,
                // photoURL: petPhotoURL
            };

            batch.update(petRef, updateData);

            await batch.commit();
            setModalIsOpen(false);
            setSelectedProfileFile(null);
            setPreviewProfileUrl(null);
            toast.success(petName + '`s profile updated successfully!');
        } catch (error) {
            console.error('Error saving pet:', error);
        }
    };

    const [selectedProfileFile, setSelectedProfileFile] = useState(null);
    const [previewProfileUrl, setPreviewProfileUrl] = useState(null);

    const handleProfileFileSelect = (event) => {
        const file = event.target.files[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; // Add more allowed types if needed
      
        if (file !== undefined && allowedTypes.includes(file.type)) {
            setSelectedProfileFile(file);
            setPreviewProfileUrl(URL.createObjectURL(file));
        } else {
            event.target.value = null;
            setSelectedProfileFile(null);
            setPreviewProfileUrl(null);
            toast.error('Invalid file type. Only PNG, JPEG, and GIF allowed.')
        }
    };

    const uploadPetProfilePictureFile = async (e) => {
        const file = Array.from(e.target.files)[0];
        const ref = storage.ref(`petProfilePictures/${petID}/profilePic`);
        const task = ref.put(file);

        task.on(STATE_CHANGED, (snapshot) => {
            task
                .then((d) => ref.getDownloadURL())
                .then((url) => {
                    setPetPhotoURL(url);

                    const petRef = firestore.collection('pets').doc(petID);
                    petRef.update({ photoURL: url });
                })
        })
    }

    const handleFollow = () => {
        const isFollowing = pet.followers && pet.followers.includes(currentUserID);

        const updatedFollowers = isFollowing
            ? pet.followers.filter(id => id !== currentUserID) // Remove currentUserID if already following
            : [...pet.followers, currentUserID]; // Add currentUserID if not already following

        firestore.collection('pets').doc(petID).update({
            followers: updatedFollowers
        })
            .then(() => {
                setPet(prevPet => ({
                    ...prevPet,
                    followers: updatedFollowers
                }));
                // Show toast notification based on whether the user was followed or unfollowed
                if (isFollowing) {
                    toast.success('Unfollowed successfully!');
                } else {
                    toast.success('Followed successfully!');
                }
            })
            .catch(error => {
                console.error('Error updating followers:', error);
            });
    };

    const handleTabEvent = (tabName) => {
        setActiveTab(tabName);
    };

    const [editedPetName, setEditedPetName] = useState(null);
    const [editPetNameValid, setEditPetNameValid] = useState(true);

    const handlePetNameVal = (val) => {
        const checkPetNameValue = val;

        if (checkPetNameValue.startsWith(' ') || checkPetNameValue.endsWith(' ') || checkPetNameValue.includes('  ')) {
            setEditedPetName(checkPetNameValue);
            setEditPetNameValid(false);
        } else if ((checkPetNameValue.length >= 3 && checkPetNameValue.length <= 15)) {
            setEditedPetName(checkPetNameValue);
            setEditPetNameValid(true);
        } else if (checkPetNameValue.length < 3 || checkPetNameValue.length > 15) {
            setEditedPetName(checkPetNameValue);
            setEditPetNameValid(false);
        }
    };

    const [taggedPosts, setTaggedPosts] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initial fetch
    useEffect(() => {
        if (!petID) return;

        setLoading(true);

        const q = query(
            collection(firestore, "posts"),
            where("postPets", "array-contains", petID),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const newPosts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setTaggedPosts(newPosts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [petID]);

    // Function to fetch more posts
    const fetchMorePosts = async () => {
        if (!lastVisible || loading) return;

        setLoading(true);

        const nextQuery = query(
            collection(firestore, "posts"),
            where("postPets", "array-contains", petID),
            startAfter(lastVisible),
            limit(5)
        );

        const querySnapshot = await getDocs(nextQuery);
        if (!querySnapshot.empty) {
            const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            const newPosts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

            setLastVisible(newLastVisible);
            setTaggedPosts(prevPosts => [...prevPosts, ...newPosts]);
        }

        setLoading(false);
    };
    
    if (!pet) {
        return (
            <Loader />
        );
    }

    return (
        <div id="root" className='flex'>
            <div className='w-fit'>
                {(petOwnerPhotoURL && petOwnerUsername) && <ExpandedNavBar 
                    props={{
                    userPhotoURL: petOwnerPhotoURL,
                    username: petOwnerUsername,
                    activePage: "Profile",
                    expanded: false
                    }}
                />}
            </div>

            {pet && currentUser &&
                <div className="h-screen w-full">
                    <div id='header-container' className='h-1/5 border-l border-neutral-300'>
                        <CoverPhoto src={petOwnerCoverPhotoURL} alt={petOwnerUsername + " cover photo"} />
                    </div>

                    <div id='content-container' className='h-4/5 flex flex-row'>

                        {/* Profile Picture */}
                        <div className="flex justify-center w-48 h-48 absolute -translate-y-24 shadow-lg rounded-full ml-16 z-10">
                            {petPhotoURL && <RoundIcon src={petPhotoURL} alt={petName + " profile picture"} />}
                        </div>

                        {/* Left Panel */}
                        <div className="fixed flex flex-col w-80 h-4/5 bg-snow border border-neutral-300 justify-start items-center overflow-y-auto overflow-x-hidden">

                            {/* petName */}
                            <div className="text-center mt-32 w-80">
                                <div className="text-2xl font-bold text-raisin_black ">
                                    {petName}
                                </div>

                                <div className="text-sm text-raisin_black mt-2">
                                    {breed} · <Link href={'/user/' + petOwnerUsername} className='hover:text-grass hover:font-semibold transition-all'>@{petOwnerUsername}</Link>
                                </div>
                            </div>

                            {currentUserID === petOwnerID ? (
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
                                    style={editPetProfileStyle}
                                >

                                    <form
                                        onSubmit={handleSave}
                                        className="flex flex-col h-full w-full"
                                    >

                                        <h1 className='font-bold text-xl'>Edit {petName}`s Profile</h1>

                                        <div className='flex flex-row w-full h-full'>
                                            <div className='flex flex-col justify-center items-center h-full w-1/2'>
                                                <div>
                                                    <div className="h-full w-full flex flex-col justify-center items-center">
                                                        <h1 className='font-medium mb-2'>Change Profile Picture</h1>

                                                        <div>
                                                            <label htmlFor='pet-profile-pic'>
                                                                <div className='relative mx-auto w-full cursor-pointer' style={{height: '200px', width: '200px'}}>
                                                                    {previewProfileUrl ? (
                                                                        <Image src={previewProfileUrl} alt="Preview" layout='fill' className='object-cover rounded-full'/>
                                                                    ): (petPhotoURL && <Image src={petPhotoURL} alt={petName + " cover photo"} layout='fill' className='object-cover rounded-full'/>)}
                                                                </div>
                                                                {/* <Image src={pet.photoURL} alt='pet profile picture' height={200} width={200} className='rounded-full shadow-lg cursor-pointer hover:opacity-50' /> */}
                                                            </label>
                                                        </div>

                                                        <input
                                                            type="file"
                                                            id='pet-profile-pic'
                                                            className="hidden"
                                                            onChange={handleProfileFileSelect}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className='flex flex-col justify-center items-center h-full w-1/2'>
                                                <div className='w-72'>
                                                    <div className="mb-4 w-full">
                                                        <label
                                                            htmlFor="username"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            <span>Pet Name</span>
                                                        </label>

                                                        <input
                                                            type="text"
                                                            id="pet-name"
                                                            className="mt-1 p-2 border rounded-md w-full"
                                                            minLength={3}
                                                            maxLength={15}
                                                            value={editedPetName}
                                                            placeholder='What`s your pet`s name?'
                                                            onChange={(e) => handlePetNameVal(e.target.value)}
                                                            required
                                                        />

                                                        <PetNameMessage petName={editedPetName} petNameValid={editPetNameValid} loading={false} />
                                                    </div>

                                                    {/* About */}
                                                    <div className="w-full">
                                                        <label
                                                            htmlFor="about"
                                                            className="mt-2 block text-sm font-medium text-gray-700"
                                                        >
                                                            About
                                                        </label>
                                                        <textarea
                                                            id="bio"
                                                            className="mt-1 p-2 border rounded-md w-full resize-none"
                                                            rows="4"
                                                            value={editedAbout}
                                                            placeholder='Tell us about your pet!'
                                                            onChange={(e) => setEditedAbout(e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Hobbies */}
                                                    <div className="mb-4 w-full">
                                                        <label
                                                            htmlFor="hobbies"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            <span>Hobbies</span>
                                                        </label>

                                                        <input
                                                            type="text"
                                                            id="hobbies"
                                                            className="mt-1 p-2 border rounded-md w-full"
                                                            maxLength="50"
                                                            value={editedPetHobbies}
                                                            placeholder='What`s your pet`s hobbies?'
                                                            onChange={(e) => setEditedPetHobbies(e.target.value)}
                                                            required
                                                        />
                                                    </div>

                                                    {/* Favorite Food */}
                                                    <div className="mb-4 w-full">
                                                        <label
                                                            htmlFor="faveFood"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            <span>Favorite Food</span>
                                                        </label>

                                                        <input
                                                            type="text"
                                                            id="faveFood"
                                                            className="mt-1 p-2 border rounded-md w-full"
                                                            maxLength="30"
                                                            value={editedPetFavoriteFood}
                                                            placeholder='What`s your pet`s favorite food?'
                                                            onChange={(e) => setEditedPetFavoriteFood(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='w-full flex flex-row justify-evenly items-center p-4  mb-4 rounded-lg font-semibold bg-snow'>
                                            <p>Gender: {sex}</p>
                                            <p>Breed: {breed}</p>
                                            <p>Birthdate: {formatDateWithWords(birthdate)}</p>
                                            <p>Birthplace: {birthplace}</p>
                                        </div>

                                        <div className='flex justify-end'>
                                            <button
                                                type="button"
                                                onClick={() => setModalIsOpen(false)}
                                                className="bg-red-500 text-white py-2 px-4 rounded-md ml-5 transition duration-300 ease-in-out transform hover:scale-105 active:scale-100"
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={!editPetNameValid}
                                                className={`py-2 px-4 rounded-md bg-pistachio text-white transition-all ${editPetNameValid ? 'hover:scale-105 active:scale-100' : 'opacity-50'}`}>
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                </Modal>
                            )}

                            {/* Followers and Following */}
                            <div className="text-center mt-8 flex flex-row gap-10 w-80 items-center justify-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-raisin_black text-xl font-bold"> {pet.followers ? pet.followers.length : 0}</span>
                                    <span className="text-grass font-bold text-sm">Followers</span>
                                </div>
                            </div>

                            {/* About */}
                            <div className="text-center mt-10 flex flex-col gap-2 w-full max-w-full">
                                <div className="text-lg font-bold text-raisin_black">About</div>
                                <div className="text-base text-raisin_black pl-6 pr-6 whitespace-normal break-all w-full max-w-full">
                                    {about}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="mt-6 flex flex-col items-center w-full gap-4">
                                {hidden && !hidden.includes('breed') ? (
                                    <div id="icons" className='flex flex-row gap-2 items-center'>
                                        <i className="fa-solid fa-dog"></i>
                                        <p>{breed}</p>
                                    </div>
                                ) : ''}

                                {hidden && !hidden.includes('sex') ? (
                                    <div id="icons" className='flex flex-row gap-2 items-center'>
                                        <i className="fa-solid fa-venus-mars"></i>
                                        <p>{sex}</p>
                                    </div>
                                ) : ''}

                                {hidden && !hidden.includes('birthdate') ? (
                                    <div id="icons" className='flex flex-row gap-2 items-center'>
                                        <i className="fa-solid fa-calendar"></i>
                                        <p>{birthdate}</p>  
                                    </div>
                                ) : ''}

                                {hidden && !hidden.includes('birthplace') ? (
                                    <div id="icons" className='flex flex-row gap-2 items-center'>
                                        <i className="fa-solid fa-map-marker-alt"></i>
                                        <p>{birthplace}</p> 
                                    </div>
                                ) : ''}

                                {hidden && !hidden.includes('favoriteFood') ? (
                                    <div id="icons" className='flex flex-row gap-2 items-center'>
                                        <i className="fa-solid fa-utensils"></i>
                                        <p>{favoriteFood}</p> 
                                    </div>
                                ) : ''}

                                {hidden && !hidden.includes('hobbies') ? (
                                    <div id="icons" className='flex flex-row gap-2 items-center'>
                                        <i className="fa-solid fa-heart"></i>
                                        <p>{hobbies}</p> 
                                    </div>
                                ) : ''}
                            </div>

                        </div>

                        <div id='main-content-container' className='flex flex-col translate-x-80 w-[calc(100%-20rem)]'>

                            <div id="tab-actions" className='flex flex-row bg-snow divide-x divide-neutral-300 border-b border-t border-neutral-300'>
                                <button
                                    className={`px-14 py-2 text-raisin_black hover:bg-citron hover:text-white focus:outline-none ${activeTab === 'Tagged Posts' ? 'bg-citron text-white' : ''
                                        }`}
                                    onClick={() => handleTabEvent('Tagged Posts')}>
                                    Tagged Posts
                                </button>

                                <button
                                    className={`px-14 py-2 text-raisin_black hover:bg-citron hover:text-white focus:outline-none ${activeTab === 'Milestones' ? 'bg-citron text-white' : ''
                                        }`}
                                    onClick={() => handleTabEvent('Milestones')}>
                                    Milestones
                                </button>

                                <button
                                    className={`px-14 py-2 text-raisin_black hover:bg-citron hover:text-white focus:outline-none ${activeTab === 'Media' ? 'bg-citron text-white' : ''
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
                                        <div className='flex flex-col mt-8 mb-8 gap-8 items-center'>
                                            {taggedPosts.map((post, index) => (
                                                <div key={post.id}>
                                                    <PostSnippet
                                                    props={{
                                                        currentUserID: currentUserID,
                                                        postID: post.id,
                                                        postBody: post.postBody,
                                                        postCategory: post.postCategory,
                                                          postTrackerLocation: post.postTrackerLocation,
                                                        postPets: post.postPets,
                                                        postDate: post.postDate,
                                                        imageUrls: post.imageUrls,
                                                        authorID: post.authorID,
                                                        authorDisplayName: post.authorDisplayName,
                                                        authorUsername: post.authorUsername,
                                                        authorPhotoURL: post.authorPhotoURL,
                                                        likes: post.likes,
                                                        comments: post.comments,
                                                        isEdited: post.isEdited,
                                                    }}
                                                    />
                                                </div>
                                            ))}

                                            {loading && <div>Loading...</div>}

                                            {lastVisible && (
                                                <button
                                                className='px-4 py-2 text-white bg-grass rounded-lg w-fit text-sm hover:bg-raisin_black transition-all'
                                                onClick={fetchMorePosts}
                                                disabled={loading}
                                                >
                                                Load More
                                                </button>
                                            )}
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
    )
}

function PetNameMessage({ petName, petNameValid, loading }) {
    if (loading) {
        return <p className='mt-2 ml-2'>Checking...</p>;
    } else if (petName === '') {
        return null;
    } else if (String(petName).length < 3 && String(petName).length > 15 && !petNameValid) {
        return <p className='mt-2 ml-2'>Pet name should have 3-15 characters!</p>;
    } else if (String(petName).includes('  ')) {
        return <p className="mt-2 ml-2">Please have only one space in-between.</p>;
    } else if ((String(petName).startsWith(' ') || String(petName).endsWith(' ')) && !petNameValid) {
        return <p className="mt-2 ml-2">No spaces allowed at either end.</p>;
    } else if (!petNameValid) {
        return <p className="mt-2 ml-2">Only periods and underscores allowed for special characters.</p>;
    }
}

export default withAuth(PetProfilePage);