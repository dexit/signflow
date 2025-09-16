import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../../components/ui';

const ProfileSettings: React.FC = () => {
    const { userProfile, updateUserProfile } = useContext(AppContext);
    const [profile, setProfile] = useState({
        name: userProfile.name,
        email: userProfile.email,
    });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        updateUserProfile(profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleChange = (key: keyof typeof profile, value: string) => {
        setProfile(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-4xl">
            <Card>
                <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input 
                            label="Full Name" 
                            value={profile.name}
                            onChange={e => handleChange('name', e.target.value)}
                        />
                        <Input 
                            label="Email Address" 
                            type="email"
                            value={profile.email}
                            onChange={e => handleChange('email', e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end items-center pt-6 space-x-4">
                        {saved && <p className="text-sm text-emerald-600">Profile saved!</p>}
                        <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSettings;
