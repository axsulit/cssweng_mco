import React, { useEffect, useState } from 'react'
import { useUserData } from '../lib/hooks';
import { auth, firestore, googleAuthProvider } from '../lib/firebase'
import { getAuth, updatePassword } from "firebase/auth";
import { useAllUsersAndPets } from '../lib/hooks';
import Router from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Switch } from '@headlessui/react';
import Modal from 'react-modal';
import { changePasswordStyle } from '../lib/modalstyle';
import { checkPassword } from '../lib/formats';
import withAuth from '../components/withAuth';
import NavBar from '../components/NavBar';
import RoundIcon from '../components/RoundIcon';
import CoverPhoto from '../components/CoverPhoto';
import PostSnippet from '../components/PostSnippet';
import ExpandedNavBar from '../components/ExpandedNavBar';

function Settings() {
    const { user, username, userPhotoURL } = useUserData();
    const router = Router;
    const [userRef, setUserRef] = useState('');
    const [petsRef, setPetsRef] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const [userSwitches, setUserSwitches] = useState([
        { id: 'Gender', value: 'gender',enabled: true },
        { id: 'Birthday', value: 'birthdate', enabled: true },
        { id: 'Location', value: 'location', enabled: true },
        { id: 'Contact Number', value: 'contactNumber', enabled: true },
        { id: 'E-mail', value: 'email', enabled: true },
      ]);
    
    const [petSwitches, setPetSwitches] = useState([
    { id: 'Pet Breed', value: 'breed', enabled: true },
    { id: 'Pet Sex', value: 'sex', enabled: true },
    { id: 'Pet Birthday', value: 'birthdate', enabled: true },
    { id: 'Pet Location', value: 'birthplace', enabled: true },
    { id: 'Favorite Food', value: 'favoritefood', enabled: true },
    { id: 'Hobby', value: 'hobbies', enabled: true },
    ]);

    useEffect(() => {
        const userDocRef = firestore.collection('users').doc(user.uid);
        const petsQueryRef = firestore.collection('pets').where('petOwnerID', '==', user.uid);
    
        userDocRef.get().then((doc) => {
          if (doc.exists) {
            setUserRef(doc.data());

            const array = doc.data().hidden === undefined ? [] : doc.data().hidden;
            const newSwitches = userSwitches.map(switchItem => {
            if (array.includes(switchItem.value)) {
                return { ...switchItem, enabled: false };
            }
            return switchItem;
            });
        
            setUserSwitches(newSwitches);

            // Add enabled switches to enabledUserSwitches
            const newDisabledUserSwitches = newSwitches.filter(switchItem => !switchItem.enabled).map(switchItem => switchItem.value);
            setDisabledUserSwitches(newDisabledUserSwitches);
          } else {
            console.log("No such document!");
          }
        }).catch((error) => {
          console.log("Error getting document:", error);
        });
    
        petsQueryRef.get().then((querySnapshot) => {
          const pets = [];
          querySnapshot.forEach((doc) => {
            pets.push(doc.data());
          });
          setPetsRef(pets);
          const array = pets[0].hidden === undefined ? [] : pets[0].hidden;
            const newSwitches = petSwitches.map(switchItem => {
            if (array.includes(switchItem.value)) {
                return { ...switchItem, enabled: false };
            }
            return switchItem;
            });
        
            setPetSwitches(newSwitches);

            const newDisabledPetSwitches = newSwitches.filter(switchItem => !switchItem.enabled).map(switchItem => switchItem.value);
            setDisabledPetSwitches(newDisabledPetSwitches);
        }).catch((error) => {
          console.log("Error getting documents: ", error);
        });
      }, []);

    const openChangePassword = () => {
          setModalIsOpen(true); // Open the modal when editing starts
    };

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleChangePassword = (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
        }

        if (!checkPassword(newPassword)) {
        setPasswordError('Check password format');
        return;
        }
        
        setPasswordError('');

        // insert change password functionality
        const auth = getAuth();
        const user = auth.currentUser;

        updatePassword(user, newPassword)
        .then(() => {
            // Password updated successfully
            // You can perform any additional actions here
            setNewPassword('');
            setConfirmPassword('');
            setModalIsOpen(false);
            toast.success("Password updated successfully!");
        })
        .catch((error) => {
            // Handle password update error
            toast.error("Try logging in again before changing.")
        });  
    };

    // useEffect(() => {
    //     const array = userRef.hidden === undefined ? '' : userRef.hidden;
    //     const newSwitches = switches.map(switchItem => {
    //       if (array.includes(switchItem.value)) {
    //         return { ...switchItem, enabled: true };
    //       }
    //       return switchItem;
    //     });
    
    //     setSwitches(newSwitches);
    //   }, []); // Dependency array. Update switches whenever this array changes.

    const petSwitchIDs = ['Pet Sex', 'Pet Breed', 'Pet Birthday', 'Pet Location', 'Favorite Food', 'Hobbby'];
    const userSwitchIDs = ['Gender', 'Birthday', 'Location', 'Contact Number', 'E-mail'];
    const [disabledPetSwitches, setDisabledPetSwitches] = useState([]);
    const [disabledUserSwitches, setDisabledUserSwitches] = useState([]);


    const toggleUserSwitch = (id, value) => {
        setUserSwitches(userSwitches.map(switchItem =>
            switchItem.id === id ? { ...switchItem, enabled: !switchItem.enabled } : switchItem
        ));
        if (userSwitchIDs.includes(id)) {
            if (disabledUserSwitches.includes(value)) {
                setDisabledUserSwitches(disabledUserSwitches.filter((switchVal) => switchVal !== value));
            } else {
                setDisabledUserSwitches([...disabledUserSwitches, value]);
            }
        }
    };

    const togglePetSwitch = (id, value) => {
        setPetSwitches(petSwitches.map(switchItem =>
            switchItem.id === id ? { ...switchItem, enabled: !switchItem.enabled } : switchItem
        ));
        if (petSwitchIDs.includes(id)) {
            if (disabledPetSwitches.includes(value)) {
                setDisabledPetSwitches(disabledPetSwitches.filter((switchVal) => switchVal !== value));
            } else {
                setDisabledPetSwitches([...disabledPetSwitches, value]);
            }
        }
        console.log(disabledPetSwitches);
    };

    async function hideInformation(event) {
        event.preventDefault();
    
        const updateHiddenField = async () => {
            const userRef = firestore.collection('users').doc(user.uid);
            const petsRef = firestore.collection('pets').where('petOwnerID', '==', user.uid);
    
            const batch = firestore.batch();
    
            // Update user document
            batch.update(userRef, { hidden: disabledUserSwitches });
    
            // Update pet documents
            const petQuerySnapshot = await petsRef.get();
            petQuerySnapshot.forEach((doc) => {
                batch.update(doc.ref, { hidden: disabledPetSwitches });
            });
    
            try {
                await batch.commit();
                console.log('Documents updated successfully');
            } catch (error) {
                console.error('Error updating documents:', error);
            }
        };
    
        await updateHiddenField();
    }
    
    return (
        <div>
            <div id="root" className='flex flex-row h-screen paw-background'>
                {/* home navbar */}
                <div className='w-1/6'>
                    {(userPhotoURL && username) && <ExpandedNavBar 
                        props={{
                        userPhotoURL: userPhotoURL,
                        username: username,
                        activePage: "Settings"
                        }}
                    />}
                </div>

                <div className="w-5/6 flex justify-center items-center h-full">
                    <form
                        onSubmit={hideInformation}
                        className="bg-pale_yellow rounded-lg p-10 w-1/2 overflow-auto h-screen">
                        <h1 className="font-bold text-3xl">Settings</h1>
                        <br></br>

                        <label htmlFor="user-visibility" className="block font-bold text-gray-700 text-xl ">Security Settings</label>
                        <br></br>
                        {/* Change password */}
                        <div className="mb-4">
                            <button onClick={openChangePassword} className="bg-xanthous w-full mt-2 text-white text-sm p-2 rounded-md hover:opacity-80 transition-all">
                                Change Password
                            </button>
                            {modalIsOpen && (
                                <Modal
                                isOpen={modalIsOpen}
                                onRequestClose={() => setModalIsOpen(false)}
                                style={changePasswordStyle}
                                >
                                    
                                    <div className='w-72'>
                                        <div className='relative w-[100%] justify-evenly items-left flex flex-col mb-3'>
                                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                                            <input 
                                                type="password" 
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value.trim())}
                                                className={`hover-tooltip bg-light_yellow rounded-xl mt-3 p-4 w-[90%] h-12 text-lg font-semibold outline-none ${newPassword === '' ? '': !checkPassword(newPassword) ? 'border border-red-500' : 'border border-green-500'}`} placeholder='Password'/>
                                            
                                            <div className="tooltip hidden bg-gray-800 text-white text-sm rounded p-1 absolute top-0 left-full transform -translate-x-3 translate-y-1 tracking-wide">
                                                <p className='text-base text-slate-700'>Password must:</p>
                                                <ul className="list-none pl-2">
                                                    <li className='text-sm text-slate-600'><span className={`bullet ${/^.{8,16}$/.test(newPassword) ? 'bg-green-500':'bg-slate-300'}`}></span>be 8-16 characters long.</li>
                                                    <li className='text-sm text-slate-600'><span className={`bullet ${/[A-Z]/.test(newPassword) ? 'bg-green-500':'bg-slate-300'}`}></span>contain at least one uppercase letter.</li>
                                                    <li className='text-sm text-slate-600'><span className={`bullet ${/[a-z]/.test(newPassword) ? 'bg-green-500':'bg-slate-300'}`}></span>contain at least one lowercase letter.</li>
                                                    <li className='text-sm text-slate-600'><span className={`bullet ${/[0-9]/.test(newPassword) ? 'bg-green-500':'bg-slate-300'}`}></span>contain at least one digit.</li>
                                                    <li className='text-sm text-slate-600'><span className={`bullet ${/\W/.test(newPassword) ? 'bg-green-500':'bg-slate-300'}`}></span>contain at least one special character.</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                        <input 
                                            type="password" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value.trim())}
                                            className='bg-light_yellow rounded-xl mt-3 mb-4 p-4 w-[90%] h-12 text-lg font-semibold outline-none' placeholder='Confirm Password'/>
                                        {passwordError && <p className="text-red-500">{passwordError}</p>}
                                        <button onClick={handleChangePassword}>Change Password</button>
                                    </div>
                                </Modal>
                            )}
                        </div>
                        <br></br>

                        {/* User Visibility Settings*/}
                        <div className="mb-4 justify-between">
                            <label htmlFor="user-visibility" className="block font-bold text-gray-700 text-xl">User Visibility Settings</label>
                            <br></br>
                            {userSwitches.map((switchItem) => (
                                <div key={switchItem.id} className="flex justify-between items-center mb-4">
                                    <span>{switchItem.id}</span>
                                    <Switch
                                        checked={switchItem.enabled}
                                        onChange={() => toggleUserSwitch(switchItem.id, switchItem.value)}
                                        className={`${switchItem.enabled ? 'bg-green-400' : 'bg-zinc-500'
                                            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`}
                                    >
                                        <span className="sr-only">Enable notifications</span>
                                        <span
                                            className={`${switchItem.enabled ? 'translate-x-6' : 'translate-x-1'
                                                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                        />
                                    </Switch>
                                </div>
                            ))}
                        </div>
                        <br></br>


                        {/* Pet Visibility Settings */}
                        <div className="mb-4">
                            <label htmlFor="pet-visibility" className="block text-xl font-bold text-gray-700">Pet Visibility Settings</label>
                            <br></br>
                            {petSwitches.map((switchItem) => (
                                <div key={switchItem.id} className="flex justify-between items-center mb-4">
                                    <span>{switchItem.id}</span>
                                    <Switch
                                        checked={switchItem.enabled}
                                        onChange={() => togglePetSwitch(switchItem.id, switchItem.value)}
                                        className={`${switchItem.enabled ? 'bg-green-400' : 'bg-zinc-500'
                                            } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`}
                                    >
                                        <span className="sr-only">Enable notifications</span>
                                        <span
                                            className={`${switchItem.enabled ? 'translate-x-6' : 'translate-x-1'
                                                } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                        />
                                    </Switch>
                                </div>
                            ))}
                        </div>

                        {/* buttons */}
                        <br></br>
                        <div className="flex justify-end">
                            <button type='submit' className="py-2 px-4 rounded-md bg-pistachio text-white transition-all hover:scale-105 active:scale-100">
                                Save Changes
                            </button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}


export default withAuth(Settings);