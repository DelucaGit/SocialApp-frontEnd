import React, { useState } from 'react';
import { updateProfile } from '../services/dataService';
import { User } from '../types';

interface EditProfileModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedUser: User) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
    const [bio, setBio] = useState(user.bio || '');
    const [profileImagePath, setProfileImagePath] = useState(user.profileImagePath || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Calls the dataService to update backend and localStorage
            const updatedUser = await updateProfile(bio, profileImagePath);
            onUpdate(updatedUser); // Update parent state
            onClose();
        } catch (err) {
            console.error("Failed to update profile", err);
            setError("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="profileImage">
                            Profile Image URL
                        </label>
                        <input
                            id="profileImage"
                            type="text"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="https://example.com/image.png"
                            value={profileImagePath}
                            onChange={(e) => setProfileImagePath(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Paste a direct link to an image (jpg, png, etc).
                        </p>
                    </div>

                    {profileImagePath && (
                        <div className="mb-4 flex justify-center">
                            <img 
                                src={profileImagePath} 
                                alt="Profile Preview" 
                                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://www.gravatar.com/avatar/${user.username}?d=identicon`;
                                }}
                            />
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            rows={3}
                            placeholder="Tell us about yourself"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;