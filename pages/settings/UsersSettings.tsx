import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Tooltip } from '../../components/ui';

const UsersSettings: React.FC = () => {
    const { userProfile } = useContext(AppContext);
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="max-w-4xl">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Users</CardTitle>
                    <Tooltip content="User management requires a backend database and is not supported in this client-side demo.">
                        <div>
                            <Button disabled>+ Invite User</Button>
                        </div>
                    </Tooltip>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                    {getInitials(userProfile.name)}
                                </div>
                                <div>
                                    <p className="font-semibold">{userProfile.name}</p>
                                    <p className="text-sm text-slate-500">{userProfile.email}</p>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-slate-500">Admin</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UsersSettings;
