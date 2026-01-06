import React from 'react';
import { Warning } from '../types';
import { Button } from './UI';

interface WarningBannerProps {
    warning: Warning;
    onDismiss: () => void;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ warning, onDismiss }) => {
    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-r shadow-sm">
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <h3 className="text-red-800 font-bold mb-1">Account Warning</h3>
                    <p className="text-red-700 text-sm">{warning.reason}</p>
                    <p className="text-red-500 text-xs mt-1">
                        Sent on {new Date(warning.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <Button
                    variant="secondary"
                    className="text-xs bg-white text-red-700 hover:bg-red-50 border-red-200"
                    onClick={onDismiss}
                >
                    Dismiss
                </Button>
            </div>
        </div>
    );
};
